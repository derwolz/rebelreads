import { Router, Request, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Endpoint to check if user is a Pro user
router.get("/status", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: {
        isPro: true,
        proExpiresAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if pro has expired
    const isProExpired = user.proExpiresAt && new Date(user.proExpiresAt) < new Date();

    return res.json({
      isPro: user.isPro && !isProExpired,
      expiresAt: user.proExpiresAt,
    });
  } catch (error) {
    console.error("Error checking pro status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to upgrade to Pro (payment process would happen here in a real app)
router.post("/upgrade", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { planId } = req.body;
    
    // Calculate expiration date based on plan
    let proExpiresAt = new Date();
    
    if (planId === "monthly") {
      // Add 1 month
      proExpiresAt.setMonth(proExpiresAt.getMonth() + 1);
    } else if (planId === "yearly") {
      // Add 1 year
      proExpiresAt.setFullYear(proExpiresAt.getFullYear() + 1);
      
      // Add 200 credits for yearly plan
      // First get current credit amount
      const userInfo = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
        columns: { credits: true },
      });
      
      // Then update with new amount
      const newCredits = userInfo ? Number(userInfo.credits) + 200 : 200;
      await db.update(users)
        .set({ credits: newCredits.toString() })
        .where(eq(users.id, req.user.id));
    } else {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    // Update user as Pro
    await db.update(users)
      .set({
        isPro: true,
        proExpiresAt: proExpiresAt,
      })
      .where(eq(users.id, req.user.id));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });

    // Return updated user
    return res.json(updatedUser);
  } catch (error) {
    console.error("Error upgrading to pro:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Test endpoint to grant Pro status without payment (for development)
router.post("/test-upgrade", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { planId } = req.body;
    
    // Calculate expiration date based on plan
    let proExpiresAt = new Date();
    
    if (planId === "monthly") {
      // Add 1 month
      proExpiresAt.setMonth(proExpiresAt.getMonth() + 1);
    } else if (planId === "yearly") {
      // Add 1 year
      proExpiresAt.setFullYear(proExpiresAt.getFullYear() + 1);
      
      // Add 200 credits for yearly plan
      // First get current credit amount
      const userInfo = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
        columns: { credits: true },
      });
      
      // Then update with new amount
      const newCredits = userInfo ? Number(userInfo.credits) + 200 : 200;
      await db.update(users)
        .set({ credits: newCredits.toString() })
        .where(eq(users.id, req.user.id));
    }

    // Update user as Pro
    await db.update(users)
      .set({
        isPro: true,
        proExpiresAt: proExpiresAt,
      })
      .where(eq(users.id, req.user.id));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });

    // Return updated user
    return res.json(updatedUser);
  } catch (error) {
    console.error("Error upgrading to pro (test):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get basic Pro dashboard data
router.get("/dashboard", async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }

  try {
    // In a real app, these would pull from actual data sources
    // For now, return some example data
    return res.json({
      totalReviews: 42,
      averageRating: 4.5,
      recentReports: 3,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get reviews for books by the author
router.get("/reviews", async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // In a real app, we would join tables and get reviews for books by this author
    // For now, return example data
    return res.json({
      reviews: [
        {
          id: 1,
          userId: 123,
          bookId: 1,
          enjoyment: 4,
          writing: 5,
          themes: 3,
          characters: 4,
          worldbuilding: 3,
          review: "This was a fantastic read! I loved the main character's development throughout the story.",
          createdAt: new Date().toISOString(),
          featured: false,
          user: {
            username: "bookfan123",
            displayName: "Book Fan",
            profileImageUrl: null
          },
          book: {
            title: "Adventure of Lifetime",
            author: req.user.username
          },
          replies: []
        },
        {
          id: 2,
          userId: 456,
          bookId: 2,
          enjoyment: 5,
          writing: 4,
          themes: 5,
          characters: 5,
          worldbuilding: 4,
          review: "This book was a wonderful journey. The plot twists kept me engaged throughout!",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          featured: true,
          user: {
            username: "readerlover",
            displayName: "Avid Reader",
            profileImageUrl: null
          },
          book: {
            title: "Mystery of the Lost Key",
            author: req.user.username
          },
          replies: [
            {
              id: 1,
              authorId: req.user.id,
              reviewId: 2,
              content: "Thank you for the wonderful review! I'm glad you enjoyed the plot twists!",
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
              author: {
                username: req.user.username,
                profileImageUrl: null
              }
            }
          ]
        }
      ],
      hasMore: false,
      totalPages: 1
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to feature/unfeature a review (Pro only)
router.post("/reviews/:reviewId/feature", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }

  // Check if user is a Pro member
  if (!req.user.isPro) {
    return res.status(403).json({ error: "Pro membership required to feature reviews" });
  }

  try {
    const reviewId = parseInt(req.params.reviewId);
    const { featured } = req.body;

    // In a real app, update the featured status in the database
    return res.json({
      success: true,
      featured: featured,
      reviewId: reviewId
    });
  } catch (error) {
    console.error("Error featuring review:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to reply to a review (available to all authors)
router.post("/reviews/:reviewId/reply", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }

  try {
    const reviewId = parseInt(req.params.reviewId);
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Reply content cannot be empty" });
    }

    // In a real app, save the reply to the database
    return res.json({
      id: Date.now(),
      authorId: req.user.id,
      reviewId: reviewId,
      content: content,
      createdAt: new Date().toISOString(),
      author: {
        username: req.user.username,
        profileImageUrl: null
      }
    });
  } catch (error) {
    console.error("Error replying to review:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to report a review (available to all authors)
router.post("/reviews/:reviewId/report", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }

  try {
    const reviewId = parseInt(req.params.reviewId);
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Report reason is required" });
    }

    // In a real app, save the report to the database
    return res.json({
      success: true,
      message: "Review reported successfully"
    });
  } catch (error) {
    console.error("Error reporting review:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;