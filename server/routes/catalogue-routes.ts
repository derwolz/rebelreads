import { Router, Request, Response, NextFunction } from "express";
import { dbStorage } from "../storage";
import { log } from "../vite";
import { db } from "../db";
import { authors, books, bookImages, publishersAuthors, publishers, users, bookGenreTaxonomies, genreTaxonomies } from "@shared/schema";
import { eq, and, inArray, isNull, desc } from "drizzle-orm";
import { requireAuthor, requirePublisher } from "../middleware/author-auth";

const router = Router();

// Authentication middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Log for debugging
console.log("Catalogue routes registered");

/**
 * GET /api/catalogue/publisher
 * Get all publishers along with their authors and books
 * Authenticated route
 */
router.get("/publisher", requireAuth, async (req: Request, res: Response) => {
  try {
    // Get all publishers
    const publishersList = await dbStorage.getPublishers();
    
    // Process each publisher to get their authors and books
    const publishersWithAuthors = await Promise.all(
      publishersList.map(async (publisher) => {
        // Get authors for this publisher
        const publisherAuthors = await dbStorage.getPublisherAuthors(publisher.id);
        
        // For each author, get their books
        const authorsWithBooks = await Promise.all(
          publisherAuthors.map(async (author) => {
            // Get user data for this author
            const userData = await db.select().from(users).where(eq(users.id, author.userId)).limit(1);
            
            if (userData.length === 0) {
              return null;
            }
            
            const user = userData[0];
            
            // Get books by this author
            const authorBooks = await dbStorage.getBooksByAuthor(author.id);
            
            return {
              author: {
                ...author,
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
        
        // Filter out null values
        const catalogue = authorsWithBooks.filter(item => item !== null);
        
        return {
          publisher,
          catalogue
        };
      })
    );
    
    res.json(publishersWithAuthors);
  } catch (error) {
    console.error("Error getting all publishers' catalogues:", error);
    res.status(500).json({ error: "Failed to retrieve publishers catalogues" });
  }
});

/**
 * GET /api/catalogue/author
 * Get all authors along with their books
 * Authenticated route
 */
router.get("/author", requireAuth, async (req: Request, res: Response) => {
  try {
    // Get all authors from the database
    const authorsList = await db.select().from(authors);
    
    // For each author, get their books and user information
    const authorsWithBooks = await Promise.all(
      authorsList.map(async (author) => {
        // Get all books by this author
        const authorBooks = await dbStorage.getBooksByAuthor(author.id);
        
        // Get user profile for this author
        const user = await db.select().from(users).where(eq(users.id, author.userId)).limit(1);
        
        return {
          author: {
            ...author,
            user: user.length > 0 ? {
              id: user[0].id,
              username: user[0].username,
              email: user[0].email,
              displayName: user[0].displayName
            } : null
          },
          books: authorBooks
        };
      })
    );
    
    res.json(authorsWithBooks);
  } catch (error) {
    console.error("Error getting all authors' catalogues:", error);
    res.status(500).json({ error: "Failed to retrieve authors catalogues" });
  }
});

// Debug endpoint has been removed to prevent data exposure through scraping
// All genre data access must go through the authenticated endpoints

/**
 * GET /api/catalogue/genres/publisher
 * Get a list of author IDs, connected to book IDs, then each book ID has the taxonomies from book_genre_taxonomies
 * Format: { authorId: { bookId: [taxonomy objects with details] } }
 * Protected route: Requires publisher authentication only
 */
router.get("/genres/publisher", requirePublisher, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get the publisher from the user ID
    const publisher = await dbStorage.getPublisherByUserId(userId);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    // Get all authors managed by this publisher 
    const publisherAuthors = await dbStorage.getPublisherAuthors(publisher.id);
    
    console.log(`Publisher ${publisher.id} has ${publisherAuthors.length} authors`);
    
    // Initialize the result object
    const result: Record<number, Record<number, any[]>> = {};
    
    // For each author, get their books and taxonomies
    await Promise.all(
      publisherAuthors.map(async (author) => {
        // Ensure we have the author ID
        if (!author || !author.id) {
          console.error("Author missing ID:", author);
          return;
        }
        
        const authorId = author.id;
        
        // Get all books by this author
        const authorBooks = await dbStorage.getBooksByAuthor(authorId);
        console.log(`Author ${authorId} has ${authorBooks.length} books`);
        
        // We'll store all book taxonomies for this author here
        const authorBooksWithTaxonomies: Record<number, any[]> = {};
        
        // For each book, get the taxonomies
        await Promise.all(
          authorBooks.map(async (book) => {
            const bookId = book.id;
            
            // Use the helper function to get book taxonomies
            const taxonomies = await dbStorage.getBookTaxonomies(bookId);
            
            // Add to the author's books collection
            authorBooksWithTaxonomies[bookId] = taxonomies;
          })
        );
        
        // Add this author's data to the result
        result[authorId] = authorBooksWithTaxonomies;
      })
    );
    
    res.json(result);
  } catch (error) {
    console.error("Error getting publisher book genres:", error);
    res.status(500).json({ error: "Failed to retrieve publisher book genres" });
  }
});

/**
 * GET /api/catalogue/genres/author
 * Get a list of book IDs connected to taxonomy objects for the authenticated author
 * Format: { bookId: [taxonomy objects with full details] }
 * Protected route: Requires author authentication only
 */
router.get("/genres/author", requireAuthor, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get the author using the helper function
    const author = await dbStorage.getAuthorByUserId(userId);
    
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    const authorId = author.id;
    
    // Get all books by this author
    const authorBooks = await dbStorage.getBooksByAuthor(authorId);
    console.log(`Author ${authorId} has ${authorBooks.length} books`);
    
    // For each book, get the taxonomies with full details
    const bookData: Record<number, any[]> = {};
    
    await Promise.all(
      authorBooks.map(async (book) => {
        const bookId = book.id;
        
        // Use the helper function to get book taxonomies
        const taxonomies = await dbStorage.getBookTaxonomies(bookId);
        
        // Add to the book data
        bookData[bookId] = taxonomies;
      })
    );
    
    res.json(bookData);
  } catch (error) {
    console.error("Error getting author book genres:", error);
    res.status(500).json({ error: "Failed to retrieve author book genres" });
  }
});



export default router;