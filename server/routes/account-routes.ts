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
    
    // Set content type header explicitly
    res.setHeader('Content-Type', 'application/json');
    
    if (!preferences) {
      // Return default preferences if none exist yet
      return res.json({ 
        enjoyment: 0.35,
        writing: 0.25,
        themes: 0.20,
        characters: 0.12,
        worldbuilding: 0.08
      });
    }
    
    // Log what we're sending back
    console.log("Returning preferences:", JSON.stringify(preferences));
    
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
  
  // Set content type header explicitly
  res.setHeader('Content-Type', 'application/json');
  
  // Validate the request body
  const schema = z.object({
    enjoyment: z.number(),
    writing: z.number(),
    themes: z.number(),
    characters: z.number(),
    worldbuilding: z.number()
  });
  
  try {
    console.log("Rating preferences POST - Request body:", req.body);
    console.log("Rating preferences POST - User ID:", req.user.id);
    
    const weights = schema.parse(req.body);
    
    const preferences = await dbStorage.saveRatingPreferences(req.user.id, weights);
    
    console.log("Rating preferences POST - Successfully saved:", JSON.stringify(preferences));
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

// Get user's genre taxonomies
router.get("/user-genre-taxonomies", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const userGenreTaxonomies = await dbStorage.getUserGenreTaxonomies(req.user.id);
    res.json(userGenreTaxonomies);
  } catch (error) {
    console.error("Error getting user genre taxonomies:", error);
    res.status(500).json({ error: "Failed to retrieve user genre taxonomies" });
  }
});

// Save user's genre taxonomies
router.post("/user-genre-taxonomies", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Validate the request body
  const taxonomiesSchema = z.array(
    z.object({
      taxonomyId: z.number(),
      position: z.number()
    })
  );
  
  try {
    const taxonomies = taxonomiesSchema.parse(req.body);
    const result = await dbStorage.saveUserGenreTaxonomies(req.user.id, taxonomies);
    res.json(result);
  } catch (error) {
    console.error("Error saving user genre taxonomies:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to save user genre taxonomies" });
  }
});

export default router;