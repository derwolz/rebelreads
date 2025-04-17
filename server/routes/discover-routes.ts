import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { db } from "../db";
import { 
  genreTaxonomies, 
  bookGenreTaxonomies, 
  books,
  viewGenres,
  bookImages,
  authors,
  userBlocks
} from "@shared/schema";
import { eq, and, inArray, desc, sql, isNull } from "drizzle-orm";
import { z } from "zod";

const router = Router();

/**
 * GET /api/discover
 * Get books by taxonomy from various sources
 * This acts as the main handler for the discovery feature
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 150;
    
    // Get popular books as a fallback
    const popularBooks = await dbStorage.getPopularBooks(limit);
    
    res.json(popularBooks);
  } catch (error) {
    console.error("Error getting discovery books:", error);
    res.status(500).json({ error: "Failed to retrieve books" });
  }
});

/**
 * GET /api/discover/popular
 * Get popular books for discovery
 */
router.get("/popular", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 150;
    
    const popularBooks = await dbStorage.getPopularBooks(limit);
    
    res.json(popularBooks);
  } catch (error) {
    console.error("Error getting popular books:", error);
    res.status(500).json({ error: "Failed to retrieve popular books" });
  }
});

/**
 * GET /api/discover/genre/:id
 * Get books by genre view for discovery
 * This pulls all books that have taxonomies from the specified genre view
 */
router.get("/genre/:id", async (req: Request, res: Response) => {
  try {
    const viewId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 150;
    
    if (isNaN(viewId)) {
      return res.status(400).json({ error: "Invalid view ID" });
    }
    
    console.log(`Fetching books for discovery by genre view ID: ${viewId}`);

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
    // Join with book taxonomy relationships ordered by importance
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
        authorImageUrl: authors.author_image_url,
        importance: sql<string>`AVG(${bookGenreTaxonomies.importance})`
      })
      .from(books)
      .innerJoin(bookGenreTaxonomies, eq(books.id, bookGenreTaxonomies.bookId))
      .leftJoin(authors, eq(books.authorId, authors.id))
      .where(inArray(bookGenreTaxonomies.taxonomyId, taxonomyIds))
      .groupBy(
        books.id, 
        books.title, 
        books.authorId, 
        books.description,
        books.promoted,
        books.pageCount,
        books.formats,
        books.publishedDate,
        books.awards,
        books.originalTitle,
        books.series,
        books.setting,
        books.characters,
        books.isbn,
        books.asin,
        books.language,
        books.referralLinks,
        books.impressionCount,
        books.clickThroughCount,
        books.lastImpressionAt,
        books.lastClickThroughAt,
        books.internal_details,
        authors.author_name,
        authors.author_image_url
      )
      .orderBy(desc(sql<string>`AVG(${bookGenreTaxonomies.importance})`))
      .limit(limit);
    
    if (!booksResult || booksResult.length === 0) {
      console.log(`No books found for genre view ID: ${viewId}`);
      
      // Fallback to popular books if no matches found
      const popularBooks = await dbStorage.getPopularBooks(limit);
      return res.json(popularBooks);
    }

    // 3. Get all images for these books
    const bookIds = booksResult.map(book => book.id);
    
    const bookImagesResult = await db
      .select()
      .from(bookImages)
      .where(inArray(bookImages.bookId, bookIds));
    
    // Assign images to each book
    const booksWithImages = booksResult.map(book => {
      const images = bookImagesResult.filter(img => img.bookId === book.id);
      return {
        ...book,
        images,
        // Remove importance from the response
        importance: undefined
      };
    });
    
    console.log(`Returning ${booksWithImages.length} books for genre view discovery`);
    res.json(booksWithImages);
    
  } catch (error) {
    console.error("Error getting genre books for discovery:", error);
    res.status(500).json({ error: "Failed to retrieve books" });
  }
});

/**
 * GET /api/discover/recommendations
 * Get recommended books for the current user
 */
router.get("/recommendations", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 150;
    
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const recommendations = await dbStorage.getRecommendations(req.user.id, limit);
    
    res.json(recommendations);
  } catch (error) {
    console.error("Error getting recommended books for discovery:", error);
    res.status(500).json({ error: "Failed to retrieve recommendations" });
  }
});

export default router;