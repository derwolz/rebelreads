import { Router, Request, Response } from "express";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { dbStorage } from "../storage";
import { db } from "../db";
import { eq, and, inArray } from "drizzle-orm";
import { 
  users,
  bookShelves,
  notes,
  userBlocks,
  publishers,
  sellers,
  contentReports,
  feedbackTickets,
  trustedDevices,
  verificationCodes,
  userGenreViews,
  viewGenres
} from "../../shared/schema";
import { ratings } from "../../shared/schema";
import { reading_status } from "../../shared/schema";
import { rating_preferences } from "../../shared/schema";

const router = Router();

/**
 * GET /api/admin/users/search
 * Search for users by email or username
 */
router.get("/search", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const results = await dbStorage.searchUsers(query, page, limit);
    return res.json(results);
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ error: "Failed to search users" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user account and all associated data
 */
router.delete("/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if the user exists
    const userExists = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userExists || userExists.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user information for security logging purposes
    const user = await dbStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Special protection for admin users
    const adminEmails = [
      process.env.ADMIN_EMAIL,
      'der.wolz@gmail.com',
      'admin@example.com',
      'admin2@example.com'
    ];
    
    if (adminEmails.includes(user.email)) {
      return res.status(403).json({ error: "Cannot delete admin users" });
    }

    // Start a transaction to delete the user and all related data
    await db.transaction(async (tx) => {
      console.log(`Starting deletion process for user ${userId} (${user.email})`);
      
      // 1. Delete author data if user is an author
      const authorData = await dbStorage.getAuthorByUserId(userId);
      if (authorData) {
        console.log(`Deleting author data for user ${userId}`);
        await dbStorage.deleteAuthor(authorData.id);
        
        // Delete the user's books if they are an author
        console.log(`Deleting books for author ${authorData.id}`);
        await dbStorage.deleteAllAuthorBooks(authorData.id);
      }
      
      // 2. Delete ratings made by this user
      console.log(`Deleting ratings for user ${userId}`);
      await tx.delete(ratings).where(eq(ratings.userId, userId));
      
      // 3. Delete reading status entries
      console.log(`Deleting reading status entries for user ${userId}`);
      await tx.delete(reading_status).where(eq(reading_status.userId, userId));
      
      // 4. Delete rating preferences
      console.log(`Deleting rating preferences for user ${userId}`);
      await tx.delete(rating_preferences).where(eq(rating_preferences.userId, userId));
      
      // 5. Delete user blocks
      console.log(`Deleting user blocks for user ${userId}`);
      await tx.delete(userBlocks).where(eq(userBlocks.userId, userId));
      
      // 6. Delete book shelves and notes
      console.log(`Deleting book shelves for user ${userId}`);
      await tx.delete(bookShelves).where(eq(bookShelves.userId, userId));
      await tx.delete(notes).where(eq(notes.userId, userId));
      
      // 7. Delete user genre views
      console.log(`Deleting genre views for user ${userId}`);
      
      // First get all view IDs for this user
      const views = await tx.select({ id: userGenreViews.id })
        .from(userGenreViews)
        .where(eq(userGenreViews.userId, userId));
      
      // Then delete the associated genres from view_genres
      if (views.length > 0) {
        const viewIds = views.map(v => v.id);
        await tx.delete(viewGenres)
          .where(inArray(viewGenres.viewId, viewIds));
      }
      
      // Now delete the views themselves
      await tx.delete(userGenreViews)
        .where(eq(userGenreViews.userId, userId));
      
      // 8. Delete verification codes
      console.log(`Deleting verification codes for user ${userId}`);
      await tx.delete(verificationCodes)
        .where(eq(verificationCodes.userId, userId));
      
      // 9. Delete trusted devices
      console.log(`Deleting trusted devices for user ${userId}`);
      await tx.delete(trustedDevices)
        .where(eq(trustedDevices.userId, userId));
      
      // 10. Delete content reports
      console.log(`Deleting content reports for user ${userId}`);
      await tx.delete(contentReports)
        .where(eq(contentReports.userId, userId));
      
      // 11. Delete seller data if user is a seller
      console.log(`Checking for seller data for user ${userId}`);
      await tx.delete(sellers)
        .where(eq(sellers.userId, userId));
      
      // 12. Delete publisher data if user is a publisher
      console.log(`Checking for publisher data for user ${userId}`);
      await tx.delete(publishers)
        .where(eq(publishers.userId, userId));
      
      // 13. Delete feedback tickets
      console.log(`Deleting feedback tickets for user ${userId}`);
      await tx.delete(feedbackTickets)
        .where(eq(feedbackTickets.userId, userId));
      
      // 14. Delete the user
      console.log(`Deleting user ${userId}`);
      await tx.delete(users)
        .where(eq(users.id, userId));
    });
    
    // Log the deletion event
    console.log(`User deleted by admin: ID=${userId}, Email=${user.email}, Username=${user.username}`);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;