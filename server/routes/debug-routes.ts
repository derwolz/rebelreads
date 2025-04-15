import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { db } from "../db";
import { users, publishers, authors } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Completely open debug endpoint to check user status
router.get("/user-status/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    // Get user details
    const [userDetails] = await db.select().from(users).where(eq(users.id, userId));
    if (!userDetails) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check publisher status
    const isPublisher = await dbStorage.isUserPublisher(userId);
    const publisherDetails = isPublisher ? await dbStorage.getPublisherByUserId(userId) : null;
    
    // Check author status
    const isAuthor = await dbStorage.isUserAuthor(userId);
    const authorDetails = isAuthor ? await dbStorage.getAuthorByUserId(userId) : null;
    
    // Return all the details
    return res.json({
      user: {
        id: userDetails.id,
        email: userDetails.email,
        username: userDetails.username
      },
      publisher: {
        isPublisher,
        details: publisherDetails
      },
      author: {
        isAuthor,
        details: authorDetails
      }
    });
  } catch (error) {
    console.error("Debug error checking user status:", error);
    return res.status(500).json({ error: "Error checking user status" });
  }
});

export default router;