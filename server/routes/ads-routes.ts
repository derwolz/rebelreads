import express, { Request, Response } from "express";
import { dbStorage } from "../storage";
import { insertAdImpressionSchema } from "@shared/schema";
import { z } from "zod";

const router = express.Router();

// Record an ad impression
router.post("/impressions", async (req: Request, res: Response) => {
  try {
    const data = insertAdImpressionSchema.parse(req.body);
    const impression = await dbStorage.recordAdImpression({
      ...data,
      userId: req.isAuthenticated() ? req.user!.id : null,
    });
    res.status(201).json(impression);
  } catch (error) {
    console.error("Error recording ad impression:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to record ad impression" });
  }
});

// Record an ad click
router.post("/clicks/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid impression ID" });
    }
    
    const impression = await dbStorage.recordAdClick(id);
    res.json(impression);
  } catch (error) {
    console.error("Error recording ad click:", error);
    res.status(500).json({ error: "Failed to record ad click" });
  }
});

// Get ad impressions for a campaign
router.get("/campaign/:campaignId/impressions", async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: "Invalid campaign ID" });
    }
    
    const impressions = await dbStorage.getAdImpressions(campaignId);
    res.json(impressions);
  } catch (error) {
    console.error("Error fetching ad impressions:", error);
    res.status(500).json({ error: "Failed to fetch ad impressions" });
  }
});

// Get ad impressions for a book
router.get("/book/:bookId/impressions", async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.bookId);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }
    
    const impressions = await dbStorage.getAdImpressionsByBook(bookId);
    res.json(impressions);
  } catch (error) {
    console.error("Error fetching book ad impressions:", error);
    res.status(500).json({ error: "Failed to fetch book ad impressions" });
  }
});

// Get ad metrics for a campaign
router.get("/campaign/:campaignId/metrics", async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: "Invalid campaign ID" });
    }
    
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const metrics = await dbStorage.getAdMetrics(campaignId, days);
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching ad metrics:", error);
    res.status(500).json({ error: "Failed to fetch ad metrics" });
  }
});

export default router;