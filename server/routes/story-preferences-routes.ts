import { Router, Request, Response } from "express";
import { db } from "../db";
import { genreTaxonomies, storyPreferences, insertStoryPreferencesSchema } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Calculate weight using the formula 1 / (1 + ln(rank))
function calculateWeight(rank: number): number {
  return 1 / (1 + Math.log(rank));
}

// Get current user's story preferences
router.get("/", async (req: Request, res: Response) => {
  try {
    // Check for authenticated user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.id;
    
    const result = await db.select()
      .from(storyPreferences)
      .where(eq(storyPreferences.userId, userId))
      .limit(1);
      
    if (result.length === 0) {
      return res.status(200).json({ 
        genres: [],
        subgenres: [],
        themes: [],
        tropes: [],
        combinedRanking: []
      });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching story preferences:", error);
    res.status(500).json({ error: "Failed to fetch story preferences" });
  }
});

// Schema for validating combined ranking items
const rankingItemSchema = z.object({
  id: z.number(),
  type: z.enum(['genre', 'subgenre', 'theme', 'trope']),
  rank: z.number().int().positive(),
});

// Schema for validating story preference updates
const updateStoryPreferencesSchema = z.object({
  genres: z.array(z.object({
    id: z.number(),
    rank: z.number().int().positive(),
  })).max(2, "Maximum 2 genres allowed"),
  
  subgenres: z.array(z.object({
    id: z.number(),
    rank: z.number().int().positive(),
  })).max(5, "Maximum 5 subgenres allowed"),
  
  themes: z.array(z.object({
    id: z.number(),
    rank: z.number().int().positive(),
  })).max(6, "Maximum 6 themes allowed"),
  
  tropes: z.array(z.object({
    id: z.number(),
    rank: z.number().int().positive(),
  })).max(7, "Maximum 7 tropes allowed"),
  
  combinedRanking: z.array(rankingItemSchema),
}).refine(data => data.genres.length > 0, {
  message: "At least one genre is required",
  path: ["genres"],
}).refine(data => data.themes.length > 0, {
  message: "At least one theme is required",
  path: ["themes"],
}).refine(data => data.tropes.length > 0, {
  message: "At least one trope is required",
  path: ["tropes"],
});

// Save or update user's story preferences
router.post("/", async (req: Request, res: Response) => {
  try {
    // Check for authenticated user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.id;
    
    // Validate input data
    const validatedData = updateStoryPreferencesSchema.parse(req.body);
    
    // Process the combined ranking to add weight values
    const combinedRanking = validatedData.combinedRanking.map(item => ({
      ...item,
      weight: calculateWeight(item.rank)
    }));
    
    // Check if the user already has preferences
    const existingPrefs = await db.select({ id: storyPreferences.id })
      .from(storyPreferences)
      .where(eq(storyPreferences.userId, userId))
      .limit(1);
    
    let result;
    
    if (existingPrefs.length > 0) {
      // Update existing preferences
      result = await db.update(storyPreferences)
        .set({
          genres: validatedData.genres,
          subgenres: validatedData.subgenres,
          themes: validatedData.themes,
          tropes: validatedData.tropes,
          combinedRanking,
          updatedAt: new Date(),
        })
        .where(eq(storyPreferences.userId, userId))
        .returning();
    } else {
      // Create new preferences
      result = await db.insert(storyPreferences)
        .values({
          userId,
          genres: validatedData.genres,
          subgenres: validatedData.subgenres,
          themes: validatedData.themes,
          tropes: validatedData.tropes,
          combinedRanking,
        })
        .returning();
    }
    
    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error saving story preferences:", error);
    res.status(500).json({ error: "Failed to save story preferences" });
  }
});

export default router;