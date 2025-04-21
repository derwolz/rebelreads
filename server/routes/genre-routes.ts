import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { db } from "../db";
import { 
  genreTaxonomies, 
  insertGenreTaxonomySchema, 
  viewGenres, 
  bookGenreTaxonomies, 
  books,
  bookImages,
  authors,
  userBlocks,
  publishersAuthors,
  userGenreViews
} from "@shared/schema";
import { eq, and, isNull, sql, inArray, notInArray } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Get all genres, subgenres, tropes, and themes
router.get("/", async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
    
    let conditions = [isNull(genreTaxonomies.deletedAt)];
    
    if (type) {
      conditions.push(eq(genreTaxonomies.type, type));
    }
    
    if (parentId) {
      conditions.push(eq(genreTaxonomies.parentId, parentId));
    } else if (type === 'subgenre') {
      // For subgenres, only return ones with a parentId
      conditions.push(sql`${genreTaxonomies.parentId} IS NOT NULL`);
    }
    
    const result = await db.select()
      .from(genreTaxonomies)
      .where(and(...conditions));
      
    res.json(result);
  } catch (error) {
    console.error("Error fetching genres:", error);
    res.status(500).json({ error: "Failed to fetch genres" });
  }
});

// Get a specific genre by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await db.select()
      .from(genreTaxonomies)
      .where(and(
        eq(genreTaxonomies.id, id),
        isNull(genreTaxonomies.deletedAt)
      ))
      .limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Genre not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching genre:", error);
    res.status(500).json({ error: "Failed to fetch genre" });
  }
});

// Create a new genre (admin only)
router.post("/", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedData = insertGenreTaxonomySchema.parse(req.body);
    
    const result = await db.insert(genreTaxonomies)
      .values(validatedData)
      .returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating genre:", error);
    res.status(500).json({ error: "Failed to create genre" });
  }
});

// Update a genre (admin only)
router.put("/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertGenreTaxonomySchema.parse(req.body);
    
    const result = await db.update(genreTaxonomies)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(genreTaxonomies.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Genre not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating genre:", error);
    res.status(500).json({ error: "Failed to update genre" });
  }
});

// Soft delete a genre (admin only)
router.delete("/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await db.update(genreTaxonomies)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(genreTaxonomies.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Genre not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting genre:", error);
    res.status(500).json({ error: "Failed to delete genre" });
  }
});

// Import genres from bulk data (admin only)
router.post("/import", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid import data format" });
    }
    
    // Process each genre item
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const validatedData = insertGenreTaxonomySchema.parse(item);
          const result = await db.insert(genreTaxonomies)
            .values(validatedData)
            .returning();
          return result[0];
        } catch (error) {
          console.error(`Error importing item ${JSON.stringify(item)}:`, error);
          return { error: error instanceof Error ? error.message : "Unknown error", item };
        }
      })
    );
    
    res.status(201).json({
      success: true,
      imported: results.filter(r => !('error' in r)).length,
      total: items.length,
      results
    });
  } catch (error) {
    console.error("Error importing genres:", error);
    res.status(500).json({ error: "Failed to import genres" });
  }
});

/**
 * Get books for a specific genre view
 * This route is used by the dynamic home sections to display books by genre view
 * Includes comprehensive content filtering based on user blocks
 */
router.get("/view/:id", async (req: Request, res: Response) => {
  try {
    const viewId = parseInt(req.params.id);
    const count = parseInt(req.query.count as string) || 10;
    const userId = req.user?.id;
    
    if (isNaN(viewId)) {
      return res.status(400).json({ error: "Invalid view ID" });
    }
    
    
    
    // 1. Get all genre taxonomy IDs from this view
    const viewGenresResult = await db
      .select({ taxonomyId: viewGenres.taxonomyId })
      .from(viewGenres)
      .where(eq(viewGenres.viewId, viewId));
    
    if (!viewGenresResult || viewGenresResult.length === 0) {
      
      return res.json([]);
    }
    
    const taxonomyIds = viewGenresResult.map(g => g.taxonomyId);
    
    
    // 2. Get all books that have these taxonomies
    const bookGenresResult = await db
      .select({ bookId: bookGenreTaxonomies.bookId })
      .from(bookGenreTaxonomies)
      .where(inArray(bookGenreTaxonomies.taxonomyId, taxonomyIds));
    
    if (!bookGenresResult || bookGenresResult.length === 0) {
      
      return res.json([]);
    }
    
    // Use a simple array with filter to get unique book IDs
    let bookIds = bookGenresResult.map(bg => bg.bookId)
      .filter((id, index, self) => self.indexOf(id) === index);
    
    
    // If user is authenticated, apply filtering based on blocked content
    if (userId) {
      // Get user's blocks
      const userBlocksResult = await db
        .select()
        .from(userBlocks)
        .where(eq(userBlocks.userId, userId));
      
      if (userBlocksResult && userBlocksResult.length > 0) {
        // Group blocks by type for easier filtering
        const blockedAuthors = userBlocksResult
          .filter(block => block.blockType === 'author')
          .map(block => block.blockId);
        
        const blockedBooks = userBlocksResult
          .filter(block => block.blockType === 'book')
          .map(block => block.blockId);
        
        const blockedPublishers = userBlocksResult
          .filter(block => block.blockType === 'publisher')
          .map(block => block.blockId);
        
        const blockedTaxonomies = userBlocksResult
          .filter(block => block.blockType === 'taxonomy')
          .map(block => block.blockId);

        
        // Filter out books that match blocked taxonomies
        if (blockedTaxonomies.length > 0) {
          // Find all books that have blocked taxonomies
          const booksWithBlockedTaxonomiesResult = await db
            .select({ bookId: bookGenreTaxonomies.bookId })
            .from(bookGenreTaxonomies)
            .where(and(
              inArray(bookGenreTaxonomies.taxonomyId, blockedTaxonomies),
              inArray(bookGenreTaxonomies.bookId, bookIds)
            ));
          
          const booksWithBlockedTaxonomies = booksWithBlockedTaxonomiesResult.map(b => b.bookId);
          
          if (booksWithBlockedTaxonomies.length > 0) {
            
            // Remove books with blocked taxonomies from our list
            bookIds = bookIds.filter(id => !booksWithBlockedTaxonomies.includes(id));
          }
        }
        
        // Apply direct book filtering
        if (blockedBooks.length > 0) {
          const initialBookCount = bookIds.length;
          bookIds = bookIds.filter(id => !blockedBooks.includes(id));
          
        }
        
        // Apply author filtering
        if (blockedAuthors.length > 0) {
          // Find all books by blocked authors
          const booksFromBlockedAuthorsResult = await db
            .select({ id: books.id })
            .from(books)
            .where(and(
              inArray(books.id, bookIds),
              inArray(books.authorId, blockedAuthors)
            ));
          
          const booksFromBlockedAuthors = booksFromBlockedAuthorsResult.map(b => b.id);
          
          if (booksFromBlockedAuthors.length > 0) {
            
            // Remove books by blocked authors from our list
            bookIds = bookIds.filter(id => !booksFromBlockedAuthors.includes(id));
          }
        }
        
        // Apply publisher filtering
        if (blockedPublishers.length > 0) {
          // Direct query to find all books that have authors associated with blocked publishers
          const booksFromBlockedPublishersResult = await db
            .select({ bookId: books.id })
            .from(books)
            .innerJoin(publishersAuthors, eq(books.authorId, publishersAuthors.authorId))
            .where(and(
              inArray(books.id, bookIds),
              inArray(publishersAuthors.publisherId, blockedPublishers)
            ));
          
          const booksFromBlockedPublishers = booksFromBlockedPublishersResult.map(b => b.bookId);
          
          if (booksFromBlockedPublishers.length > 0) {
            
            // Remove these books from our list
            bookIds = bookIds.filter(id => !booksFromBlockedPublishers.includes(id));
          }
        }
        
        // Check if we have enough books after filtering
        if (bookIds.length < count) {
          
          
          // Find additional books that match the view's genres but aren't in our blocked categories
          // Start by getting all books with the view's taxonomies that aren't already included
          const additionalBooksResult = await db
            .select({ 
              bookId: bookGenreTaxonomies.bookId,
              taxonomyId: bookGenreTaxonomies.taxonomyId 
            })
            .from(bookGenreTaxonomies)
            .where(and(
              inArray(bookGenreTaxonomies.taxonomyId, taxonomyIds),
              notInArray(bookGenreTaxonomies.bookId, bookIds) // Books not already included
            ));
          
          // Get unique book IDs from results
          const additionalBookIdsArray = additionalBooksResult.map(b => b.bookId);
          const potentialAdditionalBookIds = additionalBookIdsArray.filter((id, index) => 
            additionalBookIdsArray.indexOf(id) === index);
          
          if (potentialAdditionalBookIds.length > 0) {
            
            
            // Filter out books with blocked taxonomies
            let filteredAdditionalBookIds = potentialAdditionalBookIds;
            
            if (blockedTaxonomies.length > 0) {
              // Find all additional books that have blocked taxonomies
              const additionalBooksWithBlockedTaxonomiesResult = await db
                .select({ bookId: bookGenreTaxonomies.bookId })
                .from(bookGenreTaxonomies)
                .where(and(
                  inArray(bookGenreTaxonomies.taxonomyId, blockedTaxonomies),
                  inArray(bookGenreTaxonomies.bookId, potentialAdditionalBookIds)
                ));
              
              const additionalBooksWithBlockedTaxonomies = additionalBooksWithBlockedTaxonomiesResult.map(b => b.bookId);
              
              if (additionalBooksWithBlockedTaxonomies.length > 0) {
                filteredAdditionalBookIds = potentialAdditionalBookIds.filter(
                  id => !additionalBooksWithBlockedTaxonomies.includes(id)
                );
              }
            }
            
            // Apply direct book blocking
            if (blockedBooks.length > 0) {
              filteredAdditionalBookIds = filteredAdditionalBookIds.filter(
                id => !blockedBooks.includes(id)
              );
            }
            
            // Get book information for the additional books to check author and publisher
            const additionalBooksInfoResult = await db
              .select({
                id: books.id,
                authorId: books.authorId
              })
              .from(books)
              .where(inArray(books.id, filteredAdditionalBookIds));
            
            // Filter out books by blocked authors
            if (blockedAuthors.length > 0) {
              const goodAdditionalBooks = additionalBooksInfoResult.filter(
                book => !blockedAuthors.includes(book.authorId)
              );
              
              filteredAdditionalBookIds = goodAdditionalBooks.map(b => b.id);
            }
            
            // Filter out books by authors from blocked publishers
            if (blockedPublishers.length > 0) {
              // First, find all authors associated with blocked publishers
              const authorsFromBlockedPublishersResult = await db
                .select({ authorId: publishersAuthors.authorId })
                .from(publishersAuthors)
                .where(inArray(publishersAuthors.publisherId, blockedPublishers));
              
              const authorsFromBlockedPublishers = authorsFromBlockedPublishersResult.map(a => a.authorId);
              
              if (authorsFromBlockedPublishers.length > 0) {
                const goodAdditionalBooks = additionalBooksInfoResult.filter(
                  book => !authorsFromBlockedPublishers.includes(book.authorId)
                );
                
                filteredAdditionalBookIds = goodAdditionalBooks.map(b => b.id);
              }
            }
            
            // Add the additional filtered book IDs to our list
            const neededBooks = count - bookIds.length;
            const additionalBookIdsToAdd = filteredAdditionalBookIds.slice(0, neededBooks);
            
            if (additionalBookIdsToAdd.length > 0) {
              
              bookIds = [...bookIds, ...additionalBookIdsToAdd];
            }
          }
        }
      }
    }

    // If we still don't have enough books, log a warning
    if (bookIds.length < count) {
      
    }
    
    // 3. Get the complete book data with author information
    let booksResult = await db
      .select({
        id: books.id,
        title: books.title,
        authorId: books.authorId,
        description: books.description,
        promoted: books.promoted,
        pageCount: books.pageCount,
        formats: books.formats,
        publishedDate: books.publishedDate,
        awards: books.awards,
        originalTitle: books.originalTitle,
        series: books.series,
        setting: books.setting,
        characters: books.characters,
        isbn: books.isbn,
        asin: books.asin,
        language: books.language,
        referralLinks: books.referralLinks,
        impressionCount: books.impressionCount,
        clickThroughCount: books.clickThroughCount,
        lastImpressionAt: books.lastImpressionAt,
        lastClickThroughAt: books.lastClickThroughAt,
        internal_details: books.internal_details,
        // Join author information
        authorName: authors.author_name,
        authorImageUrl: authors.author_image_url
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .where(inArray(books.id, bookIds))
      .limit(count); // We've already filtered, so just get what we need
    
    // 4. Get book images
    const imagesResult = await db
      .select()
      .from(bookImages)
      .where(inArray(bookImages.bookId, bookIds));
    
    // Group images by book ID
    const imagesByBookId = new Map();
    imagesResult.forEach(image => {
      if (!imagesByBookId.has(image.bookId)) {
        imagesByBookId.set(image.bookId, []);
      }
      imagesByBookId.get(image.bookId).push({
        imageUrl: image.imageUrl,
        imageType: image.imageType
      });
    });
    
    // Add images to books
    const booksWithImages = booksResult.map(book => ({
      ...book,
      images: imagesByBookId.get(book.id) || []
    }));
    
    // Log and return results
    
    res.json(booksWithImages);
  } catch (error) {
    console.error("Error fetching books for genre view:", error);
    res.status(500).json({ error: "Failed to fetch books for genre view" });
  }
});

/**
 * Get genre view information by ID
 * This endpoint returns the name and details of a specific genre view
 */
router.get("/view-info/:id", async (req: Request, res: Response) => {
  try {
    const viewId = parseInt(req.params.id);
    
    if (isNaN(viewId)) {
      return res.status(400).json({ error: "Invalid view ID" });
    }
    
    // Get the genre view information
    const viewResult = await db.select()
      .from(userGenreViews)
      .where(eq(userGenreViews.id, viewId))
      .limit(1);
    
    if (viewResult.length === 0) {
      return res.status(404).json({ error: "Genre view not found" });
    }
    
    res.json(viewResult[0]);
  } catch (error) {
    console.error("Error fetching genre view info:", error);
    res.status(500).json({ error: "Failed to fetch genre view information" });
  }
});

/**
 * Get taxonomies associated with a genre view
 * This endpoint returns all the taxonomies (genres, subgenres, themes, tropes) associated with a view
 */
router.get("/view-taxonomies/:id", async (req: Request, res: Response) => {
  try {
    const viewId = parseInt(req.params.id);
    
    if (isNaN(viewId)) {
      return res.status(400).json({ error: "Invalid view ID" });
    }
    
    // Get all taxonomies associated with this view
    const viewTaxonomiesResult = await db.select({
      id: viewGenres.id,
      viewId: viewGenres.viewId,
      taxonomyId: viewGenres.taxonomyId,
      type: viewGenres.type,
      rank: viewGenres.rank,
      name: genreTaxonomies.name,
      category: genreTaxonomies.type,
    })
    .from(viewGenres)
    .innerJoin(genreTaxonomies, eq(viewGenres.taxonomyId, genreTaxonomies.id))
    .where(eq(viewGenres.viewId, viewId))
    .orderBy(viewGenres.rank);
    
    res.json(viewTaxonomiesResult);
  } catch (error) {
    console.error("Error fetching view taxonomies:", error);
    res.status(500).json({ error: "Failed to fetch view taxonomies" });
  }
});

export default router;