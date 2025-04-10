import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

const router = Router();

// Get current user profile
router.get("/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const user = await dbStorage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Don't send sensitive info
    const { password, ...profile } = user;
    
    res.json(profile);
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({ error: "Failed to retrieve profile" });
  }
});

// Get user's rating preferences
router.get("/rating-preferences", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const preferences = await dbStorage.getRatingPreferences(req.user.id);
    
    if (!preferences) {
      // Return default preferences if none exist yet
      return res.json({ 
        criteriaOrder: ["enjoyment", "writing", "themes", "characters", "worldbuilding"] 
      });
    }
    
    res.json(preferences);
  } catch (error) {
    console.error("Error getting rating preferences:", error);
    res.status(500).json({ error: "Failed to retrieve rating preferences" });
  }
});

// Save user's rating preferences
router.post("/rating-preferences", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    console.log("Rating preferences POST - User not authenticated");
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Validate the request body
  const schema = z.object({
    criteriaOrder: z.array(z.string()).length(5),
    criteriaWeights: z.record(z.string(), z.number()).optional()
  });
  
  try {
    console.log("Rating preferences POST - Request body:", req.body);
    console.log("Rating preferences POST - User ID:", req.user.id);
    
    const { criteriaOrder, criteriaWeights } = schema.parse(req.body);
    
    const preferences = await dbStorage.saveRatingPreferences(req.user.id, criteriaOrder, criteriaWeights);
    
    console.log("Rating preferences POST - Successfully saved:", preferences);
    res.json(preferences);
  } catch (error) {
    console.error("Error saving rating preferences:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to save rating preferences" });
  }
});

// Update user profile
router.patch("/user", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // If hasCompletedOnboarding is in the request, update it
    if (req.body.hasCompletedOnboarding !== undefined) {
      // Update the user record
      await db
        .update(users)
        .set({ hasCompletedOnboarding: !!req.body.hasCompletedOnboarding })
        .where(eq(users.id, req.user.id));
      
      // Get the updated user
      const updatedUser = await dbStorage.getUser(req.user.id);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update the session user object
      const { password, ...userWithoutPassword } = updatedUser;
      req.user = userWithoutPassword as Express.User;
      
      return res.json(userWithoutPassword);
    }
    
    // Here you would handle other profile updates
    // by validating with updateProfileSchema
    
    // For now, just return the current user
    const user = await dbStorage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
    
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;