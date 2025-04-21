import { Router, Request, Response } from "express";
import { z } from "zod";
import { dbStorage } from "../storage";
import { requirePublisher } from "../middleware/author-auth";
import { db, pool } from "../db";
import { authors, books, bookImages, publishersAuthors, publishers, genreTaxonomies, bookGenreTaxonomies } from "@shared/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { objectStorage } from "../services/object-storage";

const router = Router();

// Configure multer for book image uploads
const uploadsDir = "./uploads";
const coversDir = path.join(uploadsDir, "covers");

// Ensure directories exist
[uploadsDir, coversDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const bookImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, coversDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Configure the multer middleware for multiple images
const bookImagesUpload = multer({
  storage: bookImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB size limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
}).fields([
  { name: 'book_detail', maxCount: 1 },
  { name: 'background', maxCount: 1 },
  { name: 'book_card', maxCount: 1 },
  { name: 'grid_item', maxCount: 1 },
  { name: 'mini', maxCount: 1 },
  { name: 'hero', maxCount: 1 }
]);

// Define the schema for validating book data
const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  authorId: z.number({ required_error: "Author ID is required" }),
  description: z.string().min(1, "Description is required"),
  pageCount: z.number().nonnegative().nullable().optional(),
  formats: z.array(z.string()).min(1, "At least one format is required").default([]),
  publishedDate: z.string().optional(),
  awards: z.array(z.string()).optional().nullable(),
  originalTitle: z.string().optional().nullable(),
  series: z.string().optional().nullable(),
  setting: z.string().optional().nullable(),
  characters: z.array(z.string()).optional().nullable(),
  isbn: z.string().optional().nullable(),
  asin: z.string().optional().nullable(),
  language: z.string().default("English"),
  genres: z.array(z.string()).optional()
});

// Define the schema for batch book processing
const batchBooksSchema = z.object({
  books: z.array(bookSchema).max(10, "Maximum 10 books per batch")
});

// Helper function to validate authorId belongs to the publisher
async function validateAuthorBelongsToPublisher(publisherId: number, authorId: number): Promise<boolean> {
  const relations = await db
    .select()
    .from(publishersAuthors)
    .where(
      and(
        eq(publishersAuthors.publisherId, publisherId),
        eq(publishersAuthors.authorId, authorId),
        isNull(publishersAuthors.contractEnd)
      )
    );
  
  return relations.length > 0;
}

/**
 * POST /api/catalogue/publishers/books
 * Batch upload books with images
 * Protected route: Requires publisher authentication
 */
router.post("/", requirePublisher, bookImagesUpload, async (req: Request, res: Response) => {
  try {
    // Verify the user is a publisher
    const publisher = await dbStorage.getPublisherByUserId(req.user!.id);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher profile not found" });
    }
    
    // Parse and validate book data
    const rawBooks = req.body.books;
    let booksData;
    
    try {
      // Books are sent as a JSON string in a field called 'books'
      const parsedBooks = typeof rawBooks === 'string' ? JSON.parse(rawBooks) : rawBooks;
      booksData = batchBooksSchema.parse({ books: parsedBooks });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid book data", details: error.errors });
      }
      if (error instanceof SyntaxError) {
        return res.status(400).json({ error: "Invalid JSON format in books data" });
      }
      throw error;
    }
    
    // Process each book in the batch
    const createdBooks = [];
    const errors = [];
    
    for (let i = 0; i < booksData.books.length; i++) {
      const bookData = booksData.books[i];
      
      try {
        // Validate author belongs to this publisher
        const isAuthorValid = await validateAuthorBelongsToPublisher(publisher.id, bookData.authorId);
        
        if (!isAuthorValid) {
          errors.push({
            index: i,
            book: bookData.title,
            error: `Author with ID ${bookData.authorId} is not associated with this publisher`
          });
          continue;
        }
        
        // Create the book with proper null handling for optional fields
        const newBook = await dbStorage.createBook({
          title: bookData.title,
          authorId: bookData.authorId,
          description: bookData.description,
          pageCount: bookData.pageCount !== undefined ? bookData.pageCount : 0,
          formats: bookData.formats || [],
          publishedDate: bookData.publishedDate || null,
          awards: bookData.awards || [],
          originalTitle: bookData.originalTitle || null,
          series: bookData.series || null,
          setting: bookData.setting || null,
          characters: bookData.characters || [],
          isbn: bookData.isbn || null,
          asin: bookData.asin || null,
          language: bookData.language || "English",
          promoted: false,
          referralLinks: [],
          // Add required fields for the database model
          impressionCount: 0,
          clickThroughCount: 0,
          lastImpressionAt: null,
          lastClickThroughAt: null,
          internal_details: null
        });
        
        // Extract file prefix for this book
        const filePrefix = `book_${i}_`;
        
        // Process images for this book (if any)
        const capturedBookImages: any[] = [];
        const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] } || {};
        
        // Map of field name prefixes to image types
        const imageTypeMap = {
          [`${filePrefix}book_detail`]: "book-detail",
          [`${filePrefix}background`]: "background",
          [`${filePrefix}book_card`]: "book-card",
          [`${filePrefix}grid_item`]: "grid-item",
          [`${filePrefix}mini`]: "mini",
          [`${filePrefix}hero`]: "hero"
        };
        
        // Process each image type
        for (const [fieldName, fieldFiles] of Object.entries(uploadedFiles)) {
          // Find the matching book and image type
          for (const [prefix, imageType] of Object.entries(imageTypeMap)) {
            if (fieldName.startsWith(prefix)) {
              // We found a matching image for this book
              for (const file of fieldFiles) {
                // Upload to object storage
                const storageKey = await objectStorage.uploadFile(file, 'covers');
                const imageUrl = objectStorage.getPublicUrl(storageKey);
                
                // Save the image record
                const imageResult = await db
                  .insert(bookImages)
                  .values({
                    bookId: newBook.id,
                    imageUrl,
                    imageType,
                    width: 0, // Would need image processing to get actual dimensions
                    height: 0,
                    sizeKb: Math.round(file.size / 1024)
                  })
                  .returning();
                
                capturedBookImages.push(imageResult[0]);
              }
            }
          }
        }
        
        // Process genres if provided
        if (bookData.genres && bookData.genres.length > 0) {
          // Get the taxonomy IDs for the provided genres
          const genreTaxonomiesResult = await db
            .select()
            .from(genreTaxonomies)
            .where(inArray(genreTaxonomies.name, bookData.genres));
          
          const existingGenres = new Set(genreTaxonomiesResult.map(g => g.name.toLowerCase()));
          
          // Add book-genre relations
          for (const taxonomy of genreTaxonomiesResult) {
            // Using pool.query directly to bypass type issues
            await pool.query(`
              INSERT INTO book_genre_taxonomies (book_id, taxonomy_id) 
              VALUES ($1, $2) 
              ON CONFLICT DO NOTHING
            `, [newBook.id, taxonomy.id]);
          }
          
          // Check for any genres that weren't found
          const missingGenres = bookData.genres.filter(g => !existingGenres.has(g.toLowerCase()));
          if (missingGenres.length > 0) {
            console.warn(`Some genres were not found for book '${bookData.title}': ${missingGenres.join(', ')}`);
          }
        }
        
        // Add the created book to the results
        createdBooks.push({
          ...newBook,
          images: capturedBookImages
        });
      } catch (error) {
        console.error(`Error processing book ${bookData.title}:`, error);
        errors.push({
          index: i,
          book: bookData.title,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    // Return results
    res.status(201).json({
      success: createdBooks.length > 0,
      createdBooks,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully created ${createdBooks.length} of ${booksData.books.length} books`
    });
  } catch (error) {
    console.error("Error processing batch books upload:", error);
    res.status(500).json({ error: "Failed to process books upload" });
  }
});

export default router;