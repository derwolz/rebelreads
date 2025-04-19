import { Router } from "express";
import { dbStorage } from "../storage";

const router = Router();

/**
 * GET /api/popular-books
 * Get current popular books based on weighted interactions
 * Weighted interactions: hover (0.25), card click (0.5), referral click (1.0)
 */
router.get("/", async (req, res) => {
  try {
    // Optional limit parameter, default to 10
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Optional period parameter (day, week, month), default to day
    const period = req.query.period ? String(req.query.period) : "day";
    
    // Get popular books with book details
    const popularBooks = await dbStorage.getPopularBooks(limit, period);
    
    if (!popularBooks || popularBooks.length === 0) {
      // If no popular books are found, trigger a calculation
      await dbStorage.calculatePopularBooks();
      // Fetch newly calculated popular books
      const freshPopularBooks = await dbStorage.getPopularBooks(limit, period);
      
      if (!freshPopularBooks || freshPopularBooks.length === 0) {
        // Still no popular books, return empty array
        return res.json([]);
      }
      
      // Return fresh calculation
      return res.json(freshPopularBooks);
    }
    
    // Enrich popular books with book details (title, author, cover)
    const enrichedPopularBooks = await Promise.all(
      popularBooks.map(async (popularBook) => {
        try {
          // Get basic book info
          const book = await dbStorage.getBook(popularBook.bookId);
          
          if (!book) {
            return popularBook; // Return as is if book not found
          }
          
          // Get author info
          const author = await dbStorage.getAuthor(book.authorId);
          
          // Get rating count
          const ratings = await dbStorage.getRatings(book.id);
          
          // Return enriched popular book
          return {
            ...popularBook,
            title: book.title,
            description: book.description,
            authorId: book.authorId,
            authorName: author?.author_name || null,
            authorImageUrl: author?.author_image_url || null,
            images: book.images || [],
            ratingCount: ratings.length
          };
        } catch (error) {
          console.error(`Error enriching popular book ${popularBook.bookId}:`, error);
          return popularBook; // Return as is on error
        }
      })
    );
    
    res.json(enrichedPopularBooks);
  } catch (error) {
    console.error("Error fetching popular books:", error);
    res.status(500).json({ error: "Failed to fetch popular books" });
  }
});

/**
 * POST /api/popular-books/recalculate
 * Force recalculation of popular books (admin only)
 */
router.post("/recalculate", async (req, res) => {
  // Check if user is an admin
  if (!req.isAuthenticated() || !req.user || !(req.user as any).isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  try {
    await dbStorage.calculatePopularBooks();
    res.json({ success: true, message: "Popular books recalculated" });
  } catch (error) {
    console.error("Error recalculating popular books:", error);
    res.status(500).json({ error: "Failed to recalculate popular books" });
  }
});

export default router;