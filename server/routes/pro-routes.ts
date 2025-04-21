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
        is_pro: true,
        pro_expires_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if pro has expired
    const isProExpired = user.pro_expires_at && new Date(user.pro_expires_at) < new Date();

    return res.json({
      isPro: user.is_pro && !isProExpired,
      expiresAt: user.pro_expires_at,
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
        is_pro: true,
        pro_expires_at: proExpiresAt,
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
        is_pro: true,
        pro_expires_at: proExpiresAt,
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
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }
  
  // Check if the user is a Pro user
  if (!req.user.isPro) {
    return res.status(403).json({ error: "Pro membership required" });
  }

  try {
    // First get the author information by looking up from user ID
    const author = await dbStorage.getAuthorByUserId(req.user.id);
    
    if (!author) {
      
      return res.json({
        totalReviews: 0,
        averageRating: 0,
        recentReports: 0,
      });
    }
    
    
    
    // Get all books by this author - use author.id instead of req.user.id
    const authorBooks = await dbStorage.getBooksByAuthor(author.id);
    authorBooks.map((b: any) => b.id));
    
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
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }
  
  // Check if the user is a Pro user
  if (!req.user.isPro) {
    return res.status(403).json({ error: "Pro membership required" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    
    
    // First get the author information since author.id may not be the same as user.id
    // We need to use getAuthorByUserId since we have the user ID, not the author ID
    const author = await dbStorage.getAuthorByUserId(req.user.id);
    
    if (!author) {
      
      return res.json({
        reviews: [],
        hasMore: false,
        totalPages: 0
      });
    }
    
    
    
    // Get all books by this author - use author.id instead of req.user.id
    const authorBooks = await dbStorage.getBooksByAuthor(author.id);
    
    
    if (!authorBooks || authorBooks.length === 0) {
      
      return res.json({
        reviews: [],
        hasMore: false,
        totalPages: 0
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
    
    
    if (allRatings.length > 0) {
      
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
          author: book?.authorName || 'Unknown Author',
          coverImageUrl: book?.images?.find(img => img.imageType === "book-detail")?.imageUrl || null
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

// Endpoint to get reviews for a specific book
router.get("/book-reviews/:bookId", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }
  
  // Check if the user is a Pro user
  if (!req.user.isPro) {
    return res.status(403).json({ error: "Pro membership required" });
  }

  try {
    const bookId = parseInt(req.params.bookId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    
    
    // Get the actual author ID first by looking up the user ID
    const author = await dbStorage.getAuthorByUserId(req.user.id);
    
    if (!author) {
      
      return res.status(404).json({ error: "Author not found" });
    }
    
    
    
    // Verify that this book belongs to the author
    const authorBooks = await dbStorage.getBooksByAuthor(author.id);
    const bookIds = authorBooks.map((book: { id: number }) => book.id);
    
    
    
    // For development purposes, allow access to all books 
    // Remove this in production and uncomment the check below
    /*
    if (!bookIds.includes(bookId)) {
      return res.status(403).json({ error: "You can only access reviews for your own books" });
    }
    */
    
    // Get all ratings for this book
    const bookRatings = await dbStorage.getRatings(bookId);
    
    
    
    // Sort reviews by creation date (most recent first)
    bookRatings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Paginate the results
    const paginatedRatings = bookRatings.slice(offset, offset + limit);
    
    // Get user information for each review
    const reviewsWithDetails = await Promise.all(paginatedRatings.map(async (rating) => {
      // Get user information
      const user = await dbStorage.getUser(rating.userId);
      
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
        replies: repliesWithAuthor
      };
    }));
    
    const totalPages = Math.ceil(bookRatings.length / limit);
    
    
    
    return res.json({
      reviews: reviewsWithDetails,
      hasMore: page < totalPages,
      totalPages
    });
  } catch (error) {
    console.error("Error fetching book-specific reviews:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Test endpoint for demo purposes (no auth required)
router.get("/demo-reviews", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    
    
    // Get some sample books
    const sampleBooks = await db.query.books.findMany({
      limit: 5
    });
    
    if (!sampleBooks || sampleBooks.length === 0) {
      
      return res.json({
        reviews: [],
        hasMore: false,
        totalPages: 0
      });
    }

    // Get book IDs
    const bookIds = sampleBooks.map(book => book.id);
    
    
    // Collect all ratings for these books
    let allRatings: any[] = [];
    for (const bookId of bookIds) {
      
      const bookRatings = await dbStorage.getRatings(bookId);
      
      allRatings = [...allRatings, ...bookRatings];
    }
    
    
    if (allRatings.length > 0) {
      
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
          author: book?.authorName || 'Unknown Author',
          coverImageUrl: book?.images?.find(img => img.imageType === "book-detail")?.imageUrl || null
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

// Endpoint to reply to a review (Pro only)
router.post("/reviews/:reviewId/reply", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }

  // Check if user is a Pro member
  if (!req.user.isPro) {
    return res.status(403).json({ error: "Pro membership required to reply to reviews" });
  }

  try {
    const reviewId = parseInt(req.params.reviewId);
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Reply content cannot be empty" });
    }

    

    // Verify the review exists
    const ratingExists = await db.query.ratings.findFirst({
      where: eq(ratings.id, reviewId)
    });

    if (!ratingExists) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Create the reply
    const [reply] = await db
      .insert(replies)
      .values({
        reviewId: reviewId,
        authorId: req.user.id,
        content: content,
        createdAt: new Date()
      })
      .returning();

    if (!reply) {
      return res.status(500).json({ error: "Failed to create reply" });
    }

    const author = await dbStorage.getUser(req.user.id);

    return res.status(201).json({
      ...reply,
      author: {
        username: author?.username || 'Unknown',
        profileImageUrl: author?.profileImageUrl
      }
    });
  } catch (error) {
    console.error("Error replying to review:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get book performance metrics
router.post("/metrics", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }
  
  // Check if the user is a Pro user
  if (!req.user.isPro) {
    return res.status(403).json({ error: "Pro membership required" });
  }

  try {
    const { bookIds, days, metrics } = req.body;
    
    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json({ error: "Book IDs are required and must be an array" });
    }
    
    // First get the author information to verify book ownership
    const author = await dbStorage.getAuthorByUserId(req.user.id);
    
    if (!author) {
      
      return res.status(404).json({ error: "Author not found" });
    }
    
    
    
    // Get all books by this author
    const authorBooks = await dbStorage.getBooksByAuthor(author.id);
    
    
    // Get the book metrics data
    const metricsData = await dbStorage.getBooksMetrics(
      bookIds,
      days || 30,
      metrics || ["impressions", "clicks", "ctr"]
    );
    
    // Format the response to match what the frontend expects
    const bookTitles = new Map<number, string>();
    
    // Get book titles
    for (const bookId of bookIds) {
      const book = await dbStorage.getBook(bookId);
      if (book) {
        bookTitles.set(bookId, book.title);
      }
    }
    
    // Transform the metrics data format
    const formattedMetrics = bookIds.map(bookId => {
      // Initialize the response object
      const bookPerformance = {
        bookId,
        title: bookTitles.get(bookId) || `Book ${bookId}`,
        metrics: {
          impressions: [] as Array<{ date: string; count: number }>,
          clicks: [] as Array<{ date: string; count: number }>,
          referrals: [] as Array<{ date: string; count: number }>
        }
      };
      
      // Fill in the metrics data
      metricsData.forEach(dateMetrics => {
        const date = dateMetrics.date;
        
        // Process impressions
        if (metrics?.includes("impressions")) {
          const impressionCount = dateMetrics.metrics[`Book ${bookId}_impressions`] || 0;
          bookPerformance.metrics.impressions.push({ date, count: impressionCount });
        }
        
        // Process clicks
        if (metrics?.includes("clicks")) {
          const clickCount = dateMetrics.metrics[`Book ${bookId}_clicks`] || 0;
          bookPerformance.metrics.clicks.push({ date, count: clickCount });
        }
        
        // Process referrals (we'll use CTR as a proxy for referrals)
        if (metrics?.includes("ctr")) {
          const ctrValue = dateMetrics.metrics[`Book ${bookId}_ctr`] || 0;
          bookPerformance.metrics.referrals.push({ date, count: ctrValue });
        }
      });
      
      return bookPerformance;
    });
    
    return res.json(formattedMetrics);
  } catch (error) {
    console.error("Error fetching book metrics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get follower metrics for the author
router.get("/follower-metrics", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }
  
  // Check if the user is a Pro user
  if (!req.user.isPro) {
    return res.status(403).json({ error: "Pro membership required" });
  }

  try {
    const days = parseInt(req.query.days as string) || 30;
    
    // First get the author information
    const author = await dbStorage.getAuthorByUserId(req.user.id);
    
    if (!author) {
      
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Get total follower count
    const followerCount = await dbStorage.getFollowerCount(author.id);
    
    // Get follower metrics for trending data
    const followerMetrics = await dbStorage.getFollowerMetrics(author.id, days);
    
    // Format the trending data
    const trendingData = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Create a map of dates in the range
    const dateMap = new Map<string, { follows: number; unfollows: number }>();
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateMap.set(dateStr, { follows: 0, unfollows: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Fill in the metrics data
    followerMetrics.follows.forEach(item => {
      const data = dateMap.get(item.date);
      if (data) {
        data.follows = item.count;
      }
    });
    
    followerMetrics.unfollows.forEach(item => {
      const data = dateMap.get(item.date);
      if (data) {
        data.unfollows = item.count;
      }
    });
    
    // Convert map to array and calculate net change
    const trending = Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      followers: data.follows,
      unfollows: data.unfollows,
      netChange: data.follows - data.unfollows
    }));
    
    return res.json({
      total: followerCount,
      trending
    });
  } catch (error) {
    console.error("Error fetching follower metrics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;