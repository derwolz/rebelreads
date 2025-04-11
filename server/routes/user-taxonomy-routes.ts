import { Router, Request, Response } from "express";
import { z } from "zod";
import { dbStorage } from "../storage";
import { insertUserTaxonomyPreferenceSchema, insertUserTaxonomyItemSchema } from "../../shared/schema";

const router = Router();

// Check if user is authenticated
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Get user's default taxonomy preference
router.get("/default-preference", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const preference = await dbStorage.getUserDefaultTaxonomyPreference(userId);
    
    if (!preference) {
      return res.status(404).json({ error: "No default preference found" });
    }
    
    res.json(preference);
  } catch (error: any) {
    console.error("Error fetching default preference:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's custom view preferences
router.get("/custom-views", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const preferences = await dbStorage.getUserCustomViewPreferences(userId);
    res.json(preferences);
  } catch (error: any) {
    console.error("Error fetching custom views:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all user taxonomy preferences
router.get("/preferences", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const preferences = await dbStorage.getUserTaxonomyPreferences(userId);
    res.json(preferences);
  } catch (error: any) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific preference by ID
router.get("/preferences/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }
    
    const preference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }
    
    // Check if preference belongs to the authenticated user
    if (preference.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    res.json(preference);
  } catch (error: any) {
    console.error("Error fetching preference:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new preference
router.post("/preferences", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    
    // Validate request body
    const schema = insertUserTaxonomyPreferenceSchema.extend({
      name: z.string().min(1, "Name is required"),
    });
    
    const validatedData = schema.parse({
      ...req.body,
      userId
    });
    
    const newPreference = await dbStorage.createTaxonomyPreference(validatedData);
    res.status(201).json(newPreference);
  } catch (error: any) {
    console.error("Error creating preference:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update a preference
router.patch("/preferences/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }
    
    // Check if preference exists and belongs to the user
    const preference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }
    
    if (preference.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Create a schema for update data
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      isDefault: z.boolean().optional(),
      isCustomView: z.boolean().optional(),
    });
    
    const validatedData = updateSchema.parse(req.body);
    
    const updatedPreference = await dbStorage.updateTaxonomyPreference(preferenceId, validatedData);
    res.json(updatedPreference);
  } catch (error: any) {
    console.error("Error updating preference:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Delete a preference
router.delete("/preferences/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }
    
    // Check if preference exists and belongs to the user
    const preference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }
    
    if (preference.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    await dbStorage.deleteTaxonomyPreference(preferenceId);
    res.status(204).end();
  } catch (error: any) {
    console.error("Error deleting preference:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get taxonomy items for a preference
router.get("/preferences/:id/items", requireAuth, async (req: Request, res: Response) => {
  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }
    
    // Check if preference exists and belongs to the user
    const preference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }
    
    if (preference.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const items = await dbStorage.getTaxonomyItems(preferenceId);
    res.json(items);
  } catch (error: any) {
    console.error("Error fetching taxonomy items:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add taxonomy items to a preference
router.post("/preferences/:id/items", requireAuth, async (req: Request, res: Response) => {
  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }
    
    // Check if preference exists and belongs to the user
    const preference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }
    
    if (preference.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Validate request body
    const schema = z.array(insertUserTaxonomyItemSchema.omit({ preferenceId: true }));
    const validatedData = schema.parse(req.body);
    
    const newItems = await dbStorage.addTaxonomyItems(preferenceId, validatedData);
    res.status(201).json(newItems);
  } catch (error: any) {
    console.error("Error adding taxonomy items:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Replace all taxonomy items for a preference
router.put("/preferences/:id/items", requireAuth, async (req: Request, res: Response) => {
  try {
    const preferenceId = parseInt(req.params.id);
    if (isNaN(preferenceId)) {
      return res.status(400).json({ error: "Invalid preference ID" });
    }
    
    // Check if preference exists and belongs to the user
    const preference = await dbStorage.getTaxonomyPreferenceById(preferenceId);
    
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }
    
    if (preference.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Validate request body
    const schema = z.array(insertUserTaxonomyItemSchema.omit({ preferenceId: true }));
    const validatedData = schema.parse(req.body);
    
    const newItems = await dbStorage.replaceTaxonomyItems(preferenceId, validatedData);
    res.json(newItems);
  } catch (error: any) {
    console.error("Error replacing taxonomy items:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: error.message });
  }
});

export default router;