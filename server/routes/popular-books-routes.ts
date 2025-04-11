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
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get limit from query param or default to 10
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Get popular book records
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
    const result = popularBooksRecords.map(record => {
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