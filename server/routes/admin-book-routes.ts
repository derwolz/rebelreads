import { Router, Request, Response } from "express";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { dbStorage } from "../storage";
import { db } from "../db";
import { books, bookImages, authors, BookImage } from "@shared/schema";
import { eq, and, ilike, sql, desc, asc, or, inArray } from "drizzle-orm";

const router = Router();

// Search for books with pagination
router.get("/search", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { query, page = 1, limit = 10, sortBy = "title", sortDir = "asc" } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    // Build the search condition
    let searchCondition = sql`1=1`; // Default condition (matches everything)
    
    if (query && typeof query === 'string') {
      const condition = or(
        ilike(books.title, `%${query}%`),
        sql`EXISTS (
          SELECT 1 FROM ${authors} 
          WHERE ${authors.id} = ${books.authorId} 
          AND ${authors.author_name} ILIKE ${`%${query}%`}
        )`
      );
      
      // Make sure condition is not undefined
      searchCondition = condition || sql`1=1`;
    }
    
    // Build the sort condition
    let orderBy: any;
    switch (sortBy) {
      case "title":
        orderBy = sortDir === "asc" ? asc(books.title) : desc(books.title);
        break;
      case "publishedDate":
        orderBy = sortDir === "asc" ? asc(books.publishedDate) : desc(books.publishedDate);
        break;
      case "impressions":
        orderBy = sortDir === "asc" ? asc(books.impressionCount) : desc(books.impressionCount);
        break;
      default:
        orderBy = asc(books.title);
    }
    
    // Count total matching books for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(searchCondition);
    
    // Get books with author information
    const rawBookResults = await db
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
      .where(searchCondition)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);
    
    // Convert to Book type with images property
    const bookResults = rawBookResults.map(book => ({
      ...book,
      images: [] as BookImage[]
    }));
    
    // Get book images for the results
    if (bookResults.length > 0) {
      const bookIds = bookResults.map(book => book.id);
      
      const images = await db
        .select()
        .from(bookImages)
        .where(and(
          eq(bookImages.imageType, "book-card"),
          inArray(bookImages.bookId, bookIds)
        ));
      
      // Add images to book results
      bookResults.forEach(book => {
        book.images = images.filter(img => img.bookId === book.id);
      });
    }
    
    res.json({
      books: bookResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    console.error("Admin book search error:", error);
    res.status(500).json({ error: "Failed to search books" });
  }
});

// Delete a book by ID (admin version - no author check)
router.delete("/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }
    
    // Check if book exists
    const book = await dbStorage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Get the author information for logging
    const author = await db
      .select()
      .from(authors)
      .where(eq(authors.id, book.authorId))
      .then(results => results[0]);
    
    // First, delete all book images to avoid foreign key constraint violations
    await db
      .delete(bookImages)
      .where(eq(bookImages.bookId, bookId));
    
    // Delete book taxonomies, reading statuses, ratings, etc.
    // Note: These are handled within the storage implementation
    await dbStorage.deleteBook(bookId, book.authorId);
    
    console.log(`Admin deleted book ID ${bookId} titled "${book.title}" by author ${author?.author_name || 'unknown'}`);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error admin-deleting book:", error);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

export default router;