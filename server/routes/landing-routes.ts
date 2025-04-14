import { Router } from "express";
import { dbStorage } from "../storage";
import type { LandingSession } from "../types";

const router = Router();

router.post("/session", async (req, res) => {
  try {
    const { sessionId, deviceInfo } = req.body;

    // Check if session exists
    let session = await dbStorage.getLandingSession(sessionId);

    if (!session) {
      // Create new session if it doesn't exist
      session = await dbStorage.createLandingSession(sessionId, deviceInfo);
    }

    res.json(session);
  } catch (error) {
    console.error("Error creating/updating landing session:", error);
    res.status(500).json({ error: "Failed to handle landing session" });
  }
});

router.post("/event", async (req, res) => {
  try {
    const { sessionId, type, data } = req.body;

    // First ensure session exists
    const session = await dbStorage.getLandingSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Record the event
    const event = await dbStorage.recordLandingEvent({
      sessionId,
      eventType: type,
      eventData: data,
    });

    // Update session based on event type
    const sessionUpdates: Partial<LandingSession> = {};

    switch (type) {
      case "section_view":
        sessionUpdates.lastSectionViewed = data.sectionIndex;
        sessionUpdates.totalSectionsViewed = (session.totalSectionsViewed || 0) + 1;
        break;
      case "theme_change":
        sessionUpdates.selectedTheme = data.theme;
        break;
      case "how_it_works_click":
        sessionUpdates.clickedHowItWorks = true;
        break;
      case "signup_click":
        sessionUpdates.clickedSignup = true;
        break;
      case "signup_complete":
        sessionUpdates.completedSignup = true;
        break;
      case "partner_form_start":
        sessionUpdates.startedPartnerForm = true;
        break;
      case "partner_form_submit":
        sessionUpdates.submittedPartnerForm = true;
        break;
      case "sidebar_view":
        sessionUpdates.lastSidebarViewed = data.panelTitle;
        sessionUpdates.totalSidebarViews = (session.totalSidebarViews || 0) + 1;
        break;
    }

    if (Object.keys(sessionUpdates).length > 0) {
      await dbStorage.updateLandingSession(sessionId, sessionUpdates);
    }

    res.json(event);
  } catch (error) {
    console.error("Error recording landing event:", error);
    res.status(500).json({ error: "Failed to record landing event" });
  }
});

router.post("/session/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await dbStorage.endLandingSession(sessionId);
    res.json(session);
  } catch (error) {
    console.error("Error ending landing session:", error);
    res.status(500).json({ error: "Failed to end landing session" });
  }
});

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

    // Record this as an event in the landing session
    await dbStorage.recordLandingEvent({
      sessionId,
      eventType: "signup_complete",
      eventData: { isAuthorInterest, isPublisher },
    });

    // Update session
    await dbStorage.updateLandingSession(sessionId, {
      completedSignup: true,
    });

    res.json({ success: true, data: signupInterest });
  } catch (error) {
    console.error("Error handling signup interest:", error);
    res.status(500).json({ error: "Failed to process signup" });
  }
});

router.post("/partnership-inquiry", async (req, res) => {
  try {
    const { name, email, company, message, sessionId } = req.body;

    // Basic validation
    if (!name || !email || !message || !sessionId) {
      return res.status(400).json({
        error: "Name, email, message, and session ID are required",
      });
    }

    // Create partnership inquiry record
    const inquiry = await dbStorage.createPartnershipInquiry({
      name,
      email,
      company,
      message,
      sessionId,
    });

    // Record this as an event in the landing session
    await dbStorage.recordLandingEvent({
      sessionId,
      eventType: "partner_form_submit",
      eventData: { hasCompany: !!company },
    });

    // Update session
    await dbStorage.updateLandingSession(sessionId, {
      submittedPartnerForm: true,
    });

    res.json({ success: true, data: inquiry });
  } catch (error) {
    console.error("Error handling partnership inquiry:", error);
    res.status(500).json({ error: "Failed to process partnership inquiry" });
  }
});

router.post("/section-content", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || content === undefined) {
      return res.status(400).json({
        error: "Title and content are required",
      });
    }

    // Store the section content
    const sectionContent = await dbStorage.updateSectionContent({
      title,
      content,
    });

    res.json({ success: true, data: sectionContent });
  } catch (error) {
    console.error("Error updating section content:", error);
    res.status(500).json({ error: "Failed to update section content" });
  }
});

export default router;