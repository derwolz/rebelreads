import { Router, Request, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Endpoint to auto-login a test user for development purposes
router.get("/auto-login", async (req: Request, res: Response) => {
  try {
    // Find a user - first one available
    const user = await db.query.users.findFirst();
    
    if (!user) {
      return res.status(404).json({ error: "No users found" });
    }
    
    // Set the user in the session
    if (req.session) {
      (req.session as any).userId = user.id;
      (req as any).user = user;
    }
    
    return res.json(user);
  } catch (error) {
    console.error("Error in auto-login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get or create a test author account
router.get("/create-test-author", async (req: Request, res: Response) => {
  try {
    // Check if test author exists
    let author = await db.query.users.findFirst({
      where: eq(users.email, "testauthor@example.com"),
    });
    
    if (!author) {
      // Create a test author
      const result = await db.insert(users).values({
        email: "testauthor@example.com",
        username: "testauthor",
        password: "password123", // This would be hashed in a real app
        isAuthor: true,
        authorName: "Test Author",
        authorBio: "This is a test author account for development.",
      }).returning();
      
      author = result[0];
    }
    
    // Set as the current user
    if (req.session) {
      (req.session as any).userId = author.id;
      (req as any).user = author;
    }
    
    return res.json(author);
  } catch (error) {
    console.error("Error creating test author:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to set the current user as Pro
router.get("/set-pro", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Set pro expiration date to 1 year from now
    const proExpiresAt = new Date();
    proExpiresAt.setFullYear(proExpiresAt.getFullYear() + 1);
    
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
    
    // Update session user
    if (req.session) {
      (req as any).user = updatedUser;
    }
    
    return res.json(updatedUser);
  } catch (error) {
    console.error("Error setting user as Pro:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to remove Pro status from the current user
router.get("/remove-pro", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Remove Pro status
    await db.update(users)
      .set({
        isPro: false,
        proExpiresAt: null,
      })
      .where(eq(users.id, req.user.id));
    
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });
    
    // Update session user
    if (req.session) {
      (req as any).user = updatedUser;
    }
    
    return res.json(updatedUser);
  } catch (error) {
    console.error("Error removing Pro status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;