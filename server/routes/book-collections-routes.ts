import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { log } from "../vite";
import { db } from "../db";
import { eq, and, inArray, not, isNull, sql, desc } from "drizzle-orm";
import { books, followers, ratings, reading_status } from "@shared/schema";

const router = Router();

/**
 * Get random books from authors the user follows
 * Excludes books the user has already read
 */
router.get("/followed-authors", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

  try {
    const userId = req.user!.id;
    const count = parseInt(req.query.count as string) || 10;

    // Get authors that the user follows
    const followedAuthors = await db
      .select({
        authorId: followers.followingId
      })
      .from(followers)
      .where(
        and(
          eq(followers.followerId, userId),
          isNull(followers.deletedAt)
        )
      );
    
    if (followedAuthors.length === 0) {
      return res.json([]);
    }
    
    // Get book IDs the user has already read (marked as completed)
    const readBookIds = await db
      .select({ bookId: reading_status.bookId })
      .from(reading_status)
      .where(
        and(
          eq(reading_status.userId, userId),
          eq(reading_status.isCompleted, true)
        )
      );
    
    // Get books by those authors, excluding ones the user has already read
    const authorIds = followedAuthors.map(f => f.authorId);
    const readIds = readBookIds.map(rb => rb.bookId);
    
    let query = db
      .select()
      .from(books)
      .where(inArray(books.authorId, authorIds));
    
    // Add the exclusion condition only if there are books to exclude
    if (readIds.length > 0) {
      query = query.where(not(inArray(books.id, readIds)));
    }
    
    // Order by random and limit
    const allBooks = await query;
    
    // Shuffle array and take the requested count
    const shuffled = allBooks.sort(() => 0.5 - Math.random());
    const selectedBooks = shuffled.slice(0, count);
    
    res.json(selectedBooks);
  } catch (error) {
    console.error("Error fetching books from followed authors:", error);
    res.status(500).json({ error: "Failed to fetch books from followed authors" });
  }
});

/**
 * Get random books from a user's wishlist
 * that they haven't read
 */
router.get("/wishlist", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

  try {
    const userId = req.user!.id;
    const count = parseInt(req.query.count as string) || 10;

    // Get all wishlisted books that are not completed
    const wishlistedBooks = await db
      .select({
        book: books
      })
      .from(books)
      .innerJoin(
        reading_status,
        and(
          eq(reading_status.bookId, books.id),
          eq(reading_status.userId, userId),
          eq(reading_status.isWishlisted, true),
          eq(reading_status.isCompleted, false)
        )
      );
    
    if (wishlistedBooks.length === 0) {
      return res.json([]);
    }
    
    // Shuffle array and take the requested count
    const shuffled = wishlistedBooks.map(item => item.book).sort(() => 0.5 - Math.random());
    const selectedBooks = shuffled.slice(0, count);
    
    res.json(selectedBooks);
  } catch (error) {
    console.error("Error fetching wishlisted books:", error);
    res.status(500).json({ error: "Failed to fetch wishlisted books" });
  }
});

/**
 * Get random books that the user has reviewed
 */
router.get("/reviewed", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

  try {
    const userId = req.user!.id;
    const count = parseInt(req.query.count as string) || 10;

    // Get books the user has rated
    const ratedBooks = await db
      .select({
        book: books,
        ratingId: ratings.id,
        ratingCreatedAt: ratings.createdAt
      })
      .from(books)
      .innerJoin(
        ratings,
        and(
          eq(ratings.bookId, books.id),
          eq(ratings.userId, userId)
        )
      )
      .orderBy(desc(ratings.createdAt));
    
    if (ratedBooks.length === 0) {
      return res.json([]);
    }
    
    // Shuffle array and take the requested count
    const shuffled = ratedBooks.map(item => item.book).sort(() => 0.5 - Math.random());
    const selectedBooks = shuffled.slice(0, count);
    
    res.json(selectedBooks);
  } catch (error) {
    console.error("Error fetching reviewed books:", error);
    res.status(500).json({ error: "Failed to fetch reviewed books" });
  }
});

/**
 * Get random books that the user has marked as completed
 */
router.get("/completed", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

  try {
    const userId = req.user!.id;
    const count = parseInt(req.query.count as string) || 10;

    // Get books the user has marked as completed
    const completedBooks = await db
      .select({
        book: books,
        completedAt: reading_status.completedAt
      })
      .from(books)
      .innerJoin(
        reading_status,
        and(
          eq(reading_status.bookId, books.id),
          eq(reading_status.userId, userId),
          eq(reading_status.isCompleted, true)
        )
      )
      .orderBy(desc(reading_status.completedAt));
    
    if (completedBooks.length === 0) {
      return res.json([]);
    }
    
    // Shuffle array and take the requested count
    const shuffled = completedBooks.map(item => item.book).sort(() => 0.5 - Math.random());
    const selectedBooks = shuffled.slice(0, count);
    
    res.json(selectedBooks);
  } catch (error) {
    console.error("Error fetching completed books:", error);
    res.status(500).json({ error: "Failed to fetch completed books" });
  }
});

export default router;