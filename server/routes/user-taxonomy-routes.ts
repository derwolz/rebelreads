import { Router, Request, Response } from "express";
import { z } from "zod";
import { dbStorage } from "../storage";
import { insertUserTaxonomyPreferenceSchema, insertUserTaxonomyItemSchema } from "../../shared/schema";

const router = Router();

// Get all taxonomy preferences for the logged-in user
router.get("/preferences", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const preferences = await dbStorage.getUserTaxonomyPreferences(req.user.id);
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching user taxonomy preferences:", error);
    res.status(500).json({ error: "Failed to fetch user taxonomy preferences" });
  }
});

// Get default taxonomy preference for the logged-in user
router.get("/default-preference", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const preference = await dbStorage.getUserDefaultTaxonomyPreference(req.user.id);
    if (!preference) {
      return res.status(404).json({ error: "No default preference found" });
    }
    res.json(preference);
  } catch (error) {
    console.error("Error fetching default taxonomy preference:", error);
    res.status(500).json({ error: "Failed to fetch default taxonomy preference" });
  }
});

// Get custom view preferences for the logged-in user
router.get("/custom-views", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const preferences = await dbStorage.getUserCustomViewPreferences(req.user.id);
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching custom view preferences:", error);
    res.status(500).json({ error: "Failed to fetch custom view preferences" });
  }
});

// Get taxonomy preference by ID
router.get("/preferences/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }

    const preference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }

    // Check if the preference belongs to the logged-in user
    if (preference.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to access this preference" });
    }

    res.json(preference);
  } catch (error) {
    console.error("Error fetching taxonomy preference:", error);
    res.status(500).json({ error: "Failed to fetch taxonomy preference" });
  }
});

// Create a new taxonomy preference
router.post("/preferences", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Validate the request body
    const validatedData = insertUserTaxonomyPreferenceSchema.parse({
      ...req.body,
      userId: req.user.id,
    });

    const newPreference = await dbStorage.createTaxonomyPreference(validatedData);
    res.status(201).json(newPreference);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    console.error("Error creating taxonomy preference:", error);
    res.status(500).json({ error: "Failed to create taxonomy preference" });
  }
});

// Update an existing taxonomy preference
router.patch("/preferences/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }

    // Check if the preference exists and belongs to the user
    const existingPreference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    if (!existingPreference) {
      return res.status(404).json({ error: "Preference not found" });
    }

    if (existingPreference.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to update this preference" });
    }

    // Validate the request body
    const validatedData = z.object({
      name: z.string().optional(),
      isDefault: z.boolean().optional(),
      isCustomView: z.boolean().optional(),
    }).parse(req.body);

    const updatedPreference = await dbStorage.updateTaxonomyPreference(preferenceId, validatedData);
    res.json(updatedPreference);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    console.error("Error updating taxonomy preference:", error);
    res.status(500).json({ error: "Failed to update taxonomy preference" });
  }
});

// Delete a taxonomy preference
router.delete("/preferences/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }

    // Check if the preference exists and belongs to the user
    const existingPreference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    if (!existingPreference) {
      return res.status(404).json({ error: "Preference not found" });
    }

    if (existingPreference.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to delete this preference" });
    }

    await dbStorage.deleteTaxonomyPreference(preferenceId);
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting taxonomy preference:", error);
    res.status(500).json({ error: "Failed to delete taxonomy preference" });
  }
});

// Get taxonomy items for a preference
router.get("/preferences/:id/items", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }

    // Check if the preference exists and belongs to the user
    const existingPreference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    if (!existingPreference) {
      return res.status(404).json({ error: "Preference not found" });
    }

    if (existingPreference.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to access this preference" });
    }

    const items = await dbStorage.getTaxonomyItems(preferenceId);
    res.json(items);
  } catch (error) {
    console.error("Error fetching taxonomy items:", error);
    res.status(500).json({ error: "Failed to fetch taxonomy items" });
  }
});

// Replace taxonomy items for a preference
router.put("/preferences/:id/items", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }

    // Check if the preference exists and belongs to the user
    const existingPreference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    if (!existingPreference) {
      return res.status(404).json({ error: "Preference not found" });
    }

    if (existingPreference.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to modify this preference" });
    }

    // Validate the request body (array of taxonomy items)
    const taxonomyItemsSchema = z.array(
      z.object({
        taxonomyId: z.number(),
        type: z.enum(["genre", "subgenre", "theme", "trope"]),
        rank: z.number(),
      })
    );

    const validatedData = taxonomyItemsSchema.parse(req.body);
    const updatedItems = await dbStorage.replaceTaxonomyItems(preferenceId, validatedData);
    res.json(updatedItems);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    console.error("Error updating taxonomy items:", error);
    res.status(500).json({ error: "Failed to update taxonomy items" });
  }
});

export default router;