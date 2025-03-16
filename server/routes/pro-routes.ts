import { Router } from "express";
import { dbStorage } from "../storage";
import { db } from "../db";
import { ratings, users, replies, books } from "@shared/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { format } from "date-fns";

const router = Router();

// Pro dashboard data
router.get("/dashboard", async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(403);
  }

  try {
    const authorId = req.user!.id;

    // Get author's books
    const books = await dbStorage.getBooksByAuthor(authorId);

    // Get all ratings for author's books
    const bookIds = books.map((book) => book.id);
    const allRatings = await db
      .select()
      .from(ratings)
      .where(inArray(ratings.bookId, bookIds));

    // Calculate average rating
    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((acc, r) => acc + calculateWeightedRating(r), 0) /
          allRatings.length
        : 0;

    // Generate sample interest data
    const today = new Date();
    const bookInterest = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (29 - i));
      return {
        date: format(date, "MMM dd"),
        ...Object.fromEntries(
          books.map((book) => [
            book.title,
            Math.floor(100 + Math.random() * 100 + i / 2),
          ]),
        ),
      };
    });

    res.json({
      bookInterest,
      totalReviews: allRatings.length,
      averageRating,
      recentReports: 0,
    });
  } catch (error) {
    console.error("Error fetching pro dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// Reviews management
router.get("/reviews", async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(403);
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Get all books by the author
    const authorBooks = await dbStorage.getBooksByAuthor(req.user!.id);
    const bookIds = authorBooks.map((book) => book.id);

    // Get paginated reviews for author's books
    const reviews = await db
      .select({
        review: ratings,
        user: users,
        replies: replies,
      })
      .from(ratings)
      .where(inArray(ratings.bookId, bookIds))
      .leftJoin(users, eq(users.id, ratings.userId))
      .leftJoin(replies, eq(replies.reviewId, ratings.id))
      .orderBy(desc(ratings.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total reviews
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(ratings)
      .where(inArray(ratings.bookId, bookIds));

    const hasMore = totalCount[0].count > page * limit;

    // Group replies with their reviews
    const processedReviews = reviews.reduce((acc: any[], curr) => {
      const existingReview = acc.find((r) => r.id === curr.review.id);
      if (existingReview) {
        if (curr.replies) {
          existingReview.replies.push(curr.replies);
        }
      } else {
        acc.push({
          ...curr.review,
          user: curr.user,
          replies: curr.replies ? [curr.replies] : [],
        });
      }
      return acc;
    }, []);

    res.json({
      reviews: processedReviews,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Feature a review
router.post("/reviews/:id/feature", async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(403);
  }

  try {
    const reviewId = parseInt(req.params.id);
    const { featured } = req.body;

    // Verify the review belongs to one of the author's books
    const review = await db
      .select()
      .from(ratings)
      .where(eq(ratings.id, reviewId))
      .limit(1);

    if (!review.length) {
      return res.status(404).json({ error: "Review not found" });
    }

    const book = await dbStorage.getBook(review[0].bookId);
    if (!book || book.authorId !== req.user!.id) {
      return res.sendStatus(403);
    }

    // Update the review's featured status
    const [updatedReview] = await db
      .update(ratings)
      .set({ featured })
      .where(eq(ratings.id, reviewId))
      .returning();

    res.json(updatedReview);
  } catch (error) {
    console.error("Error featuring review:", error);
    res.status(500).json({ error: "Failed to feature review" });
  }
});

// Reply to a review
router.post("/reviews/:id/reply", async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(403);
  }

  try {
    const reviewId = parseInt(req.params.id);
    const { content } = req.body;

    // Verify the review belongs to one of the author's books
    const review = await db
      .select()
      .from(ratings)
      .where(eq(ratings.id, reviewId))
      .limit(1);

    if (!review.length) {
      return res.status(404).json({ error: "Review not found" });
    }

    const book = await dbStorage.getBook(review[0].bookId);
    if (!book || book.authorId !== req.user!.id) {
      return res.sendStatus(403);
    }

    // Create the reply
    const [newReply] = await db
      .insert(replies)
      .values({
        reviewId,
        authorId: req.user!.id,
        content,
      })
      .returning();

    res.json(newReply);
  } catch (error) {
    console.error("Error replying to review:", error);
    res.status(500).json({ error: "Failed to reply to review" });
  }
});

// Campaign management
router.get("/campaigns", async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(403);
  }

  try {
    const campaigns = await dbStorage.getCampaigns(req.user!.id);
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

router.post("/campaigns", async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(403);
  }

  try {
    const campaign = await dbStorage.createCampaign({
      ...req.body,
      authorId: req.user!.id,
    });
    res.json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

router.patch("/campaigns/:id/status", async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(403);
  }

  try {
    const campaign = await dbStorage.updateCampaignStatus(
      parseInt(req.params.id),
      req.body.status,
    );
    res.json(campaign);
  } catch (error) {
    console.error("Error updating campaign status:", error);
    res.status(500).json({ error: "Failed to update campaign status" });
  }
});

// Helper function for calculating weighted rating
function calculateWeightedRating(rating: any) {
  return (
    rating.enjoyment * 0.3 +
    rating.writing * 0.2 +
    rating.themes * 0.2 +
    rating.characters * 0.15 +
    rating.worldbuilding * 0.15
  );
}

// Add review purchase route
router.post("/purchase-review", async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(403);
  }

  try {
    const { campaignId, bookId, credits } = req.body;

    // Verify campaign exists and belongs to user
    const campaigns = await dbStorage.getCampaigns(req.user!.id);
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Verify book exists and belongs to user
    const book = await dbStorage.getBook(bookId);
    if (!book || book.authorId !== req.user!.id) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Verify user has enough credits
    const userCredits = await dbStorage.getUserCredits(req.user!.id);
    if (parseFloat(userCredits) < parseFloat(credits)) {
      return res.status(400).json({ error: "Insufficient credits" });
    }

    // Create review purchase
    const purchase = await dbStorage.createReviewPurchase({
      campaignId,
      userId: req.user!.id,
      bookId,
      credits,
      status: "pending"
    });

    // Deduct credits from user
    await dbStorage.deductCredits(req.user!.id, credits, campaignId);

    res.json(purchase);
  } catch (error) {
    console.error("Error purchasing review:", error);
    res.status(500).json({ error: "Failed to purchase review" });
  }
});

export default router;