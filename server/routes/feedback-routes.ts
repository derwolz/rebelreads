import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { feedbackStorage } from "../storage/feedback";
import { insertFeedbackTicketSchema, FEEDBACK_TYPE_OPTIONS } from "@shared/schema";
import { log } from "../vite";

const router = Router();

// Create a new feedback ticket
router.post("/", async (req: Request, res: Response) => {
  try {
    // Get the current user ID if authenticated
    const userId = req.isAuthenticated() ? req.user.id : undefined;
    
    // Parse and validate the feedback data
    const result = insertFeedbackTicketSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid feedback data", 
        details: result.error.format() 
      });
    }
    
    // Collect device info
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      referrer: req.headers.referer,
      // Add more device info as needed
    };
    
    // Create the feedback ticket
    const ticket = await feedbackStorage.createFeedbackTicket(
      {
        ...result.data,
        deviceInfo
      },
      userId
    );
    
    // Return the created ticket
    res.status(201).json(ticket);
  } catch (error) {
    console.error("Error creating feedback ticket:", error);
    res.status(500).json({ error: "Failed to create feedback ticket" });
  }
});

// Get all feedback tickets (admin only)
router.get("/admin", async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || !req.user.isAuthor) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const tickets = await feedbackStorage.getFeedbackTickets();
    res.json(tickets);
  } catch (error) {
    console.error("Error getting feedback tickets:", error);
    res.status(500).json({ error: "Failed to get feedback tickets" });
  }
});

// Get current user's feedback tickets
router.get("/", async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const tickets = await feedbackStorage.getUserFeedbackTickets(req.user.id);
    res.json(tickets);
  } catch (error) {
    console.error("Error getting user feedback tickets:", error);
    res.status(500).json({ error: "Failed to get user feedback tickets" });
  }
});

// Get feedback ticket types
router.get("/types", (_req: Request, res: Response) => {
  try {
    res.json(FEEDBACK_TYPE_OPTIONS);
  } catch (error) {
    console.error("Error getting feedback types:", error);
    res.status(500).json({ error: "Failed to get feedback types" });
  }
});

// Update a feedback ticket status (admin only)
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || !req.user.isAuthor) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }
    
    // Get the ticket to make sure it exists
    const ticket = await feedbackStorage.getFeedbackTicket(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    
    // Update the ticket status
    const updatedTicket = await feedbackStorage.updateFeedbackTicket(
      ticketId,
      {
        status: req.body.status,
        priority: req.body.priority,
        assignedTo: req.body.assignedTo
      }
    );
    
    res.json(updatedTicket);
  } catch (error) {
    console.error("Error updating feedback ticket:", error);
    res.status(500).json({ error: "Failed to update feedback ticket" });
  }
});

export default router;