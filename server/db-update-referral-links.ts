/**
 * One-time script to update all existing referral links with domain and favicon information
 */

import { db } from './db';
import { books } from '@shared/schema';
import { enhanceReferralLinks } from './utils/favicon-utils';
import { eq } from 'drizzle-orm';

/**
 * Scan all books and update their referral links with domain and favicon information
 */
export async function updateReferralLinks() {
  console.log('Starting referral links update...');
  
  try {
    // Get all books from the database
    const allBooks = await db.select().from(books);
    console.log(`Found ${allBooks.length} books to process`);
    
    let updatedCount = 0;
    
    // Process each book
    for (const book of allBooks) {
      // Skip books without referral links
      if (!book.referralLinks || !Array.isArray(book.referralLinks) || book.referralLinks.length === 0) {
        continue;
      }
      
      console.log(`Processing book ${book.id}: "${book.title}" with ${book.referralLinks.length} referral links`);
      
      try {
        // Enhance the referral links with domain and favicon
        const enhancedLinks = await enhanceReferralLinks(book.referralLinks as any[]);
        
        if (JSON.stringify(enhancedLinks) !== JSON.stringify(book.referralLinks)) {
          // Update the book with enhanced links
          await db.update(books)
            .set({ 
              referralLinks: enhancedLinks 
            })
            .where(eq(books.id, book.id));
          
          updatedCount++;
          console.log(`Updated referral links for book ${book.id}`);
        }
      } catch (error) {
        console.error(`Error processing book ${book.id}:`, error);
      }
    }
    
    console.log(`Referral links update complete. Updated ${updatedCount} books.`);
  } catch (error) {
    console.error('Failed to update referral links:', error);
  }
}

// Run the function
updateReferralLinks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });