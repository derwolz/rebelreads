import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { z } from "zod";
import { formatZodError } from "../utils/formatZodError";
import { requireAuth } from "../middleware/auth";
import { adminAuthMiddleware } from "../middleware/admin-auth";

// Create router
const router = Router();

// Middleware to ensure only admin users can access these routes
router.use(requireAuth);
router.use(adminAuthMiddleware);

// Get admin information
router.get("/check", async (req: Request, res: Response) => {
  try {
    const user = await dbStorage.getUser(req.user!.id);
    return res.json({ isAdmin: true });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all campaigns for admin (across the entire platform)
router.get("/campaigns", async (req: Request, res: Response) => {
  try {
    // Get all campaigns across the platform
    const campaigns = await dbStorage.getAllCampaigns();
    return res.json(campaigns);
  } catch (error) {
    console.error("Error fetching all campaigns:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all books for campaign creation
router.get("/campaigns/books/list", async (req: Request, res: Response) => {
  try {
    // Get all books for campaign creation
    const books = await dbStorage.getAllBooks();
    return res.json(books);
  } catch (error) {
    console.error("Error fetching books for campaign creation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Define campaign schema for validation
const campaignSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  type: z.enum(["ad", "promotion", "survey", "review_boost"]),
  status: z.enum(["active", "paused", "completed"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budget: z.string().optional(),
  books: z.array(z.number()).min(1, "Select at least one book"),
});

// Create a new campaign (admin)
router.post("/campaigns", async (req: Request, res: Response) => {
  try {
    // Validate input
    const result = campaignSchema.safeParse(req.body);
    
    if (!result.success) {
      const errors = formatZodError(result.error);
      return res.status(400).json({ error: "Invalid input", errors });
    }
    
    // Admin is creating the campaign, but we need to assign an author
    // For admin campaigns, we can use a system author ID or the admin's ID
    const adminAuthorId = 1; // System author ID (can be configured as needed)
    
    // Create the campaign
    const campaign = await dbStorage.createCampaign({
      name: result.data.name,
      type: result.data.type,
      status: result.data.status,
      startDate: result.data.startDate.toISOString(),
      endDate: result.data.endDate.toISOString(),
      authorId: adminAuthorId,
      budget: result.data.budget || "0",
      spent: "0",
      keywords: [],
      adType: "general",
      biddingStrategy: "manual",
      books: result.data.books,
    });
    
    return res.status(201).json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update campaign status
router.patch("/campaigns/:id/status", async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: "Invalid campaign ID" });
    }
    
    const { status } = req.body;
    
    if (!status || !["active", "paused", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const campaign = await dbStorage.updateCampaignStatus(
      campaignId,
      status as "active" | "paused" | "completed"
    );
    
    return res.json(campaign);
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;