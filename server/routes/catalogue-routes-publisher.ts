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
    
    // For each author, get their books with genre taxonomies
    const authorsWithBooks = await Promise.all(
      publisherAuthors.map(async (author) => {
        // Get all books by this author
        const authorBooks = await dbStorage.getBooksByAuthor(author.id);
        
        // For each book, get the genre taxonomies
        const booksWithTaxonomies = await Promise.all(
          authorBooks.map(async (book) => {
            // Get taxonomies for this book
            const taxonomies = await dbStorage.getBookTaxonomies(book.id);
            
            // Return the book with taxonomies
            return {
              ...book,
              genreTaxonomies: taxonomies
            };
          })
        );
        
        return {
          author,
          books: booksWithTaxonomies,
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