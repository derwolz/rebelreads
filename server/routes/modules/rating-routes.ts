import { Router, Request, Response } from "express";
import { dbStorage } from "../../storage";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { ratings } from "@shared/schema";

const router = Router();

/**
 * GET /api/books/:id/ratings
 * Get all ratings for a specific book
 * Public endpoint - no authentication required
 */
router.get("/books/:id/ratings", async (req, res) => {
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const bookRatings = await dbStorage.getRatings(bookId);
  
  // Get user information and replies for each review
  const ratingsWithUserInfo = await Promise.all(bookRatings.map(async (rating) => {
    // Get user information
    const user = await dbStorage.getUser(rating.userId);
    
    // Get replies to this review
    const replies = await dbStorage.getReplies(rating.id);
    
    // Add author info to each reply
    const repliesWithAuthor = await Promise.all(replies.map(async (reply) => {
      // Get the author information - for author replies, we need to get the author record, not just user
      const user = await dbStorage.getUser(reply.authorId);
      const author = await dbStorage.getAuthorByUserId(reply.authorId);
      
      return {
        ...reply,
        author: {
          name: author?.author_name || user?.displayName || user?.username || 'Unknown',
          profileImageUrl: author?.author_image_url || user?.profileImageUrl
        }
      };
    }));
    
    // Get the book information to get the author data
    const book = await dbStorage.getBook(rating.bookId);
    const bookAuthor = book ? await dbStorage.getAuthor(book.authorId) : null;
    
    return {
      ...rating,
      user: {
        username: user?.username || 'Anonymous',
        displayName: user?.displayName || user?.username || 'Anonymous',
        profileImageUrl: user?.profileImageUrl
      },
      // Add author information for reference
      authorName: bookAuthor?.author_name,
      authorImageUrl: bookAuthor?.author_image_url,
      replies: repliesWithAuthor
    };
  }));
  
  res.json(ratingsWithUserInfo);
});

/**
 * POST /api/books/:id/ratings
 * Create a new rating for a book
 * Authentication required
 */
router.post("/books/:id/ratings", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  try {
    const rating = await dbStorage.createRating({
      bookId,
      userId: req.user!.id,
      enjoyment: req.body.enjoyment,
      writing: req.body.writing,
      themes: req.body.themes,
      characters: req.body.characters,
      worldbuilding: req.body.worldbuilding,
      review: req.body.review,
      analysis: req.body.analysis,
    });

    // Mark the book as completed
    await dbStorage.markAsCompleted(req.user!.id, bookId);

    res.json(rating);
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique violation
      try {
        const [updatedRating] = await db
          .update(ratings)
          .set({
            enjoyment: req.body.enjoyment,
            writing: req.body.writing,
            themes: req.body.themes,
            characters: req.body.characters,
            worldbuilding: req.body.worldbuilding,
            review: req.body.review,
            analysis: req.body.analysis,
          })
          .where(
            and(eq(ratings.userId, req.user!.id), eq(ratings.bookId, bookId)),
          )
          .returning();

        // Mark the book as completed
        await dbStorage.markAsCompleted(req.user!.id, bookId);

        return res.json(updatedRating);
      } catch (updateError) {
        return res.status(500).send("Failed to update rating");
      }
    }
    res.status(400).send(error.message);
  }
});

/**
 * GET /api/books/:id/user-rating
 * Get a user's rating for a specific book
 * Authentication required
 */
router.get("/books/:id/user-rating", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }
  
  try {
    const rating = await dbStorage.getUserRating(req.user!.id, bookId);
    
    if (!rating) {
      return res.json(null);
    }
    
    res.json(rating);
  } catch (error: any) {
    console.error(`Error getting user rating:`, error);
    res.status(500).json({ error: error.message || "Failed to get user rating" });
  }
});

export default router;