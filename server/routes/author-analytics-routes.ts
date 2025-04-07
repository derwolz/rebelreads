import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { insertAuthorAnalyticsSchema, insertAuthorPageViewSchema, insertAuthorFormAnalyticsSchema, AUTHOR_ACTION_TYPES } from "@shared/schema";

const router = Router();

// Middleware to ensure user is authenticated and is an author
function requireAuthor(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!req.user?.isAuthor) {
    return res.status(403).json({ error: "Author privileges required" });
  }
  
  next();
}

// Record general author action
router.post("/action", requireAuthor, async (req: Request, res: Response) => {
  try {
    const authorId = req.user!.id;
    const validatedData = insertAuthorAnalyticsSchema.parse({
      ...req.body,
      authorId
    });
    
    const action = await dbStorage.recordAuthorAction(validatedData);
    res.status(201).json(action);
  } catch (error) {
    console.error("Error recording author action:", error);
    res.status(400).json({ error: "Invalid action data" });
  }
});

// Get author actions
router.get("/actions", requireAuthor, async (req: Request, res: Response) => {
  try {
    const authorId = req.user!.id;
    const { actionTypes, startDate, endDate } = req.query;
    
    // Validate and parse action types
    let parsedActionTypes: string[] | undefined;
    if (actionTypes) {
      parsedActionTypes = (Array.isArray(actionTypes) ? actionTypes : [actionTypes]) as string[];
      // Validate each action type
      for (const type of parsedActionTypes) {
        if (!AUTHOR_ACTION_TYPES.includes(type as any)) {
          return res.status(400).json({ error: `Invalid action type: ${type}` });
        }
      }
    }
    
    // Parse dates if provided
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;
    
    if (startDate && typeof startDate === 'string') {
      parsedStartDate = new Date(startDate);
    }
    
    if (endDate && typeof endDate === 'string') {
      parsedEndDate = new Date(endDate);
    }
    
    const actions = await dbStorage.getAuthorActions(
      authorId, 
      parsedActionTypes, 
      parsedStartDate, 
      parsedEndDate
    );
    
    res.json(actions);
  } catch (error) {
    console.error("Error getting author actions:", error);
    res.status(500).json({ error: "Failed to retrieve author actions" });
  }
});

// Record page view
router.post("/page-view", requireAuthor, async (req: Request, res: Response) => {
  try {
    const authorId = req.user!.id;
    console.log("Recording page view for author:", authorId);
    console.log("Request body:", req.body);
    
    const validatedData = insertAuthorPageViewSchema.parse({
      ...req.body,
      authorId
    });
    console.log("Validated data:", validatedData);
    
    const pageView = await dbStorage.recordPageView(validatedData);
    console.log("Page view recorded:", pageView);
    res.status(201).json(pageView);
  } catch (error) {
    console.error("Error recording page view:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    res.status(400).json({ error: "Invalid page view data" });
  }
});

// Update page view exit time
router.post("/page-view/:id/exit", requireAuthor, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pageViewId = parseInt(id);
    
    if (isNaN(pageViewId)) {
      return res.status(400).json({ error: "Invalid page view ID" });
    }
    
    const exitedAt = new Date();
    const updatedPageView = await dbStorage.updatePageViewExit(pageViewId, exitedAt);
    
    if (!updatedPageView) {
      return res.status(404).json({ error: "Page view not found" });
    }
    
    res.json(updatedPageView);
  } catch (error) {
    console.error("Error updating page view exit:", error);
    res.status(500).json({ error: "Failed to update page view" });
  }
});

// Record form analytics
router.post("/form", requireAuthor, async (req: Request, res: Response) => {
  try {
    const authorId = req.user!.id;
    const validatedData = insertAuthorFormAnalyticsSchema.parse({
      ...req.body,
      authorId
    });
    
    const formAnalytics = await dbStorage.recordFormAnalytics(validatedData);
    res.status(201).json(formAnalytics);
  } catch (error) {
    console.error("Error recording form analytics:", error);
    res.status(400).json({ error: "Invalid form analytics data" });
  }
});

// Update form status
router.post("/form/:id/status", requireAuthor, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const formId = parseInt(id);
    
    if (isNaN(formId)) {
      return res.status(400).json({ error: "Invalid form ID" });
    }
    
    const { status, formData, abandonedStep } = req.body;
    
    if (!status || !["started", "completed", "abandoned"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    // Only set completedAt if status is "completed"
    const completedAt = status === "completed" ? new Date() : undefined;
    
    const updatedForm = await dbStorage.updateFormStatus(
      formId, 
      status, 
      completedAt, 
      formData, 
      abandonedStep
    );
    
    if (!updatedForm) {
      return res.status(404).json({ error: "Form not found" });
    }
    
    res.json(updatedForm);
  } catch (error) {
    console.error("Error updating form status:", error);
    res.status(500).json({ error: "Failed to update form status" });
  }
});

// Get activity summary
router.get("/summary", requireAuthor, async (req: Request, res: Response) => {
  try {
    const authorId = req.user!.id;
    const { days } = req.query;
    
    let timeRange = 30; // Default to 30 days
    
    if (days && typeof days === 'string') {
      const parsedDays = parseInt(days);
      if (!isNaN(parsedDays) && parsedDays > 0) {
        timeRange = parsedDays;
      }
    }
    
    const summary = await dbStorage.getAuthorActivitySummary(authorId, timeRange);
    res.json(summary);
  } catch (error) {
    console.error("Error getting activity summary:", error);
    res.status(500).json({ error: "Failed to retrieve activity summary" });
  }
});

export default router;