import { Router, Request, Response } from "express";
import { dbStorage } from "../../storage";
import { enhanceReferralLinks } from "../../utils/favicon-utils";
import multer from "multer";
import { sirenedImageBucket } from "../../services/sirened-image-bucket";
import sharp from "sharp";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const multipleImageUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
}).fields([
  { name: 'bookImage_full', maxCount: 1 },
  { name: 'bookImage_background', maxCount: 1 },
  { name: 'bookImage_book-cover', maxCount: 1 },
  { name: 'bookImage_book-card', maxCount: 1 },
  { name: 'bookImage_hero', maxCount: 1 },
  { name: 'bookImage_spine', maxCount: 1 },
  { name: 'bookImage_mini', maxCount: 1 },
  { name: 'bookImage_vertical-banner', maxCount: 1 },
  { name: 'bookImage_horizontal-banner', maxCount: 1 }
]);

/**
 * GET /api/books-by-name/taxonomies
 * Get taxonomies for a specific book by author name and book title
 * Public endpoint - no authentication required
 */
router.get("/taxonomies", async (req, res) => {
  // Force JSON content type to prevent Vite intercept
  res.type('application/json');
  
  // Get author name and book title from query parameters
  const authorName = req.query.authorName as string;
  const bookTitle = req.query.bookTitle as string;
  
  if (!authorName || !bookTitle) {
    return res.status(400).json({ 
      error: "Missing parameters", 
      message: "Both authorName and bookTitle are required" 
    });
  }

  try {
    // Look up the book by author name and title
    const book = await dbStorage.getBookByAuthorAndTitle(authorName, bookTitle);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    const taxonomies = await dbStorage.getBookTaxonomies(book.id);
    return res.json(taxonomies);
  } catch (error) {
    console.error("Error fetching book taxonomies:", error);
    return res.status(500).json({ error: "Failed to fetch book taxonomies" });
  }
});

/**
 * PATCH /api/books-by-name/update
 * Update an existing book by author name and title
 * Authentication and author status required
 */
router.patch("/update", async (req, res) => {
  // Force JSON content type
  res.type('json');
  
  try {
    // Basic validation
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get user ID
    const userId = req.user!.id;
    
    // Get author name and book title from query parameters
    const authorName = req.query.authorName as string;
    const bookTitle = req.query.bookTitle as string;
    
    if (!authorName || !bookTitle) {
      return res.status(400).json({ 
        error: "Missing parameters", 
        message: "Both authorName and bookTitle are required query parameters" 
      });
    }
    
    console.log(`Looking up book by author name and book title: ${authorName}, ${bookTitle}`);
    
    // Find book by author name and title
    const book = await dbStorage.getBookByAuthorAndTitle(authorName, bookTitle);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Get author record
    const author = await dbStorage.getAuthorByUserId(userId);
    if (!author) {
      return res.status(403).json({ error: "Not an author" });
    }
    
    // Verify ownership
    if (book.authorId !== author.id) {
      return res.status(403).json({ error: "Not authorized - you don't own this book" });
    }
    
    console.log("PATCH request for book:", book.id);
    console.log("Update fields:", Object.keys(req.body));
    
    // Extract the updated fields from request body
    // Remove non-book fields to avoid DB errors
    const { authorname, bookname, genreTaxonomies, ...updates } = req.body;
    
    // Process the update
    console.log("Processing update with cleaned fields:", Object.keys(updates));
    
    // Update the book in database
    const updatedBook = await dbStorage.updateBook(book.id, updates);
    
    // Update taxonomies if provided
    if (genreTaxonomies && Array.isArray(genreTaxonomies)) {
      await dbStorage.updateBookTaxonomies(book.id, genreTaxonomies);
    }
    
    // Return success with updated book
    return res.status(200).json(updatedBook);
  } catch (error) {
    console.error("PATCH book error:", error);
    return res.status(500).json({ 
      error: "Failed to update book",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;