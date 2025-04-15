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
 * Get all publishers along with their authors and books with genre taxonomies
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
        
        // For each author, get their books with genre taxonomies
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
            
            // Add genre taxonomies to each book
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
              author: {
                ...author,
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  displayName: user.displayName
                }
              },
              books: booksWithTaxonomies
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
 * Get information for the currently logged in author, including profile, books, book images, and genre taxonomies
 * Authenticated route with author check
 */
router.get("/author", requireAuthor, async (req: Request, res: Response) => {
  try {
    // Get the current user's author profile
    const author = await dbStorage.getAuthorByUserId(req.user!.id);
    
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Get user profile data
    const userData = await db.select().from(users).where(eq(users.id, author.userId)).limit(1);
    
    if (userData.length === 0) {
      return res.status(404).json({ error: "User profile not found" });
    }
    
    const user = userData[0];
    
    // Get all books by this author
    const authorBooks = await dbStorage.getBooksByAuthor(author.id);
    
    // Get images for all books
    const bookIds = authorBooks.map(book => book.id);
    
    // Only fetch images if there are books
    let allImages: any[] = [];
    if (bookIds.length > 0) {
      allImages = await db.select().from(bookImages).where(inArray(bookImages.bookId, bookIds));
    }
    
    // Group images by book ID
    const imagesByBookId = new Map<number, any[]>();
    allImages.forEach(image => {
      if (!imagesByBookId.has(image.bookId)) {
        imagesByBookId.set(image.bookId, []);
      }
      imagesByBookId.get(image.bookId)!.push({
        id: image.id,
        imageUrl: image.imageUrl,
        imageType: image.imageType,
        width: image.width,
        height: image.height,
        sizeKb: image.sizeKb
      });
    });
    
    // Add images and taxonomies to each book
    const booksWithImagesAndTaxonomies = await Promise.all(
      authorBooks.map(async (book) => {
        // Get taxonomies for this book
        const taxonomies = await dbStorage.getBookTaxonomies(book.id);
        
        return {
          ...book,
          images: imagesByBookId.get(book.id) || [],
          genreTaxonomies: taxonomies
        };
      })
    );
    
    // Build the response data
    const authorData = {
      author: {
        ...author,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName
        }
      },
      books: booksWithImagesAndTaxonomies
    };
    
    res.json([authorData]); // Return as array for backwards compatibility
  } catch (error) {
    console.error("Error getting author catalogue:", error);
    res.status(500).json({ error: "Failed to retrieve author catalogue" });
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