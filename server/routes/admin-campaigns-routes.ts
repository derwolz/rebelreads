import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { insertCampaignSchema } from "@shared/schema";
import { ZodError } from "zod";
import { formatZodError } from "../utils/formatZodError";

const router = Router();

// Middleware to check if user is admin
async function isAdmin(req: Request, res: Response, next: Function) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await dbStorage.getUserById(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Apply admin check middleware to all routes
router.use(isAdmin);

// Get all campaigns (admin view)
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get all campaigns with associated books
    const campaigns = await dbStorage.getAllCampaigns();
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching all campaigns:", error);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// Create a new campaign (admin version)
router.post("/", async (req: Request, res: Response) => {
  try {
    const campaignData = req.body;
    
    // Validate campaign data
    const validatedData = insertCampaignSchema.parse(campaignData);
    
    // Create campaign with system author ID if no author is specified
    const authorId = validatedData.authorId || 1; // Default to system author if not specified
    
    // Create the campaign
    const campaign = await dbStorage.createCampaign({
      ...validatedData,
      authorId
    });
    
    res.status(201).json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: formatZodError(error)
      });
    }
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// Update campaign status
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!["active", "paused", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    const updatedCampaign = await dbStorage.updateCampaignStatus(
      campaignId,
      status as "active" | "paused" | "completed"
    );
    
    res.json(updatedCampaign);
  } catch (error) {
    console.error("Error updating campaign status:", error);
    res.status(500).json({ error: "Failed to update campaign status" });
  }
});

// Get books for campaign creation (simplified list)
router.get("/books/list", async (req: Request, res: Response) => {
  try {
    const books = await dbStorage.getAllBooks();
    
    // Map to a simpler format with just what we need for the selection UI
    const booksList = books.map(book => ({
      id: book.id,
      title: book.title,
      authorId: book.authorId,
      authorName: book.authorName
    }));
    
    res.json(booksList);
  } catch (error) {
    console.error("Error fetching books list:", error);
    res.status(500).json({ error: "Failed to fetch books list" });
  }
});

// Get metrics for a specific campaign
router.get("/:id/metrics", async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: "Invalid campaign ID" });
    }
    
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const metrics = await dbStorage.getAdMetrics(campaignId, days);
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching campaign metrics:", error);
    res.status(500).json({ error: "Failed to fetch campaign metrics" });
  }
});

export default router;