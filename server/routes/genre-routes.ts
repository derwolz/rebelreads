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
import { eq, and, isNull, sql, inArray } from "drizzle-orm";
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
 */
router.get("/view/:id", async (req: Request, res: Response) => {
  try {
    const viewId = parseInt(req.params.id);
    const count = parseInt(req.query.count as string) || 10;
    
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
    
    // Get user ID from authenticated session if available
    const userId = req.user?.id;
    
    // If user is authenticated, filter out blocked content
    let filteredBookIds = [...bookIds];
    if (userId) {
      // Check for blocked content
      // 1. Get all blocked authors, books, publishers, taxonomies for this user
      const userBlocks = await db
        .select()
        .from(userBlocks)
        .where(eq(userBlocks.userId, userId));
        
      if (userBlocks.length > 0) {
        console.log(`Found ${userBlocks.length} user blocks, filtering content`);
        
        // Group blocks by type
        const blockedBooks = userBlocks
          .filter(block => block.blockType === 'book')
          .map(block => block.blockId);
          
        const blockedAuthors = userBlocks
          .filter(block => block.blockType === 'author')
          .map(block => block.blockId);
          
        const blockedPublishers = userBlocks
          .filter(block => block.blockType === 'publisher')
          .map(block => block.blockId);
          
        const blockedTaxonomies = userBlocks
          .filter(block => block.blockType === 'taxonomy')
          .map(block => block.blockId);
        
        // Get book author relations for filtering
        const bookAuthorRelations = await db
          .select({
            bookId: books.id,
            authorId: books.authorId,
            publisherId: books.publisherId
          })
          .from(books)
          .where(inArray(books.id, bookIds));
        
        // Get book taxonomy relations for filtering
        const bookTaxonomyRelations = await db
          .select({
            bookId: bookGenreTaxonomies.bookId,
            taxonomyId: bookGenreTaxonomies.taxonomyId
          })
          .from(bookGenreTaxonomies)
          .where(inArray(bookGenreTaxonomies.bookId, bookIds));
        
        // Filter out books that are directly blocked
        filteredBookIds = filteredBookIds.filter(bookId => !blockedBooks.includes(bookId));
        
        // Filter out books by blocked authors
        if (blockedAuthors.length > 0) {
          const booksWithBlockedAuthors = bookAuthorRelations
            .filter(relation => blockedAuthors.includes(relation.authorId))
            .map(relation => relation.bookId);
            
          filteredBookIds = filteredBookIds.filter(bookId => !booksWithBlockedAuthors.includes(bookId));
        }
        
        // Filter out books by blocked publishers
        if (blockedPublishers.length > 0 && bookAuthorRelations.some(r => r.publisherId !== null)) {
          const booksWithBlockedPublishers = bookAuthorRelations
            .filter(relation => relation.publisherId !== null && blockedPublishers.includes(relation.publisherId))
            .map(relation => relation.bookId);
            
          filteredBookIds = filteredBookIds.filter(bookId => !booksWithBlockedPublishers.includes(bookId));
        }
        
        // Filter out books with blocked taxonomies
        if (blockedTaxonomies.length > 0) {
          const booksWithBlockedTaxonomies = bookTaxonomyRelations
            .filter(relation => blockedTaxonomies.includes(relation.taxonomyId))
            .map(relation => relation.bookId);
            
          filteredBookIds = filteredBookIds.filter(bookId => !booksWithBlockedTaxonomies.includes(bookId));
        }
        
        console.log(`After filtering blocked content, ${filteredBookIds.length} books remain`);
      }
    }
    
    // 3. Get the complete book data with author information
    const booksResult = await db
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
      .where(inArray(books.id, filteredBookIds))
      .limit(count);
    
    // 4. Get book images
    const imagesResult = await db
      .select()
      .from(bookImages)
      .where(inArray(bookImages.bookId, filteredBookIds));
    
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