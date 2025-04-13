import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { log } from "../vite";
import { db } from "../db";
import { authors, books, bookImages, publishersAuthors, publishers, users } from "@shared/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";

const router = Router();

/**
 * GET /api/catalogue/author/:authorId
 * Get all books by an author with complete information
 */
router.get("/author/:authorId", async (req: Request, res: Response) => {
  try {
    const authorId = parseInt(req.params.authorId);
    
    if (isNaN(authorId)) {
      return res.status(400).json({ error: "Invalid author ID" });
    }
    
    // First, check if the author exists
    const author = await dbStorage.getAuthor(authorId);
    
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Get all books by the author
    const authorBooks = await dbStorage.getBooksByAuthor(authorId);
    
    // Return the author information along with their books
    res.json({
      author,
      books: authorBooks
    });
  } catch (error) {
    console.error("Error getting author catalogue:", error);
    res.status(500).json({ error: "Failed to retrieve author catalogue" });
  }
});

/**
 * GET /api/catalogue/publisher/:publisherId
 * Get a publisher's catalogue of authors with their books
 */
router.get("/publisher/:publisherId", async (req: Request, res: Response) => {
  try {
    const publisherId = parseInt(req.params.publisherId);
    
    if (isNaN(publisherId)) {
      return res.status(400).json({ error: "Invalid publisher ID" });
    }
    
    // First, check if the publisher exists
    const publisher = await dbStorage.getPublisher(publisherId);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    // Get all authors under this publisher
    const publisherAuthors = await dbStorage.getPublisherAuthors(publisherId);
    
    // For each author, get their books
    const authorsWithBooks = await Promise.all(
      publisherAuthors.map(async (user) => {
        // Get the author profile
        const authorProfile = await dbStorage.getAuthorByUserId(user.id);
        
        if (!authorProfile) {
          return null;
        }
        
        // Get all books by this author
        const authorBooks = await dbStorage.getBooksByAuthor(authorProfile.id);
        
        return {
          author: {
            ...authorProfile,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              displayName: user.displayName
            }
          },
          books: authorBooks
        };
      })
    );
    
    // Filter out any null entries
    const catalogue = authorsWithBooks.filter(item => item !== null);
    
    // Return the publisher information along with their authors and books
    res.json({
      publisher,
      catalogue
    });
  } catch (error) {
    console.error("Error getting publisher catalogue:", error);
    res.status(500).json({ error: "Failed to retrieve publisher catalogue" });
  }
});

export default router;