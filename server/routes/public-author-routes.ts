import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";

const router = Router();

/**
 * GET /api/public/book-details
 * Get book details by author name and title via query parameters
 * This route provides an alternative way to access book details that is harder to scrape
 * Example: /api/public/book-details?authorName=King%20Stanky&bookTitle=Valkyrie%20X%20Truck
 * 
 * Public endpoint - no authentication required
 */
router.get("/book-details", async (req: Request, res: Response) => {
  const { authorName, bookTitle } = req.query;
  
  // Validate required query parameters
  if (!authorName || !bookTitle) {
    return res.status(400).json({ error: "Both authorName and bookTitle query parameters are required" });
  }
  
  console.log(`Public API - Searching for book with authorName: ${authorName}, title: ${bookTitle}`);
  
  try {
    // Get book by author name and title
    const book = await dbStorage.getBookByAuthorAndTitle(authorName as string, bookTitle as string);
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Add debugging to check if images are attached to the book
    console.log(`Public API - Book with title "${bookTitle}" by "${authorName}" has ${book.images?.length || 0} images:`, 
      book.images?.map(img => `${img.imageType}: ${img.imageUrl}`));
    
    // Note: We don't record impressions for public routes to avoid authentication checks
    
    res.json(book);
  } catch (error) {
    console.error(`Public API - Error fetching book with authorName: ${authorName}, title: ${bookTitle}:`, error);
    res.status(500).json({ error: "Failed to fetch book details" });
  }
});

/**
 * GET /api/public/authors/:id/publisher
 * Get publisher details for a specific author
 * Public endpoint - no authentication required
 */
router.get("/authors/:id/publisher", async (req: Request, res: Response) => {
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: "Invalid author ID" });
  }

  try {
    // Check if the author exists first
    const author = await dbStorage.getAuthor(authorId);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Get the publisher for this author
    const publisher = await dbStorage.getAuthorPublisher(authorId);
    
    // For debugging
    console.log(`Public API - Publisher for author ${authorId}:`, publisher);
    
    if (!publisher) {
      return res.json(null); // No publisher associated with this author
    }
    
    return res.json(publisher);
  } catch (error) {
    console.error("Error fetching author publisher:", error);
    return res.status(500).json({ error: "Failed to fetch author publisher" });
  }
});

export default router;