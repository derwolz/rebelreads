import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { db } from "../db";
import { genreTaxonomies, insertGenreTaxonomySchema } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Get all genres, subgenres, tropes, and themes
router.get("/", async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
    
    let conditions = [isNull(genreTaxonomies.deletedAt)];
    
    if (type) {
      conditions.push(eq(genreTaxonomies.type, type));
    }
    
    if (parentId) {
      conditions.push(eq(genreTaxonomies.parentId, parentId));
    } else if (type === 'subgenre') {
      // For subgenres, only return ones with a parentId
      conditions.push(sql`${genreTaxonomies.parentId} IS NOT NULL`);
    }
    
    const result = await db.select()
      .from(genreTaxonomies)
      .where(and(...conditions));
      
    res.json(result);
  } catch (error) {
    console.error("Error fetching genres:", error);
    res.status(500).json({ error: "Failed to fetch genres" });
  }
});

// Get a specific genre by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await db.select()
      .from(genreTaxonomies)
      .where(and(
        eq(genreTaxonomies.id, id),
        isNull(genreTaxonomies.deletedAt)
      ))
      .limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Genre not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching genre:", error);
    res.status(500).json({ error: "Failed to fetch genre" });
  }
});

// Create a new genre (admin only)
router.post("/", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedData = insertGenreTaxonomySchema.parse(req.body);
    
    const result = await db.insert(genreTaxonomies)
      .values(validatedData)
      .returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating genre:", error);
    res.status(500).json({ error: "Failed to create genre" });
  }
});

// Update a genre (admin only)
router.put("/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertGenreTaxonomySchema.parse(req.body);
    
    const result = await db.update(genreTaxonomies)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(genreTaxonomies.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Genre not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating genre:", error);
    res.status(500).json({ error: "Failed to update genre" });
  }
});

// Soft delete a genre (admin only)
router.delete("/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await db.update(genreTaxonomies)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(genreTaxonomies.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Genre not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting genre:", error);
    res.status(500).json({ error: "Failed to delete genre" });
  }
});

// Import genres from bulk data (admin only)
router.post("/import", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid import data format" });
    }
    
    // Process each genre item
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const validatedData = insertGenreTaxonomySchema.parse(item);
          const result = await db.insert(genreTaxonomies)
            .values(validatedData)
            .returning();
          return result[0];
        } catch (error) {
          console.error(`Error importing item ${JSON.stringify(item)}:`, error);
          return { error: error instanceof Error ? error.message : "Unknown error", item };
        }
      })
    );
    
    res.status(201).json({
      success: true,
      imported: results.filter(r => !('error' in r)).length,
      total: items.length,
      results
    });
  } catch (error) {
    console.error("Error importing genres:", error);
    res.status(500).json({ error: "Failed to import genres" });
  }
});

export default router;