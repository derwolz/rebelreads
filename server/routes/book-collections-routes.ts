import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { log } from "../vite";
import { db } from "../db";
import { eq, and, inArray, not, isNull, sql, desc } from "drizzle-orm";
import { books, followers, ratings, reading_status, authors, bookImages } from "@shared/schema";
import { applyContentFilters } from "../utils/content-filters";

const router = Router();

/**
 * Get personalized book recommendations for the user
 */
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const userId = req.user!.id;
    const recommendations = await dbStorage.getRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

/**
 * Get random books from authors the user follows
 * Excludes books the user has already read
 */
router.get("/followed-authors", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

  try {
    const userId = req.user!.id;
    const count = parseInt(req.query.count as string) || 10;

    // Get authors that the user follows
    const followedAuthors = await db
      .select({
        authorId: followers.followingId
      })
      .from(followers)
      .where(
        and(
          eq(followers.followerId, userId),
          isNull(followers.deletedAt)
        )
      );
    
    if (followedAuthors.length === 0) {
      return res.json([]);
    }
    
    // Get book IDs the user has already read (marked as completed)
    const readBookIds = await db
      .select({ bookId: reading_status.bookId })
      .from(reading_status)
      .where(
        and(
          eq(reading_status.userId, userId),
          eq(reading_status.isCompleted, true)
        )
      );
    
    // Get books by those authors, excluding ones the user has already read
    const authorIds = followedAuthors.map(f => f.authorId);
    const readIds = readBookIds.map(rb => rb.bookId);
    
    // Set up the query conditions
    // Start with base condition for author IDs
    let conditions = [inArray(books.authorId, authorIds)];
    
    // Add the exclusion condition only if there are books to exclude
    if (readIds.length > 0) {
      conditions.push(not(inArray(books.id, readIds)));
    }
    
    // Combine all conditions with AND
    const whereClause = and(...conditions);
    
    // Execute query with all conditions
    const allBooks = await db
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
      .where(whereClause);
    
    // Get all book IDs to fetch images
    let bookIds = allBooks.map(book => book.id);
    
    if (bookIds.length === 0) return res.json([]);
    
    // Apply content filtering to book IDs
    
    bookIds = await applyContentFilters(userId, bookIds);
    
    
    if (bookIds.length === 0) return res.json([]);
    
    // Filter allBooks to only include books that passed content filtering
    const filteredBooks = allBooks.filter(book => bookIds.includes(book.id));
    
    // Fetch all images for these books
    const allImages = await db.select()
      .from(bookImages)
      .where(inArray(bookImages.bookId, bookIds));
    
    // Group images by book ID
    const imagesByBookId = new Map<number, { imageUrl: string, imageType: string }[]>();
    
    allImages.forEach(image => {
      if (!imagesByBookId.has(image.bookId)) {
        imagesByBookId.set(image.bookId, []);
      }
      imagesByBookId.get(image.bookId)!.push({
        imageUrl: image.imageUrl,
        imageType: image.imageType
      });
    });
    
    // Add images to books
    const booksWithImages = filteredBooks.map(book => ({
      ...book,
      images: imagesByBookId.get(book.id) || []
    }));
    
    // Shuffle array and take the requested count
    const shuffled = booksWithImages.sort(() => 0.5 - Math.random());
    const selectedBooks = shuffled.slice(0, Math.min(count, shuffled.length));
    
    res.json(selectedBooks);
  } catch (error) {
    console.error("Error fetching books from followed authors:", error);
    res.status(500).json({ error: "Failed to fetch books from followed authors" });
  }
});

/**
 * Get random books from a user's wishlist
 * that they haven't read
 */
router.get("/wishlist", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

  try {
    const userId = req.user!.id;
    const count = parseInt(req.query.count as string) || 10;

    // Get all wishlisted books that are not completed
    const wishlistedBooks = await db
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
      .innerJoin(
        reading_status,
        and(
          eq(reading_status.bookId, books.id),
          eq(reading_status.userId, userId),
          eq(reading_status.isWishlisted, true),
          eq(reading_status.isCompleted, false)
        )
      );
    
    if (wishlistedBooks.length === 0) {
      return res.json([]);
    }
    
    // Get all book IDs to fetch images
    let bookIds = wishlistedBooks.map(book => book.id);
    
    if (bookIds.length === 0) return res.json([]);
    
    // Apply content filtering to book IDs
    
    bookIds = await applyContentFilters(userId, bookIds);
    
    
    if (bookIds.length === 0) return res.json([]);
    
    // Filter wishlistedBooks to only include books that passed content filtering
    const filteredBooks = wishlistedBooks.filter(book => bookIds.includes(book.id));
    
    // Fetch all images for these books
    const allImages = await db.select()
      .from(bookImages)
      .where(inArray(bookImages.bookId, bookIds));
    
    // Group images by book ID
    const imagesByBookId = new Map<number, { imageUrl: string, imageType: string }[]>();
    
    allImages.forEach(image => {
      if (!imagesByBookId.has(image.bookId)) {
        imagesByBookId.set(image.bookId, []);
      }
      imagesByBookId.get(image.bookId)!.push({
        imageUrl: image.imageUrl,
        imageType: image.imageType
      });
    });
    
    // Add images to books
    const booksWithImages = filteredBooks.map(book => ({
      ...book,
      images: imagesByBookId.get(book.id) || []
    }));
    
    // Shuffle array and take the requested count
    const shuffled = booksWithImages.sort(() => 0.5 - Math.random());
    const selectedBooks = shuffled.slice(0, Math.min(count, shuffled.length));
    
    res.json(selectedBooks);
  } catch (error) {
    console.error("Error fetching wishlisted books:", error);
    res.status(500).json({ error: "Failed to fetch wishlisted books" });
  }
});

/**
 * Get random books that the user has reviewed
 */
router.get("/reviewed", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

  try {
    const userId = req.user!.id;
    const count = parseInt(req.query.count as string) || 10;

    // Get books the user has rated
    const ratedBooks = await db
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
        // Rating info
        ratingId: ratings.id,
        ratingCreatedAt: ratings.createdAt
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .innerJoin(
        ratings,
        and(
          eq(ratings.bookId, books.id),
          eq(ratings.userId, userId)
        )
      )
      .orderBy(desc(ratings.createdAt));
    
    if (ratedBooks.length === 0) {
      return res.json([]);
    }
    
    // Get all book IDs to fetch images
    let bookIds = ratedBooks.map(book => book.id);
    
    if (bookIds.length === 0) return res.json([]);
    
    // Apply content filtering to book IDs
    
    bookIds = await applyContentFilters(userId, bookIds);
    
    
    if (bookIds.length === 0) return res.json([]);
    
    // Filter ratedBooks to only include books that passed content filtering
    const filteredBooks = ratedBooks.filter(book => bookIds.includes(book.id));
    
    // Fetch all images for these books
    const allImages = await db.select()
      .from(bookImages)
      .where(inArray(bookImages.bookId, bookIds));
    
    // Group images by book ID
    const imagesByBookId = new Map<number, { imageUrl: string, imageType: string }[]>();
    
    allImages.forEach(image => {
      if (!imagesByBookId.has(image.bookId)) {
        imagesByBookId.set(image.bookId, []);
      }
      imagesByBookId.get(image.bookId)!.push({
        imageUrl: image.imageUrl,
        imageType: image.imageType
      });
    });
    
    // Add images to books
    const booksWithImages = filteredBooks.map(book => ({
      ...book,
      images: imagesByBookId.get(book.id) || []
    }));
    
    // Shuffle array and take the requested count
    const shuffled = booksWithImages.sort(() => 0.5 - Math.random());
    const selectedBooks = shuffled.slice(0, Math.min(count, shuffled.length));
    
    res.json(selectedBooks);
  } catch (error) {
    console.error("Error fetching reviewed books:", error);
    res.status(500).json({ error: "Failed to fetch reviewed books" });
  }
});

/**
 * Get random books that the user has marked as completed
 */
router.get("/completed", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

  try {
    const userId = req.user!.id;
    const count = parseInt(req.query.count as string) || 10;

    // Get books the user has marked as completed
    const completedBooks = await db
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
        // Completed info
        completedAt: reading_status.completedAt
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .innerJoin(
        reading_status,
        and(
          eq(reading_status.bookId, books.id),
          eq(reading_status.userId, userId),
          eq(reading_status.isCompleted, true)
        )
      )
      .orderBy(desc(reading_status.completedAt));
    
    if (completedBooks.length === 0) {
      return res.json([]);
    }
    
    // Get all book IDs to fetch images
    let bookIds = completedBooks.map(book => book.id);
    
    if (bookIds.length === 0) return res.json([]);
    
    // Apply content filtering to book IDs
    
    bookIds = await applyContentFilters(userId, bookIds);
    
    
    if (bookIds.length === 0) return res.json([]);
    
    // Filter completedBooks to only include books that passed content filtering
    const filteredBooks = completedBooks.filter(book => bookIds.includes(book.id));
    
    // Fetch all images for these books
    const allImages = await db.select()
      .from(bookImages)
      .where(inArray(bookImages.bookId, bookIds));
    
    // Group images by book ID
    const imagesByBookId = new Map<number, { imageUrl: string, imageType: string }[]>();
    
    allImages.forEach(image => {
      if (!imagesByBookId.has(image.bookId)) {
        imagesByBookId.set(image.bookId, []);
      }
      imagesByBookId.get(image.bookId)!.push({
        imageUrl: image.imageUrl,
        imageType: image.imageType
      });
    });
    
    // Add images to books
    const booksWithImages = filteredBooks.map(book => ({
      ...book,
      images: imagesByBookId.get(book.id) || []
    }));
    
    // Shuffle array and take the requested count
    const shuffled = booksWithImages.sort(() => 0.5 - Math.random());
    const selectedBooks = shuffled.slice(0, Math.min(count, shuffled.length));
    
    res.json(selectedBooks);
  } catch (error) {
    console.error("Error fetching completed books:", error);
    res.status(500).json({ error: "Failed to fetch completed books" });
  }
});

export default router;