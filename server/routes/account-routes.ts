import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { z } from "zod";

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
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Validate the request body
  const schema = z.object({
    criteriaOrder: z.array(z.string()).length(5)
  });
  
  try {
    const { criteriaOrder } = schema.parse(req.body);
    
    const preferences = await dbStorage.saveRatingPreferences(req.user.id, criteriaOrder);
    
    res.json(preferences);
  } catch (error) {
    console.error("Error saving rating preferences:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to save rating preferences" });
  }
});

export default router;