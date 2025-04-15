import { Router, Request, Response, NextFunction } from "express";
import { dbStorage } from "../storage";
import { log } from "../vite";
import { db } from "../db";
import { authors, books, bookImages, publishersAuthors, publishers, users, bookGenreTaxonomies } from "@shared/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
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
 * Format: { authorId: { bookId: [taxonomyIds] } }
 * Protected route: Requires publisher authentication only
 */
router.get("/genres/publisher", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user!.id;
    
    // Check if user is a publisher
    const isPublisher = await dbStorage.isUserPublisher(userId);
    
    if (!isPublisher) {
      return res.status(403).json({ error: "Access denied. Only publishers can access this endpoint" });
    }
    
    // For publishers: Get only the authors they publish
    // First, get the publisher's ID
    const publisher = await db.select().from(publishers).where(eq(publishers.userId, userId)).limit(1);
    
    if (publisher.length === 0) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    
    const publisherId = publisher[0].id;
    
    // Get all authors managed by this publisher using the publishers_authors table
    const publisherAuthorsRel = await db.select().from(publishersAuthors)
      .where(eq(publishersAuthors.publisherId, publisherId));
    
    console.log(`Publisher ${publisherId} has ${publisherAuthorsRel.length} authors`);
    
    // Initialize the result object
    let result: any = {};
    
    // For each author, get their books and taxonomies
    const authorData = await Promise.all(
      publisherAuthorsRel.map(async (pa) => {
        // Get the author
        const author = await db.select().from(authors).where(eq(authors.id, pa.authorId)).limit(1);
        
        if (author.length === 0) {
          return null; // Skip if author not found
        }
        
        const authorId = author[0].id;
        console.log(`Processing author ${authorId} for publisher ${publisherId}`);
        
        // Get all books by this author
        const authorBooks = await db.select().from(books).where(eq(books.authorId, authorId));
        console.log(`Author ${authorId} has ${authorBooks.length} books`);
        
        // For each book, get the taxonomies
        const bookData = await Promise.all(
          authorBooks.map(async (book) => {
            const bookId = book.id;
            
            // Get taxonomies for this book
            const taxonomies = await db.select({
              taxonomyId: bookGenreTaxonomies.taxonomyId
            }).from(bookGenreTaxonomies).where(eq(bookGenreTaxonomies.bookId, bookId));
            
            const taxonomyIds = taxonomies.map(t => t.taxonomyId);
            
            return {
              [bookId]: taxonomyIds
            };
          })
        );
        
        // Combine all book data for this author
        const authorBooks_Taxonomies: Record<number, number[]> = {};
        bookData.forEach(book => {
          Object.assign(authorBooks_Taxonomies, book);
        });
        
        return {
          [authorId]: authorBooks_Taxonomies
        };
      })
    );
    
    // Combine all author data
    authorData.forEach(author => {
      if (author) { // Skip null values
        Object.assign(result, author);
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error getting publisher book genres:", error);
    res.status(500).json({ error: "Failed to retrieve publisher book genres" });
  }
});

/**
 * GET /api/catalogue/genres/author
 * Get a list of book IDs connected to taxonomy IDs for the authenticated author
 * Format: { bookId: [taxonomyIds] }
 * Protected route: Requires author authentication only
 */
router.get("/genres/author", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user!.id;
    
    // Check if user is an author
    const isAuthor = await dbStorage.isUserAuthor(userId);
    
    if (!isAuthor) {
      return res.status(403).json({ error: "Access denied. Only authors can access this endpoint" });
    }
    
    // Get the author's ID
    const author = await db.select().from(authors).where(eq(authors.userId, userId)).limit(1);
    
    if (author.length === 0) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    const authorId = author[0].id;
    
    // Get all books by this author
    const authorBooks = await db.select().from(books).where(eq(books.authorId, authorId));
    console.log(`Author ${authorId} has ${authorBooks.length} books`);
    
    // For each book, get the taxonomies
    const bookData: Record<number, number[]> = {};
    
    await Promise.all(
      authorBooks.map(async (book) => {
        const bookId = book.id;
        
        // Get taxonomies for this book
        const taxonomies = await db.select({
          taxonomyId: bookGenreTaxonomies.taxonomyId
        }).from(bookGenreTaxonomies).where(eq(bookGenreTaxonomies.bookId, bookId));
        
        const taxonomyIds = taxonomies.map(t => t.taxonomyId);
        
        bookData[bookId] = taxonomyIds;
      })
    );
    
    res.json(bookData);
  } catch (error) {
    console.error("Error getting author book genres:", error);
    res.status(500).json({ error: "Failed to retrieve author book genres" });
  }
});



export default router;