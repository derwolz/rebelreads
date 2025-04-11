import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { 
  insertPreferenceTaxonomySchema,
  insertUserPreferenceTaxonomySchema,
  userPreferenceTaxonomies
} from "@shared/schema";
import { z } from "zod";

// Add isAdmin to the User type for route authorization
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      isAdmin?: boolean;
    }
  }
}

const router = Router();

// Get all available preference taxonomies
router.get("/preferences/taxonomies", async (req: Request, res: Response) => {
  try {
    const taxonomies = await dbStorage.getPreferenceTaxonomies();
    res.json(taxonomies);
  } catch (error) {
    console.error("Error fetching preference taxonomies:", error);
    res.status(500).json({ error: "Failed to fetch preference taxonomies" });
  }
});

// Get user's preference taxonomies
router.get("/user/preference-taxonomies", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const taxonomies = await dbStorage.getUserPreferenceTaxonomies(req.user.id);
    res.json(taxonomies);
  } catch (error) {
    console.error("Error fetching user preference taxonomies:", error);
    res.status(500).json({ error: "Failed to fetch user preference taxonomies" });
  }
});

// Update user favorite genres
router.post("/preferences/update-favorites", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { genreNames } = req.body;

    // Validate genres
    if (!Array.isArray(genreNames)) {
      return res.status(400).json({ error: "Invalid genres format" });
    }

    // Update user's favorite genres
    await dbStorage.updateUserFavoriteGenres(req.user.id, genreNames);

    res.json({ 
      success: true,
      message: "Preferences saved successfully" 
    });
  } catch (error) {
    console.error("Error saving user preferences:", error);
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

// Create a view from selected taxonomies
router.post("/preferences/create-view", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const schema = z.object({
      taxonomyIds: z.array(z.number()),
      defaultPosition: z.number().default(0),
      defaultWeight: z.number().default(1.0)
    });

    const validatedData = schema.parse(req.body);
    
    // Create preference taxonomy views for each taxonomy ID
    const results = [];
    
    for (const taxonomyId of validatedData.taxonomyIds) {
      const data = {
        userId: req.user.id,
        taxonomyId,
        position: validatedData.defaultPosition,
        weight: validatedData.defaultWeight
      };

      const userPreference = await dbStorage.createUserPreferenceTaxonomy(data);
      results.push(userPreference);
    }
    
    res.status(201).json({ 
      success: true,
      message: `Created ${results.length} preference views`,
      views: results
    });
  } catch (error) {
    console.error("Error creating preference view:", error);
    res.status(500).json({ error: "Failed to create preference view" });
  }
});

// Create a new preference taxonomy (admin only)
router.post("/admin/preference-taxonomies", async (req: Request, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const data = insertPreferenceTaxonomySchema.parse(req.body);
    const taxonomy = await dbStorage.createPreferenceTaxonomy(data);
    res.status(201).json(taxonomy);
  } catch (error) {
    console.error("Error creating preference taxonomy:", error);
    res.status(500).json({ error: "Failed to create preference taxonomy" });
  }
});

// Delete a user preference taxonomy
router.delete("/user/preference-taxonomies/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const taxonomyId = Number(req.params.id);
    if (isNaN(taxonomyId)) {
      return res.status(400).json({ error: "Invalid taxonomy ID" });
    }

    await dbStorage.deleteUserPreferenceTaxonomy(req.user.id, taxonomyId);
    res.json({ message: "Preference taxonomy deleted successfully" });
  } catch (error) {
    console.error("Error deleting user preference taxonomy:", error);
    res.status(500).json({ error: "Failed to delete preference taxonomy" });
  }
});

export default router;