import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";

const router = Router();

/**
 * GET /api/public/authors/:id/publisher
 * Get publisher details for a specific author
 * Public endpoint - no authentication required
 */
router.get("/authors/:id/publisher", async (req: Request, res: Response) => {
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: "Invalid author ID" });
  }

  try {
    // Check if the author exists first
    const author = await dbStorage.getAuthor(authorId);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Get the publisher for this author
    const publisher = await dbStorage.getAuthorPublisher(authorId);
    
    // For debugging
    console.log(`Public API - Publisher for author ${authorId}:`, publisher);
    
    if (!publisher) {
      return res.json(null); // No publisher associated with this author
    }
    
    return res.json(publisher);
  } catch (error) {
    console.error("Error fetching author publisher:", error);
    return res.status(500).json({ error: "Failed to fetch author publisher" });
  }
});

export default router;