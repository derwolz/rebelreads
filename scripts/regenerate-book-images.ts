/**
 * Regenerate Book Images Script
 * 
 * This script regenerates book-card and mini images for existing books
 * It reads the full/detail image for each book and generates the smaller variants
 * in their correct directories.
 */

import { db } from '../server/db';
import { bookImages } from '../shared/schema';
import { sirenedImageBucket } from '../server/services/sirened-image-bucket';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { dbStorage } from '../server/storage';

// Temporary file interface matching the UploadedFile interface in sirenedImageBucket
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

async function regenerateBookImages() {
  console.log('Starting image regeneration process...');
  
  try {
    // Get all book IDs that have images
    const bookIdsResult = await db.select({ bookId: bookImages.bookId })
      .from(bookImages)
      .groupBy(bookImages.bookId);
    
    const bookIds = bookIdsResult.map(row => row.bookId);
    console.log(`Found ${bookIds.length} books with images`);
    
    // Process each book
    for (const bookId of bookIds) {
      console.log(`\nProcessing book ID: ${bookId}`);
      
      // Get the book's detail/full image
      const [detailImage] = await db.select()
        .from(bookImages)
        .where(
          and(
            eq(bookImages.bookId, bookId),
            eq(bookImages.imageType, 'book-detail')
          )
        );
      
      if (!detailImage) {
        console.log(`No detail image found for book ID: ${bookId}, skipping...`);
        continue;
      }
      
      console.log(`Found detail image: ${detailImage.imageUrl}`);
      
      // Get the image from storage
      const storageKey = detailImage.imageUrl.replace('/api/storage/', '');
      const imageBuffer = await sirenedImageBucket.getImage(storageKey);
      
      if (!imageBuffer) {
        console.log(`Could not retrieve image for book ID: ${bookId}, skipping...`);
        continue;
      }
      
      console.log(`Successfully retrieved detail image for book ID: ${bookId}`);
      
      // Create a file object for the sirenedImageBucket service
      const file: UploadedFile = {
        fieldname: 'file',
        originalname: path.basename(storageKey),
        encoding: '7bit',
        mimetype: 'image/webp',
        buffer: imageBuffer,
        size: imageBuffer.length
      };
      
      // Generate the smaller variants
      console.log(`Generating smaller variants for book ID: ${bookId}...`);
      try {
        const generatedImages = await sirenedImageBucket.generateAdditionalBookImages(file, bookId);
        
        // Update the database with the new image URLs if needed
        if (generatedImages.bookCard) {
          console.log(`Generated book-card image: ${generatedImages.bookCard.publicUrl}`);
          
          // Check if book-card already exists in database
          const [existingBookCard] = await db.select()
            .from(bookImages)
            .where(
              and(
                eq(bookImages.bookId, bookId),
                eq(bookImages.imageType, 'book-card')
              )
            );
          
          if (existingBookCard) {
            // Update existing record
            await db.update(bookImages)
              .set({
                imageUrl: generatedImages.bookCard.publicUrl,
                updatedAt: new Date()
              })
              .where(eq(bookImages.id, existingBookCard.id));
            
            console.log(`Updated existing book-card image record for book ID: ${bookId}`);
          } else {
            // Create new record
            await dbStorage.addBookImage({
              bookId: bookId,
              imageUrl: generatedImages.bookCard.publicUrl,
              imageType: 'book-card',
              width: 260,
              height: 435, 
              sizeKb: Math.round(file.size / 8),
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            console.log(`Created new book-card image record for book ID: ${bookId}`);
          }
        }
        
        if (generatedImages.mini) {
          console.log(`Generated mini image: ${generatedImages.mini.publicUrl}`);
          
          // Check if mini already exists in database
          const [existingMini] = await db.select()
            .from(bookImages)
            .where(
              and(
                eq(bookImages.bookId, bookId),
                eq(bookImages.imageType, 'mini')
              )
            );
          
          if (existingMini) {
            // Update existing record
            await db.update(bookImages)
              .set({
                imageUrl: generatedImages.mini.publicUrl,
                updatedAt: new Date()
              })
              .where(eq(bookImages.id, existingMini.id));
            
            console.log(`Updated existing mini image record for book ID: ${bookId}`);
          } else {
            // Create new record
            await dbStorage.addBookImage({
              bookId: bookId,
              imageUrl: generatedImages.mini.publicUrl,
              imageType: 'mini',
              width: 64,
              height: 40,
              sizeKb: Math.round(file.size / 32),
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            console.log(`Created new mini image record for book ID: ${bookId}`);
          }
        }
      } catch (genError) {
        console.error(`Error generating images for book ID: ${bookId}:`, genError);
      }
    }
    
    console.log('\nImage regeneration process completed!');
    
  } catch (error) {
    console.error('Error during image regeneration:', error);
  }
}

// Run the function
regenerateBookImages().catch(console.error);