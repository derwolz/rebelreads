import { Router, json } from "express";
import { dbStorage } from "../storage";
import { db } from "../db";
import { authors, books, bookGenreTaxonomies, publishersAuthors, publishers } from "@shared/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";

const router = Router();

// Use JSON parser middleware specifically for these routes
router.use(json());

// Simple version of the signup interest endpoint that strictly returns JSON
router.post("/signup-interest", async (req, res) => {
  try {
    const { email, isAuthorInterest, isPublisher, sessionId } = req.body;

    // Basic validation
    if (!email || sessionId === undefined) {
      return res.status(400).json({ error: "Email and session ID are required" });
    }

    // Use the standard dbStorage method, but also set the is_author field
    const signupRecord = {
      email,
      sessionId,
      isPublisher: isPublisher === true,
      isAuthorInterest: isAuthorInterest === true,
      // Set is_author to the same value to ensure consistency
      isAuthor: isAuthorInterest === true
    };
    
    const signupInterest = await dbStorage.createSignupInterest(signupRecord);
    
    // Record this as an event in the landing session if it exists
    try {
      await dbStorage.recordLandingEvent({
        sessionId,
        eventType: "signup_complete",
        eventData: { isAuthorInterest, isPublisher },
      });

      // Update session
      await dbStorage.updateLandingSession(sessionId, {
        completedSignup: true,
      });
    } catch (eventError) {
      // Log but don't fail if event recording fails (session might not exist)
      console.warn("Could not record signup event:", eventError);
    }
    
    // Send confirmation email
    try {
      // Import the email service
      const { emailService } = await import("../email");
      
      // Send signup interest confirmation email
      await emailService.sendSignupInterestEmail(email);
      console.log(`Signup interest confirmation email sent to ${email}`);
    } catch (emailError) {
      // Log but don't fail if email sending fails
      console.warn("Could not send signup interest confirmation email:", emailError);
    }

    // Always return JSON
    res.json({ 
      success: true, 
      message: "Email registered successfully",
      data: { 
        email: signupInterest.email,
        timestamp: signupInterest.createdAt
      } 
    });
  } catch (error) {
    console.error("Error handling signup interest:", error);
    res.status(500).json({ error: "Failed to process signup" });
  }
});

// Debug endpoints have been removed to prevent data exposure through scraping
// All genre data access must go through the authenticated endpoints in catalogue-routes.ts

export default router;