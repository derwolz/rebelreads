import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { db } from "../db";
import { ratings, books, followers } from "@shared/schema";
import { eq, and, inArray, desc, avg, count, sql } from "drizzle-orm";

// Configure multer for file uploads
const uploadsDir = "./uploads";
const coversDir = path.join(uploadsDir, "covers");

[uploadsDir, coversDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, coversDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: fileStorage });

const router = Router();

// Serve uploaded files
router.use("/uploads", express.static("uploads"));

router.get("/books", async (_req, res) => {
  const books = await dbStorage.getBooks();
  res.json(books);
});

router.get("/books/:id", async (req, res) => {
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const book = await dbStorage.getBook(bookId);
  if (!book) return res.sendStatus(404);
  res.json(book);
});

router.get("/books/:id/ratings", async (req, res) => {
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const ratings = await dbStorage.getRatings(bookId);
  res.json(ratings);
});

router.post("/books/:id/ratings", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  try {
    const rating = await dbStorage.createRating({
      bookId,
      userId: req.user!.id,
      enjoyment: req.body.enjoyment,
      writing: req.body.writing,
      themes: req.body.themes,
      characters: req.body.characters,
      worldbuilding: req.body.worldbuilding,
      review: req.body.review,
      analysis: req.body.analysis,
    });

    // Mark the book as completed
    await dbStorage.markAsCompleted(req.user!.id, bookId);

    res.json(rating);
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique violation
      try {
        const [updatedRating] = await db
          .update(ratings)
          .set({
            enjoyment: req.body.enjoyment,
            writing: req.body.writing,
            themes: req.body.themes,
            characters: req.body.characters,
            worldbuilding: req.body.worldbuilding,
            review: req.body.review,
            analysis: req.body.analysis,
          })
          .where(
            and(eq(ratings.userId, req.user!.id), eq(ratings.bookId, bookId)),
          )
          .returning();

        // Mark the book as completed
        await dbStorage.markAsCompleted(req.user!.id, bookId);

        return res.json(updatedRating);
      } catch (updateError) {
        return res.status(500).send("Failed to update rating");
      }
    }
    res.status(400).send(error.message);
  }
});

router.get("/my-books", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const books = await dbStorage.getBooksByAuthor(req.user!.id);
  res.json(books);
});

router.post("/books", upload.single("cover"), async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(401);
  }

  if (!req.file) {
    return res.status(400).json({ message: "Cover image is required" });
  }

  const coverUrl = `/uploads/covers/${req.file.filename}`;
  const genres = JSON.parse(req.body.genres);
  const formats = JSON.parse(req.body.formats);
  const characters = req.body.characters
    ? JSON.parse(req.body.characters)
    : [];
  const awards = req.body.awards ? JSON.parse(req.body.awards) : [];
  const publishedDate = req.body.publishedDate
    ? new Date(req.body.publishedDate)
    : null;

  const book = await dbStorage.createBook({
    title: req.body.title,
    description: req.body.description,
    authorId: req.user!.id,
    coverUrl,
    author: req.user!.authorName || req.user!.username,
    genres: genres,
    formats: formats,
    promoted: false,
    authorImageUrl: null,
    pageCount: req.body.pageCount ? parseInt(req.body.pageCount) : null,
    publishedDate,
    awards,
    originalTitle: req.body.originalTitle || null,
    series: req.body.series || null,
    setting: req.body.setting || null,
    characters,
    isbn: req.body.isbn || null,
    asin: req.body.asin || null,
    language: req.body.language || "English",
  });

  res.json(book);
});

router.patch("/books/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const book = await dbStorage.getBook(parseInt(req.params.id));
  if (!book || book.authorId !== req.user!.id) {
    return res.sendStatus(403);
  }

  const updatedBook = await dbStorage.updateBook(book.id, req.body);
  res.json(updatedBook);
});

router.get("/books/:id/reading-status", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const status = await dbStorage.getReadingStatus(req.user!.id, bookId);
  res.json(status || {});
});

router.post("/books/:id/wishlist", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const status = await dbStorage.toggleWishlist(req.user!.id, bookId);
  res.json(status);
});

router.delete("/books/:id/wishlist", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const status = await dbStorage.toggleWishlist(req.user!.id, bookId);
  res.json(status);
});

router.get("/books/followed-authors", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    // Get authors that the user follows
    const followedAuthors = await db
      .select({
        authorId: followers.followingId
      })
      .from(followers)
      .where(eq(followers.userId, req.user!.id));
    
    if (followedAuthors.length === 0) {
      return res.json([]);
    }
    
    // Get books by those authors
    const authorIds = followedAuthors.map(f => f.authorId);
    const authorBooks = await db
      .select()
      .from(books)
      .where(inArray(books.authorId, authorIds));
    
    res.json(authorBooks);
  } catch (error) {
    console.error("Error fetching followed authors books:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch books from followed authors" });
  }
});

router.post("/authors/:id/follow", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const authorId = parseInt(req.params.id);
  const author = await dbStorage.getUser(authorId);
  if (!author?.isAuthor) return res.sendStatus(404);

  await dbStorage.followAuthor(req.user!.id, authorId);
  res.sendStatus(200);
});

router.post("/authors/:id/unfollow", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const authorId = parseInt(req.params.id);
  const author = await dbStorage.getUser(authorId);
  if (!author?.isAuthor) return res.sendStatus(404);

  await dbStorage.unfollowAuthor(req.user!.id, authorId);
  res.sendStatus(200);
});

// User dashboard endpoint
router.get("/dashboard", async (req: Request, res: Response) => {
  // Check if user is authenticated, return empty structure if not
  if (!req.isAuthenticated()) {
    console.log("Dashboard accessed without authentication");
    return res.json({
      user: {
        username: "Guest",
        bio: null,
        profileImageUrl: null,
        followingCount: 0,
        followerCount: 0,
        socialMediaLinks: []
      },
      readingStats: {
        wishlisted: 0,
        completed: 0
      },
      averageRatings: null,
      recentReviews: [],
      recommendations: []
    });
  }

  try {
    const userId = req.user!.id;
    
    // Get user data
    const user = await dbStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get user reading statistics
    const wishlistedBooks = await dbStorage.getWishlistedBooks(userId);
    const wishlisted = wishlistedBooks.length;
    
    const completedBooks = await dbStorage.getCompletedBooks(userId);
    const completed = completedBooks.length;
    
    // Get user's ratings for averages
    const userRatings = await dbStorage.getUserRatings(userId);
    
    let averageRatings = null;
    if (userRatings.length > 0) {
      const enjoymentSum = userRatings.reduce((sum, r) => sum + r.enjoyment, 0);
      const writingSum = userRatings.reduce((sum, r) => sum + r.writing, 0);
      const themesSum = userRatings.reduce((sum, r) => sum + r.themes, 0);
      const charactersSum = userRatings.reduce((sum, r) => sum + r.characters, 0);
      const worldbuildingSum = userRatings.reduce((sum, r) => sum + r.worldbuilding, 0);
      
      const count = userRatings.length;
      
      // Calculate weighted overall rating based on default weights
      const overallSum = userRatings.reduce((sum, r) => {
        const weightedRating = 
          (r.enjoyment * 0.3) + 
          (r.writing * 0.3) + 
          (r.themes * 0.2) + 
          (r.characters * 0.1) + 
          (r.worldbuilding * 0.1);
        return sum + weightedRating;
      }, 0);
      
      averageRatings = {
        overall: overallSum / count,
        enjoyment: enjoymentSum / count,
        writing: writingSum / count,
        themes: themesSum / count,
        characters: charactersSum / count,
        worldbuilding: worldbuildingSum / count
      };
    }
    
    // Get recent reviews with book information
    const recentReviews = await db
      .select({
        id: ratings.id,
        review: ratings.review,
        enjoyment: ratings.enjoyment,
        writing: ratings.writing,
        themes: ratings.themes,
        characters: ratings.characters,
        worldbuilding: ratings.worldbuilding,
        createdAt: ratings.createdAt,
        bookId: books.id,
        bookTitle: books.title,
        bookCoverUrl: books.coverUrl,
        bookAuthor: books.author
      })
      .from(ratings)
      .innerJoin(books, eq(ratings.bookId, books.id))
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt))
      .limit(5);
    
    // Get recommendations - for now simple recommendations based on user's most read genres
    const userGenres = new Set<string>();
    [...wishlistedBooks, ...completedBooks].forEach(book => {
      book.genres.forEach(genre => userGenres.add(genre));
    });
    
    // Get books in user's preferred genres that they haven't rated yet
    let recommendations = [];
    
    if (userGenres.size > 0) {
      // Using a simpler approach to avoid SQL array operators
      try {
        // Get all books
        const allBooks = await db.select().from(books).limit(50);
        
        // Get user's rated books
        const userRatedBookIds = userRatings.map(rating => rating.bookId);
        
        // Filter recommendations client-side
        recommendations = allBooks.filter(book => {
          // Don't recommend books the user has already rated
          if (userRatedBookIds.includes(book.id)) {
            return false;
          }
          
          // Check if the book has any genres that match user interests
          return book.genres.some(genre => userGenres.has(genre));
        }).slice(0, 6);
      } catch (error) {
        console.error("Error getting recommendations:", error);
        recommendations = [];
      }
    }
    
    // Get user's following/follower counts
    const followingCount = await dbStorage.getFollowingCount(userId);
    const followerCount = await dbStorage.getFollowerCount(userId);
    
    // Format the response
    const dashboard = {
      user: {
        username: user.username,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        followingCount,
        followerCount,
        socialMediaLinks: user.socialMediaLinks || []
      },
      readingStats: {
        wishlisted,
        completed
      },
      averageRatings,
      recentReviews,
      recommendations
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    res.status(500).json({ error: "Failed to retrieve dashboard data", details: error });
  }
});

export default router;
