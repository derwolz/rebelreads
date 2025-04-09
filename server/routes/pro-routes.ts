import { Router, Request, Response } from "express";
import { db } from "../db";
import { users, ratings, replies, reports } from "@shared/schema";
import { eq } from "drizzle-orm";
import { dbStorage } from "../storage";

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
    // Get all books by this author
    const authorBooks = await dbStorage.getBooksByAuthor(req.user.id);
    
    if (!authorBooks || authorBooks.length === 0) {
      return res.json({
        totalReviews: 0,
        averageRating: 0,
        recentReports: 0,
      });
    }
    
    // Get book IDs
    const bookIds = authorBooks.map((book: { id: number }) => book.id);
    
    // Collect all ratings for these books
    let allRatings: any[] = [];
    for (const bookId of bookIds) {
      const bookRatings = await dbStorage.getRatings(bookId);
      allRatings = [...allRatings, ...bookRatings];
    }
    
    // Calculate total reviews
    const totalReviews = allRatings.length;
    
    // Calculate average rating (across all criteria)
    let sumRatings = 0;
    let countRatings = 0;
    
    allRatings.forEach(rating => {
      // Sum up all numerical rating criteria
      const criteriaSum = 
        (rating.enjoyment || 0) + 
        (rating.writing || 0) + 
        (rating.themes || 0) + 
        (rating.characters || 0) + 
        (rating.worldbuilding || 0);
      
      // Count the number of criteria that had values
      const criteriaCount = [
        rating.enjoyment, 
        rating.writing, 
        rating.themes, 
        rating.characters, 
        rating.worldbuilding
      ].filter(Boolean).length;
      
      if (criteriaCount > 0) {
        sumRatings += (criteriaSum / criteriaCount);
        countRatings++;
      }
    });
    
    const averageRating = countRatings > 0 ? (sumRatings / countRatings) : 0;
    
    // Count number of reports
    const recentReports = allRatings.filter(
      rating => rating.report_status && rating.report_status !== 'none'
    ).length;
    
    return res.json({
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      recentReports,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get reviews for books by the author
// Main review endpoint for authors
router.get("/reviews", async (req: Request, res: Response) => {
  if (!req.user || !req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    console.log("Fetching real reviews for author:", req.user.id);
    
    // Get all books by this author
    const authorBooks = await dbStorage.getBooksByAuthor(req.user.id);
    console.log("Author books found:", authorBooks.length, authorBooks.map((b: any) => b.id));
    
    if (!authorBooks || authorBooks.length === 0) {
      console.log("No author books found, returning empty result");
      return res.json({
        reviews: [],
        hasMore: false,
        totalPages: 0
      });
    }

    // Get book IDs
    const bookIds = authorBooks.map((book: { id: number }) => book.id);
    console.log("Book IDs to fetch ratings for:", bookIds);
    
    // Collect all ratings for these books
    let allRatings: any[] = [];
    for (const bookId of bookIds) {
      console.log(`Fetching ratings for book ID ${bookId}`);
      const bookRatings = await dbStorage.getRatings(bookId);
      console.log(`Found ${bookRatings.length} ratings for book ID ${bookId}`);
      allRatings = [...allRatings, ...bookRatings];
    }
    console.log(`Total ratings found: ${allRatings.length}`);
    
    if (allRatings.length > 0) {
      console.log("First rating sample:", allRatings[0]);
    }
    
    // Sort reviews by creation date (most recent first)
    allRatings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Paginate the results
    const paginatedRatings = allRatings.slice(offset, offset + limit);
    
    // Get user information for each review
    const reviewsWithDetails = await Promise.all(paginatedRatings.map(async (rating) => {
      // Get user information
      const user = await dbStorage.getUser(rating.userId);
      
      // Get book information
      const book = await dbStorage.getBook(rating.bookId);
      
      // Get replies to this review
      const replies = await dbStorage.getReplies(rating.id);
      
      const repliesWithAuthor = await Promise.all(replies.map(async (reply: any) => {
        const author = await dbStorage.getUser(reply.authorId);
        return {
          ...reply,
          author: {
            username: author?.username || 'Unknown',
            profileImageUrl: author?.profileImageUrl
          }
        };
      }));
      
      return {
        ...rating,
        user: {
          username: user?.username || 'Anonymous',
          displayName: user?.displayName || user?.username || 'Anonymous',
          profileImageUrl: user?.profileImageUrl
        },
        book: {
          title: book?.title || 'Unknown Book',
          author: book?.author || 'Unknown Author'
        },
        replies: repliesWithAuthor
      };
    }));
    
    const totalPages = Math.ceil(allRatings.length / limit);
    
    return res.json({
      reviews: reviewsWithDetails,
      hasMore: page < totalPages,
      totalPages
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Test endpoint for demo purposes (no auth required)
router.get("/demo-reviews", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    console.log("Fetching demo reviews for testing");
    
    // Get some sample books
    const sampleBooks = await db.query.books.findMany({
      limit: 5
    });
    
    if (!sampleBooks || sampleBooks.length === 0) {
      console.log("No sample books found, returning empty result");
      return res.json({
        reviews: [],
        hasMore: false,
        totalPages: 0
      });
    }

    // Get book IDs
    const bookIds = sampleBooks.map(book => book.id);
    console.log("Book IDs to fetch ratings for:", bookIds);
    
    // Collect all ratings for these books
    let allRatings: any[] = [];
    for (const bookId of bookIds) {
      console.log(`Fetching ratings for book ID ${bookId}`);
      const bookRatings = await dbStorage.getRatings(bookId);
      console.log(`Found ${bookRatings.length} ratings for book ID ${bookId}`);
      allRatings = [...allRatings, ...bookRatings];
    }
    console.log(`Total ratings found: ${allRatings.length}`);
    
    if (allRatings.length > 0) {
      console.log("First rating sample:", allRatings[0]);
    }
    
    // Sort reviews by creation date (most recent first)
    allRatings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Paginate the results
    const paginatedRatings = allRatings.slice(offset, offset + limit);
    
    // Get user information for each review
    const reviewsWithDetails = await Promise.all(paginatedRatings.map(async (rating) => {
      // Get user information
      const user = await dbStorage.getUser(rating.userId);
      
      // Get book information
      const book = await dbStorage.getBook(rating.bookId);
      
      // Get replies to this review
      const replies = await dbStorage.getReplies(rating.id);
      
      const repliesWithAuthor = await Promise.all(replies.map(async (reply: any) => {
        const author = await dbStorage.getUser(reply.authorId);
        return {
          ...reply,
          author: {
            username: author?.username || 'Unknown',
            profileImageUrl: author?.profileImageUrl
          }
        };
      }));
      
      return {
        ...rating,
        user: {
          username: user?.username || 'Anonymous',
          displayName: user?.displayName || user?.username || 'Anonymous',
          profileImageUrl: user?.profileImageUrl
        },
        book: {
          title: book?.title || 'Unknown Book',
          author: book?.author || 'Unknown Author'
        },
        replies: repliesWithAuthor
      };
    }));
    
    const totalPages = Math.ceil(allRatings.length / limit);
    
    return res.json({
      reviews: reviewsWithDetails,
      hasMore: page < totalPages,
      totalPages
    });
  } catch (error) {
    console.error("Error fetching demo reviews:", error);
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

    // Get the rating first to verify it exists
    const [rating] = await db
      .update(ratings)
      .set({ featured })
      .where(eq(ratings.id, reviewId))
      .returning();

    if (!rating) {
      return res.status(404).json({ error: "Review not found" });
    }

    return res.json({
      success: true,
      featured: rating.featured,
      reviewId: rating.id
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

    // First check if the review exists
    const rating = await db
      .select()
      .from(ratings)
      .where(eq(ratings.id, reviewId))
      .limit(1);

    if (!rating || rating.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Create the reply in the database
    const reply = await dbStorage.createReply(reviewId, req.user.id, content);
    
    // Add author info to the response
    const replyWithAuthor = {
      ...reply,
      author: {
        username: req.user.username,
        profileImageUrl: req.user.profileImageUrl || null
      }
    };

    return res.json(replyWithAuthor);
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
    
    // First check if the review exists
    const rating = await db
      .select()
      .from(ratings)
      .where(eq(ratings.id, reviewId))
      .limit(1);

    if (!rating || rating.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    // Update the review with the report status and reason
    const [updatedRating] = await db
      .update(ratings)
      .set({ 
        report_status: "pending",
        report_reason: reason
      })
      .where(eq(ratings.id, reviewId))
      .returning();
      
    // Insert an entry into the reports table
    await db.insert(reports).values({
      reviewId: reviewId,
      authorId: req.user.id,
      reason: reason,
      status: "pending"
    });

    return res.json({
      success: true,
      message: "Review reported successfully",
      report_status: updatedRating.report_status
    });
  } catch (error) {
    console.error("Error reporting review:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;