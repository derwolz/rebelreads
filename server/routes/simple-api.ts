import { Router, json } from "express";
import { dbStorage } from "../storage";
import { db } from "../db";
import { authors, books, bookGenreTaxonomies, publishersAuthors, publishers } from "@shared/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";

const router = Router();

// Use JSON parser middleware specifically for these routes
router.use(json());

// Simple version of the signup interest endpoint that strictly returns JSON
router.post("/signup-interest", async (req, res) => {
  try {
    const { email, isAuthorInterest, isPublisher, sessionId } = req.body;

    // Basic validation
    if (!email || sessionId === undefined) {
      return res.status(400).json({ error: "Email and session ID are required" });
    }

    // Use the standard dbStorage method, but also set the is_author field
    const signupRecord = {
      email,
      sessionId,
      isPublisher: isPublisher === true,
      isAuthorInterest: isAuthorInterest === true,
      // Set is_author to the same value to ensure consistency
      isAuthor: isAuthorInterest === true
    };
    
    const signupInterest = await dbStorage.createSignupInterest(signupRecord);
    
    // Record this as an event in the landing session if it exists
    try {
      await dbStorage.recordLandingEvent({
        sessionId,
        eventType: "signup_complete",
        eventData: { isAuthorInterest, isPublisher },
      });

      // Update session
      await dbStorage.updateLandingSession(sessionId, {
        completedSignup: true,
      });
    } catch (eventError) {
      // Log but don't fail if event recording fails (session might not exist)
      console.warn("Could not record signup event:", eventError);
    }

    // Always return JSON
    res.json({ 
      success: true, 
      message: "Email registered successfully",
      data: { 
        email: signupInterest.email,
        timestamp: signupInterest.createdAt
      } 
    });
  } catch (error) {
    console.error("Error handling signup interest:", error);
    res.status(500).json({ error: "Failed to process signup" });
  }
});

/**
 * GET /api/debug/book-genres
 * Debug version of the book-genres endpoint that doesn't require authentication
 * This is only for testing and should be removed in production
 */
router.get("/debug/book-genres", async (req, res) => {
  try {
    console.log("Debug book genres endpoint accessed");
    
    // Get sample data for both publisher and author views
    let result: any = {};

    // Get a sample publisher to simulate publisher-specific view
    const publishersList = await db.select().from(publishers).limit(1);
    
    if (publishersList.length > 0) {
      const publisherId = publishersList[0].id;
      console.log(`Debug endpoint using publisher ${publisherId}`);
      
      // Get all authors managed by this publisher using publishers_authors table
      const publisherAuthorsRel = await db.select().from(publishersAuthors)
        .where(eq(publishersAuthors.publisherId, publisherId));
      
      console.log(`Publisher ${publisherId} has ${publisherAuthorsRel.length} authors`);
      
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
    } else {
      console.log("No publishers found for debug endpoint");
    }

    // Now let's also get some author data for comparison
    const allBooks = await db.select().from(books).limit(3);
    
    // Get a sample of books for a test case
    const sampleBookData: Record<number, number[]> = {};
    
    // Take the first 3 books for our sample
    for (const book of allBooks) {
      const bookId = book.id;
      
      // Get taxonomies for this book
      const taxonomies = await db.select({
        taxonomyId: bookGenreTaxonomies.taxonomyId
      }).from(bookGenreTaxonomies).where(eq(bookGenreTaxonomies.bookId, bookId));
      
      const taxonomyIds = taxonomies.map(t => t.taxonomyId);
      
      sampleBookData[bookId] = taxonomyIds;
    }
    
    res.json({
      publisherView: result,
      authorView: sampleBookData
    });
  } catch (error) {
    console.error("Error debugging book genres:", error);
    res.status(500).json({ error: "Failed to retrieve debug book genres" });
  }
});

export default router;