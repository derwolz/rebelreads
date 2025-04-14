import { Router, json } from "express";
import { dbStorage } from "../storage";

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

    // Create signup interest record
    const signupInterest = await dbStorage.createSignupInterest({
      email,
      isAuthorInterest,
      isPublisher,
      sessionId,
    });

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

export default router;