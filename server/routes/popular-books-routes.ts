import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { Book, PopularBook } from "@shared/schema";
import { db } from "../db";
import { eq, inArray } from "drizzle-orm";
import { books } from "@shared/schema";

const router = Router();

/**
 * GET /api/popular-books
 * Returns the top popular books based on the calculated sigmoid decay value
 * This endpoint is public and does not require authentication
 * 
 * Query parameters:
 * - limit: Maximum number of books to return (default: 10)
 * - random: If "true", returns N random books from the top 50
 * - count: Number of random books to return when random=true (default: 5)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Check if we want random selection
    const randomize = req.query.random === "true";
    
    // Get limit - this is either the final limit or the pool size for randomization
    const limit = req.query.limit ? parseInt(req.query.limit as string) : (randomize ? 50 : 10);
    
    // For random selection, we'll pick this many books from the pool
    const randomCount = req.query.count ? parseInt(req.query.count as string) : 5;
    
    // Get popular book records - always get the top 'limit' books first
    const popularBooksRecords = await dbStorage.getPopularBooks(limit);
    
    if (popularBooksRecords.length === 0) {
      // If no popular books exist yet, return empty array
      return res.json([]);
    }
    
    // Get the actual book data for these records
    const bookIds = popularBooksRecords.map(record => record.bookId);
    const bookData = await db
      .select()
      .from(books)
      .where(inArray(books.id, bookIds));
    
    // Create a map for easy lookup
    const bookMap = new Map<number, Book>();
    bookData.forEach(book => {
      bookMap.set(book.id, book);
    });
    
    // Join the data together
    let result = popularBooksRecords.map(record => {
      const book = bookMap.get(record.bookId);
      if (!book) return null; // Skip if book not found
      return {
        ...book,
        sigmoidValue: record.sigmoidValue,
        popularRank: record.rank,
        firstRankedAt: record.firstRankedAt
      };
    })
    .filter(Boolean) // Remove any null entries
    .sort((a, b) => a!.popularRank - b!.popularRank);
    
    // If randomize is true, select N random books from the result
    if (randomize && result.length > 0) {
      // Get a random subset of books
      const shuffled = [...result].sort(() => 0.5 - Math.random());
      // Pick the number requested or the max available
      const count = Math.min(randomCount, shuffled.length);
      result = shuffled.slice(0, count);
    }
    
    return res.json(result);
  } catch (error) {
    console.error("Error getting popular books:", error);
    return res.status(500).json({ error: "Failed to retrieve popular books" });
  }
});

/**
 * POST /api/popular-books/calculate
 * Admin endpoint to trigger manual calculation of popular books
 */
router.post("/calculate", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated and has admin privileges
    // @ts-ignore - The auth middleware adds the user property
    if (!req.user || !req.user.isAuthor) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    await dbStorage.calculatePopularBooks();
    return res.json({ success: true, message: "Popular books calculation completed" });
  } catch (error) {
    console.error("Error calculating popular books:", error);
    return res.status(500).json({ error: "Failed to calculate popular books" });
  }
});

export default router;