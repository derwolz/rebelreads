import { Router, Request, Response } from "express";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { dbStorage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

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
    
    // Special protection for admin users
    const adminEmails = [
      process.env.ADMIN_EMAIL,
      'der.wolz@gmail.com',
      'admin@example.com',
      'admin2@example.com'
    ];
    
    if (user && adminEmails.includes(user.email)) {
      return res.status(403).json({ error: "Cannot delete admin users" });
    }

    // 1. Delete author data if user is an author
    if (user) {
      const authorData = await dbStorage.getAuthorByUserId(userId);
      if (authorData) {
        await dbStorage.deleteAuthor(authorData.id);
      }
      
      // 2. Delete the user's books if they are an author
      if (authorData) {
        await dbStorage.deleteAllAuthorBooks(authorData.id);
      }
    }
    
    // 3. Delete user blocks
    const userBlocks = await dbStorage.getUserBlocks(userId);
    for (const block of userBlocks) {
      await dbStorage.deleteUserBlock(block.id, userId);
    }
    
    // 4. Delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    // Log the deletion event
    console.log(`User deleted by admin: ID=${userId}, Email=${user?.email}, Username=${user?.username}`);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;