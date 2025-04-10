import { Request, Response, Router } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { storyPreferences, genreTaxonomies } from "@shared/schema";

// Extend session types
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const router = Router();

// Get story preferences for the current user
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.session.userId;
    
    // Get the user's story preferences
    const preferences = await db.query.storyPreferences.findFirst({
      where: eq(storyPreferences.userId, userId)
    });
    
    // Return existing preferences or an empty object
    res.json(preferences || {});
  } catch (error) {
    console.error("Error fetching story preferences:", error);
    res.status(500).json({ error: "Failed to fetch story preferences" });
  }
});

// Create or update story preferences
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.session.userId;
    const { genres, subgenres, themes, tropes, combinedRanking } = req.body;
    
    // Validate the data
    // At least one genre, theme, and trope are required
    if (!genres || genres.length === 0) {
      return res.status(400).json({ error: "At least one genre is required" });
    }
    
    if (!themes || themes.length === 0) {
      return res.status(400).json({ error: "At least one theme is required" });
    }
    
    if (!tropes || tropes.length === 0) {
      return res.status(400).json({ error: "At least one trope is required" });
    }
    
    // First get the current preferences
    const existingPreferences = await db.query.storyPreferences.findFirst({
      where: eq(storyPreferences.userId, userId)
    });
    
    // Now either update or insert
    if (existingPreferences) {
      // Update existing preferences
      await db
        .update(storyPreferences)
        .set({
          genres,
          subgenres: subgenres || [],
          themes,
          tropes,
          combinedRanking,
          updatedAt: new Date()
        })
        .where(eq(storyPreferences.userId, userId));
      
      res.json({ 
        id: existingPreferences.id,
        message: "Story preferences updated successfully" 
      });
    } else {
      // Insert new preferences
      const result = await db
        .insert(storyPreferences)
        .values({
          userId,
          genres,
          subgenres: subgenres || [],
          themes,
          tropes,
          combinedRanking,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning({ id: storyPreferences.id });
      
      res.status(201).json({ 
        id: result[0].id,
        message: "Story preferences created successfully" 
      });
    }
  } catch (error) {
    console.error("Error saving story preferences:", error);
    res.status(500).json({ error: "Failed to save story preferences" });
  }
});

// Get genres by type
router.get("/genres/types/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const validTypes = ["genre", "subgenre", "theme", "trope"];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid genre type" });
    }
    
    // Query the database for genres of the specified type
    const genresByType = await db.query.genreTaxonomies.findMany({
      where: eq(genreTaxonomies.type, type as any),
      orderBy: genreTaxonomies.name
    });
    
    res.json(genresByType);
  } catch (error) {
    console.error(`Error fetching ${req.params.type}s:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.type}s` });
  }
});

// Get a specific genre by ID
router.get("/genres/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const genreId = parseInt(id, 10);
    
    if (isNaN(genreId)) {
      return res.status(400).json({ error: "Invalid genre ID" });
    }
    
    // Query the database for the specific genre
    const genre = await db.query.genreTaxonomies.findFirst({
      where: eq(genreTaxonomies.id, genreId)
    });
    
    if (!genre) {
      return res.status(404).json({ error: "Genre not found" });
    }
    
    res.json(genre);
  } catch (error) {
    console.error("Error fetching genre:", error);
    res.status(500).json({ error: "Failed to fetch genre" });
  }
});

export default router;