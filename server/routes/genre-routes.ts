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
  userBlocks
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
 * Includes content filtering based on user blocks
 */
router.get("/view/:id", async (req: Request, res: Response) => {
  try {
    const viewId = parseInt(req.params.id);
    const count = parseInt(req.query.count as string) || 10;
    const userId = req.user?.id;
    
    if (isNaN(viewId)) {
      return res.status(400).json({ error: "Invalid view ID" });
    }
    
    console.log(`Fetching books for genre view ID: ${viewId}`);
    
    // 1. Get all genre taxonomy IDs from this view
    const viewGenresResult = await db
      .select({ taxonomyId: viewGenres.taxonomyId })
      .from(viewGenres)
      .where(eq(viewGenres.viewId, viewId));
    
    if (!viewGenresResult || viewGenresResult.length === 0) {
      console.log(`No genres found for view ID: ${viewId}`);
      return res.json([]);
    }
    
    const taxonomyIds = viewGenresResult.map(g => g.taxonomyId);
    console.log(`Found taxonomy IDs for view: ${taxonomyIds.join(', ')}`);
    
    // 2. Get all books that have these taxonomies
    const bookGenresResult = await db
      .select({ bookId: bookGenreTaxonomies.bookId })
      .from(bookGenreTaxonomies)
      .where(inArray(bookGenreTaxonomies.taxonomyId, taxonomyIds));
    
    if (!bookGenresResult || bookGenresResult.length === 0) {
      console.log(`No books found for view taxonomies`);
      return res.json([]);
    }
    
    // Use a simple array with filter to get unique book IDs
    const bookIds = bookGenresResult.map(bg => bg.bookId)
      .filter((id, index, self) => self.indexOf(id) === index);
    console.log(`Found book IDs: ${bookIds.join(', ')}`);
    
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
      .limit(count * 2); // Fetch more books to account for filtering
    
    // 4. Apply content filtering if user is authenticated
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
        
        // Note: need to log these before filtering
        if (blockedAuthors.length > 0) {
          console.log(`User has ${blockedAuthors.length} blocked authors`);
        }
        
        if (blockedBooks.length > 0) {
          console.log(`User has ${blockedBooks.length} blocked books`);
        }
        
        if (blockedPublishers.length > 0) {
          console.log(`User has ${blockedPublishers.length} blocked publishers but publisher filtering is not implemented yet`);
        }
        
        if (blockedTaxonomies.length > 0) {
          console.log(`User has ${blockedTaxonomies.length} blocked taxonomies`);
        }
        
        // Filter out blocked content
        const initialCount = booksResult.length;
        booksResult = booksResult.filter(book => {
          // Check if book is directly blocked
          if (blockedBooks.includes(book.id)) {
            return false;
          }
          
          // Check if author is blocked
          if (book.authorId && blockedAuthors.includes(book.authorId)) {
            return false;
          }
          
          // Note: Publisher filtering will be implemented when publisherId is added to books table
          // For now we only filter books and authors
          
          // We can't easily filter by taxonomy here because we'd need to join 
          // with bookGenreTaxonomies, so for now we'll handle basic filters
          return true;
        });
        
        console.log(`After filtering blocked content, ${booksResult.length} books remain`);
        
        // If we've filtered too many books, try to get more
        if (booksResult.length < count && booksResult.length < initialCount) {
          const remainingRequired = count - booksResult.length;
          const filteredIds = booksResult.map(book => book.id);
          const allBlockedIds = [...filteredIds, ...blockedBooks];
          const blockedOrIncludedAuthors = [...blockedAuthors];
          booksResult.forEach(book => {
            if (book.authorId && !blockedOrIncludedAuthors.includes(book.authorId)) {
              blockedOrIncludedAuthors.push(book.authorId);
            }
          });
          
          // Query for additional books that aren't blocked
          const additionalBooks = await db
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
            .where(and(
              inArray(books.id, bookIds),
              notInArray(books.id, allBlockedIds),
              notInArray(books.authorId, blockedOrIncludedAuthors)
            ))
            .limit(remainingRequired);
          
          // Add the additional books
          booksResult = [...booksResult, ...additionalBooks];
          console.log(`Added ${additionalBooks.length} additional non-blocked books`);
        }
      }
    }
    
    // Limit results to requested count
    booksResult = booksResult.slice(0, count);
    
    // 5. Get book images
    const finalBookIds = booksResult.map(book => book.id);
    const imagesResult = await db
      .select()
      .from(bookImages)
      .where(inArray(bookImages.bookId, finalBookIds));
    
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
    console.log(`Returning ${booksWithImages.length} books for genre view ID: ${viewId}`);
    res.json(booksWithImages);
  } catch (error) {
    console.error("Error fetching books for genre view:", error);
    res.status(500).json({ error: "Failed to fetch books for genre view" });
  }
});

export default router;