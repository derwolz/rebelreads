import { Router } from "express";
import { feedbackStorage } from "../storage/feedback";
import { insertFeedbackTicketSchema } from "@shared/schema";
import { Request } from "express";
import { User } from "@shared/schema";

interface RequestWithUser extends Request {
  user?: User;
}

/**
 * Router for feedback-related API routes
 */
const router = Router();

/**
 * Create a new feedback ticket
 * @route POST /api/feedback
 */
router.post("/", async (req: RequestWithUser, res) => {
  try {
    // Validate request body
    const validationResult = insertFeedbackTicketSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.error.format(),
      });
    }
    
    // Get user ID if authenticated
    const userId = req.user?.id;
    
    // Create the feedback ticket
    const ticket = await feedbackStorage.createFeedbackTicket(validationResult.data, userId);
    
    // Return the ticket with its number
    return res.status(201).json({
      message: "Feedback submitted successfully",
      ticketNumber: ticket.ticketNumber,
      ticket,
    });
  } catch (error) {
    console.error("Error creating feedback ticket:", error);
    return res.status(500).json({ error: "Failed to submit feedback" });
  }
});

/**
 * Get a feedback ticket by ticket number
 * @route GET /api/feedback/:ticketNumber
 */
router.get("/:ticketNumber", async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    
    // Get the ticket
    const ticket = await feedbackStorage.getFeedbackTicketByNumber(ticketNumber);
    
    if (!ticket) {
      return res.status(404).json({ error: "Feedback ticket not found" });
    }
    
    // Check if the ticket belongs to the user or if user is an admin
    if (req.user && (ticket.userId === req.user.id || req.user.isAuthor)) {
      return res.json(ticket);
    }
    
    // If ticket is not associated with a user, return limited info
    if (!ticket.userId) {
      // Return limited info for anonymous tickets
      return res.json({
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt,
        type: ticket.type,
      });
    }
    
    // If it's another user's ticket, don't allow access
    return res.status(403).json({ error: "Not authorized to view this ticket" });
  } catch (error) {
    console.error("Error getting feedback ticket:", error);
    return res.status(500).json({ error: "Failed to get feedback ticket" });
  }
});

/**
 * Get all feedback tickets for the authenticated user
 * @route GET /api/feedback/user/tickets
 */
router.get("/user/tickets", async (req: RequestWithUser, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get all tickets for the user
    const tickets = await feedbackStorage.getUserFeedbackTickets(req.user.id);
    
    return res.json(tickets);
  } catch (error) {
    console.error("Error getting user feedback tickets:", error);
    return res.status(500).json({ error: "Failed to get user feedback tickets" });
  }
});

/**
 * Admin route: Get all feedback tickets
 * @route GET /api/feedback/admin/all
 */
router.get("/admin/all", async (req: RequestWithUser, res) => {
  try {
    if (!req.user || !req.user.isAuthor) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    // Get all tickets
    const tickets = await dbStorage.getFeedbackTickets();
    
    return res.json(tickets);
  } catch (error) {
    console.error("Error getting all feedback tickets:", error);
    return res.status(500).json({ error: "Failed to get all feedback tickets" });
  }
});

/**
 * Admin route: Update a feedback ticket
 * @route PATCH /api/feedback/admin/:id
 */
router.patch("/admin/:id", async (req: RequestWithUser, res) => {
  try {
    if (!req.user || !req.user.isAuthor) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    // Get the ticket first to make sure it exists
    const existingTicket = await dbStorage.getFeedbackTicket(parseInt(id));
    
    if (!existingTicket) {
      return res.status(404).json({ error: "Feedback ticket not found" });
    }
    
    // Update the ticket
    const updatedTicket = await dbStorage.updateFeedbackTicket(parseInt(id), updates);
    
    return res.json(updatedTicket);
  } catch (error) {
    console.error("Error updating feedback ticket:", error);
    return res.status(500).json({ error: "Failed to update feedback ticket" });
  }
});

export default router;