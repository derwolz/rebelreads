import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { requirePublisher } from "../middleware/author-auth";

const router = Router();

/**
 * GET /api/catalogue/publisher/authors
 * Get all authors and their books for the current publisher
 * Protected route: Requires publisher authentication
 */
router.get("/authors", requirePublisher, async (req: Request, res: Response) => {
  try {
    // Get the publisher for the authenticated user
    const publisher = await dbStorage.getPublisherByUserId(req.user!.id);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    // Get all authors for this publisher
    const publisherAuthors = await dbStorage.getPublisherAuthors(publisher.id);
    
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
    console.error("Error getting publisher authors and books:", error);
    res.status(500).json({ error: "Failed to get publisher authors and books" });
  }
});

export default router;