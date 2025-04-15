import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { db } from "../db";
import { users, publishers, authors } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Completely open debug endpoint to check user status
router.get("/user-status/:userId", async (req: Request, res: Response) => {
  try {
    console.log("Debug user-status endpoint called for userId:", req.params.userId);
    
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    // Get user details
    const [userDetails] = await db.select().from(users).where(eq(users.id, userId));
    if (!userDetails) {
      return res.status(404).json({ error: "User not found" });
    }
    
    console.log("User found:", userDetails.username);
    
    // Check publisher status
    const isPublisher = await dbStorage.isUserPublisher(userId);
    console.log("isPublisher result:", isPublisher);
    
    const publisherDetails = isPublisher ? await dbStorage.getPublisherByUserId(userId) : null;
    console.log("Publisher details:", publisherDetails);
    
    // Check author status
    const isAuthor = await dbStorage.isUserAuthor(userId);
    console.log("isAuthor result:", isAuthor);
    
    const authorDetails = isAuthor ? await dbStorage.getAuthorByUserId(userId) : null;
    console.log("Author details:", authorDetails);
    
    // Return all the details
    const result = {
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
    };
    
    console.log("Returning debug info:", JSON.stringify(result, null, 2));
    
    return res.json(result);
  } catch (error) {
    console.error("Debug error checking user status:", error);
    return res.status(500).json({ error: "Error checking user status" });
  }
});

export default router;