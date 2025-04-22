import { Router, Request, Response } from "express";
import { dbStorage } from "../../storage";

const router = Router();

/**
 * GET /api/dashboard
 * Get dashboard data for the logged-in user
 * Authentication required
 */
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    // Get user's wishlist count
    const wishlistBooks = await dbStorage.getWishlistBooks(req.user!.id);
    
    // Get user's completed books count
    const completedBooks = await dbStorage.getCompletedBooks(req.user!.id);
    
    // Get user's ratings count
    const userRatings = await dbStorage.getUserRatings(req.user!.id);
    
    // Get authors the user follows
    const followedAuthors = await dbStorage.getFollowedAuthors(req.user!.id);
    
    // Get the user's publisher status
    const publisherStatus = await dbStorage.getPublisherStatus(req.user!.id);
    
    // Get the user's author status
    const author = await dbStorage.getAuthorByUserId(req.user!.id);
    const isAuthor = !!author;
    
    // Get the user's recent activity (impressions, ratings, etc.)
    const recentActivity = await dbStorage.getUserRecentActivity(req.user!.id, 10);
    
    const dashboardData = {
      wishlistCount: wishlistBooks.length,
      completedCount: completedBooks.length,
      ratingCount: userRatings.length,
      followingCount: followedAuthors.length,
      isPublisher: !!publisherStatus,
      isAuthor: isAuthor,
      recentActivity,
    };
    
    res.json(dashboardData);
  } catch (error: any) {
    console.error(`Error getting dashboard data:`, error);
    res.status(500).json({ error: error.message || "Failed to get dashboard data" });
  }
});

export default router;