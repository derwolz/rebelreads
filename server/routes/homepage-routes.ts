import { Router } from "express";
import { dbStorage } from "../storage";
import { log } from "../vite";
import { z } from "zod";

const router = Router();

// Schema for validating homepage layout update requests
const updateHomepageLayoutSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["authors_you_follow", "popular", "you_may_also_like", "wishlist", "unreviewed", "reviewed", "completed", "custom_genre_view", "coming_soon"]),
      displayMode: z.enum(["carousel", "grid", "book_rack"]),
      title: z.string(),
      itemCount: z.number(),
      visible: z.boolean(),
      customViewId: z.number().optional(),
    })
  ),
});

/**
 * Get the current user's homepage layout
 */
router.get("/", async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.user.id;
    const layout = await dbStorage.getHomepageLayout(userId);
    
    return res.json(layout);
  } catch (error) {
    log(`Error fetching homepage layout: ${error}`, "homepage-routes");
    return res.status(500).json({ error: "Failed to fetch homepage layout" });
  }
});

/**
 * Update the current user's homepage layout
 */
router.put("/", async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validate the request body
    const validationResult = updateHomepageLayoutSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid homepage layout data",
        details: validationResult.error.errors
      });
    }

    const userId = req.user.id;
    const { sections } = validationResult.data;

    // Update the homepage layout
    const updatedLayout = await dbStorage.updateHomepageLayout(userId, sections);
    
    return res.json(updatedLayout);
  } catch (error) {
    log(`Error updating homepage layout: ${error}`, "homepage-routes");
    return res.status(500).json({ error: "Failed to update homepage layout" });
  }
});

export default router;