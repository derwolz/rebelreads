import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { requirePublisher } from "../middleware/author-auth";
import { db } from "../db";
import { authors, publishersAuthors } from "@shared/schema";
import { eq, and, not, isNull, inArray } from "drizzle-orm";

const router = Router();

/**
 * GET /api/catalogue/authors/available
 * Get all authors that are not currently associated with the publisher
 * Protected route: Requires publisher authentication
 */
router.get("/available", requirePublisher, async (req: Request, res: Response) => {
  try {
    // Get the publisher for the authenticated user
    const publisher = await dbStorage.getPublisherByUserId(req.user!.id);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    // Get all authors that are currently associated with this publisher
    const currentAuthors = await db
      .select({
        authorId: publishersAuthors.authorId,
      })
      .from(publishersAuthors)
      .where(
        and(
          eq(publishersAuthors.publisherId, publisher.id),
          isNull(publishersAuthors.contractEnd)
        )
      );
    
    const currentAuthorIds = currentAuthors.map(a => a.authorId);
    
    // Get all authors that are not currently associated with this publisher
    let availableAuthors;
    
    if (currentAuthorIds.length > 0) {
      availableAuthors = await db
        .select()
        .from(authors)
        .where(
          not(inArray(authors.id, currentAuthorIds))
        );
    } else {
      // If there are no current authors, get all authors
      availableAuthors = await db
        .select()
        .from(authors);
    }
    
    res.json(availableAuthors);
  } catch (error) {
    console.error("Error getting available authors:", error);
    res.status(500).json({ error: "Failed to get available authors" });
  }
});

export default router;