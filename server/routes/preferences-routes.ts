import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { 
  insertPreferenceTaxonomySchema,
  insertUserPreferenceTaxonomySchema,
  userPreferenceTaxonomies
} from "@shared/schema";
import { z } from "zod";

const router = Router();

// Get all user preference taxonomies
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

// Save user preferences (favorite genres and preference taxonomies)
router.post("/user/preferences", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { favoriteGenres } = req.body;

    // Validate favorite genres
    if (!Array.isArray(favoriteGenres)) {
      return res.status(400).json({ error: "Invalid favorite genres format" });
    }

    // Update user's favorite genres
    await dbStorage.updateUserFavoriteGenres(req.user.id, favoriteGenres);

    res.json({ message: "Preferences saved successfully" });
  } catch (error) {
    console.error("Error saving user preferences:", error);
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

// Record a preference view
router.post("/user/preference-view", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const schema = z.object({
      taxonomyId: z.number(),
      position: z.number().default(0),
      weight: z.number().default(1)
    });

    const validatedData = schema.parse(req.body);
    
    // Create a preference taxonomy view for the user
    const data = {
      userId: req.user.id,
      taxonomyId: validatedData.taxonomyId,
      position: validatedData.position,
      weight: validatedData.weight
    };

    const userPreference = await dbStorage.createUserPreferenceTaxonomy(data);
    res.status(201).json(userPreference);
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