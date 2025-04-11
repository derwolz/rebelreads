import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { HomepageSection } from "@shared/schema";

export const homepageRoutes = Router();

// Get homepage layout
homepageRoutes.get("/", async (req: Request, res: Response) => {
  // If no user is logged in, return empty sections
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userId = req.user.id;
    const sections = await dbStorage.getHomepageLayout(userId);
    res.json(sections);
  } catch (error) {
    console.error("Error getting homepage layout:", error);
    res.status(500).json({ error: "Failed to get homepage layout" });
  }
});

// Update homepage layout
homepageRoutes.put("/", async (req: Request, res: Response) => {
  // If no user is logged in, return error
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userId = req.user.id;
    const { sections } = req.body as { sections: HomepageSection[] };

    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: "Invalid request: sections must be an array" });
    }

    const updatedSections = await dbStorage.updateHomepageLayout(userId, sections);
    res.json(updatedSections);
  } catch (error) {
    console.error("Error updating homepage layout:", error);
    res.status(500).json({ error: "Failed to update homepage layout" });
  }
});