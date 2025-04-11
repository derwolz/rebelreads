import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { insertUserPreferenceTaxonomySchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { preferenceTaxonomies, userPreferenceTaxonomies, users } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Get user preference taxonomies
router.get("/user/preference-taxonomies", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const userPrefs = await dbStorage.getUserPreferenceTaxonomies(req.user.id);
    return res.json(userPrefs);
  } catch (error) {
    console.error("Error fetching user preference taxonomies:", error);
    return res.status(500).json({ error: "Error fetching preferences" });
  }
});

// Save user preferences 
router.post("/user/preferences", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const schema = z.object({
    genres: z.array(z.string())
  });

  try {
    const { genres } = schema.parse(req.body);

    // Update user's favorite genres
    await dbStorage.updateUserFavoriteGenres(req.user.id, genres);

    return res.json({ success: true });
  } catch (error) {
    console.error("Error saving user preferences:", error);
    return res.status(500).json({ error: "Error saving preferences" });
  }
});

// Create a preference view for the user
router.post("/user/preference-view", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const schema = z.object({
    taxonomies: z.array(z.string())
  });

  try {
    const { taxonomies } = schema.parse(req.body);
    
    // Create preference taxonomy entries for each taxonomy
    const createdTaxonomies = await Promise.all(
      taxonomies.map(async (name, index) => {
        const taxonomy = await dbStorage.createPreferenceTaxonomy({
          name,
          taxonomyType: "genre",
          isActive: true,
        });
        
        // Link the taxonomy to the user with a position
        await dbStorage.createUserPreferenceTaxonomy({
          userId: req.user!.id,
          taxonomyId: taxonomy.id,
          position: index,
          weight: 1.0,
        });
        
        return taxonomy;
      })
    );
    
    return res.json({ 
      success: true,
      taxonomies: createdTaxonomies
    });
  } catch (error) {
    console.error("Error creating preference view:", error);
    return res.status(500).json({ error: "Error creating view" });
  }
});

export default router;