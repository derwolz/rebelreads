import { Router, Request, Response } from "express";
import { z } from "zod";
import { dbStorage } from "../storage";
import { requirePublisher } from "../middleware/author-auth";
import { requireAuth } from "../middleware/auth";
import { db } from "../db";
import { authors, books, publishers, publishersAuthors, users } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

const router = Router();

/**
 * GET /api/publishers/debug/check-publisher-status/:userId
 * Debug endpoint to check publisher status for a user
 * Not protected - for diagnostic purposes only
 */
router.get("/debug/check-publisher-status/:userId", async (req: Request, res: Response) => {
  console.log("Debug endpoint called for user ID:", req.params.userId);
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    // Direct database check
    const isPublisher = await dbStorage.isUserPublisher(userId);
    const publisherDetails = isPublisher ? await dbStorage.getPublisherByUserId(userId) : null;
    
    // Get user details from database
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    return res.json({
      userId,
      isPublisher,
      publisherDetails,
      userInfo: user ? { 
        id: user.id, 
        email: user.email,
        username: user.username
      } : null
    });
  } catch (error) {
    console.error("Error checking publisher status:", error);
    return res.status(500).json({ error: "Error checking publisher status" });
  }
});

/**
 * GET /api/publishers/current
 * Get the current publisher profile
 * Protected route: Requires publisher authentication
 */
router.get("/current", requirePublisher, async (req: Request, res: Response) => {
  try {
    const publisher = await dbStorage.getPublisherByUserId(req.user!.id);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    res.json(publisher);
  } catch (error) {
    console.error("Error getting publisher:", error);
    res.status(500).json({ error: "Failed to get publisher data" });
  }
});

/**
 * GET /api/publishers/:id
 * Get a specific publisher by ID
 * Protected route: Requires authentication
 */
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const publisherId = parseInt(req.params.id);
    
    if (isNaN(publisherId)) {
      return res.status(400).json({ error: "Invalid publisher ID" });
    }
    
    const publisher = await dbStorage.getPublisher(publisherId);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    // Get all authors for this publisher
    const publisherAuthors = await dbStorage.getPublisherAuthors(publisherId);
    
    // For each author, get their books
    const authorsWithBooks = await Promise.all(
      publisherAuthors.map(async (author) => {
        const authorBooks = await dbStorage.getBooksByAuthor(author.id);
        
        return {
          author,
          books: authorBooks,
        };
      })
    );
    
    res.json({
      ...publisher,
      authors: authorsWithBooks,
    });
  } catch (error) {
    console.error("Error getting publisher:", error);
    res.status(500).json({ error: "Failed to get publisher data" });
  }
});

/**
 * PATCH /api/publishers/:id
 * Update a publisher profile
 * Protected route: Requires publisher authentication
 */
router.patch("/:id", requirePublisher, async (req: Request, res: Response) => {
  try {
    const publisherId = parseInt(req.params.id);
    
    if (isNaN(publisherId)) {
      return res.status(400).json({ error: "Invalid publisher ID" });
    }
    
    // Get the publisher to verify ownership
    const publisher = await dbStorage.getPublisher(publisherId);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    // Check if this publisher belongs to the authenticated user
    if (publisher.userId !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized to update this publisher" });
    }
    
    // Validate update data
    const updateSchema = z.object({
      publisher_name: z.string().min(1, "Publisher name is required").optional(),
      publisher_description: z.string().optional(),
      business_email: z.string().email("Invalid email format").optional(),
      business_phone: z.string().optional(),
      business_address: z.string().optional(),
      website: z.string().url("Invalid URL format").optional().or(z.literal('')),
      logo_url: z.string().optional(),
    });
    
    const data = updateSchema.parse(req.body);
    
    // Update publisher profile
    const updatedPublisher = await dbStorage.updatePublisher(publisherId, data);
    
    res.json(updatedPublisher);
  } catch (error) {
    console.error("Error updating publisher:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update publisher" });
  }
});

/**
 * GET /api/publishers/:id/authors
 * Get all authors for a publisher
 * Protected route: Requires publisher authentication
 */
router.get("/:id/authors", requirePublisher, async (req: Request, res: Response) => {
  try {
    const publisherId = parseInt(req.params.id);
    
    if (isNaN(publisherId)) {
      return res.status(400).json({ error: "Invalid publisher ID" });
    }
    
    // Get the publisher to verify ownership
    const publisher = await dbStorage.getPublisher(publisherId);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    // Check if this publisher belongs to the authenticated user
    if (publisher.userId !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized to access this publisher's authors" });
    }
    
    // Get all authors for this publisher
    const publisherAuthors = await dbStorage.getPublisherAuthors(publisherId);
    
    // For each author, get their books
    const authorsWithBooks = await Promise.all(
      publisherAuthors.map(async (author) => {
        const authorBooks = await dbStorage.getBooksByAuthor(author.id);
        
        return {
          author,
          books: authorBooks,
        };
      })
    );
    
    res.json(authorsWithBooks);
  } catch (error) {
    console.error("Error getting publisher authors:", error);
    res.status(500).json({ error: "Failed to get publisher authors" });
  }
});

/**
 * POST /api/publishers/:id/authors
 * Add an author to a publisher
 * Protected route: Requires publisher authentication
 */
router.post("/:id/authors", requirePublisher, async (req: Request, res: Response) => {
  try {
    const publisherId = parseInt(req.params.id);
    
    if (isNaN(publisherId)) {
      return res.status(400).json({ error: "Invalid publisher ID" });
    }
    
    // Get the publisher to verify ownership
    const publisher = await dbStorage.getPublisher(publisherId);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    // Check if this publisher belongs to the authenticated user
    if (publisher.userId !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized to update this publisher" });
    }
    
    // Validate request body
    const schema = z.object({
      author_id: z.number(),
      contract_start: z.string().transform(str => new Date(str)),
    });
    
    const data = schema.parse(req.body);
    
    // Check if author exists
    const author = await dbStorage.getAuthor(data.author_id);
    
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Check if the author is already associated with this publisher
    const existingRelation = await db
      .select()
      .from(publishersAuthors)
      .where(
        and(
          eq(publishersAuthors.publisherId, publisherId),
          eq(publishersAuthors.authorId, data.author_id),
          isNull(publishersAuthors.contractEnd)
        )
      );
    
    if (existingRelation.length > 0) {
      return res.status(400).json({ error: "Author is already associated with this publisher" });
    }
    
    // Add author to publisher
    const relation = await dbStorage.addAuthorToPublisher(
      publisherId,
      data.author_id,
      data.contract_start
    );
    
    res.status(201).json(relation);
  } catch (error) {
    console.error("Error adding author to publisher:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to add author to publisher" });
  }
});

/**
 * DELETE /api/publishers/:id/authors/:authorId
 * Remove an author from a publisher
 * Protected route: Requires publisher authentication
 */
router.delete("/:id/authors/:authorId", requirePublisher, async (req: Request, res: Response) => {
  try {
    const publisherId = parseInt(req.params.id);
    const authorId = parseInt(req.params.authorId);
    
    if (isNaN(publisherId) || isNaN(authorId)) {
      return res.status(400).json({ error: "Invalid publisher or author ID" });
    }
    
    // Get the publisher to verify ownership
    const publisher = await dbStorage.getPublisher(publisherId);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    // Check if this publisher belongs to the authenticated user
    if (publisher.userId !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized to update this publisher" });
    }
    
    // Check if the author is associated with this publisher
    const existingRelation = await db
      .select()
      .from(publishersAuthors)
      .where(
        and(
          eq(publishersAuthors.publisherId, publisherId),
          eq(publishersAuthors.authorId, authorId),
          isNull(publishersAuthors.contractEnd)
        )
      );
    
    if (existingRelation.length === 0) {
      return res.status(404).json({ error: "Author is not associated with this publisher" });
    }
    
    // Remove author from publisher
    await dbStorage.removeAuthorFromPublisher(publisherId, authorId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error removing author from publisher:", error);
    res.status(500).json({ error: "Failed to remove author from publisher" });
  }
});

export default router;