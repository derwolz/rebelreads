import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { db } from "./db";
import { ratings, calculateWeightedRating } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { users, books, bookshelves } from "@shared/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";

// Ensure uploads directory exists
const uploadsDir = "./uploads/covers";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  app.get("/api/books", async (_req, res) => {
    const books = await storage.getBooks();
    res.json(books);
  });

  // In the book details route handler, add validation
  app.get("/api/books/:id", async (req, res) => {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const book = await storage.getBook(bookId);
    if (!book) return res.sendStatus(404);
    res.json(book);
  });

  // Fix the ratings route as well
  app.get("/api/books/:id/ratings", async (req, res) => {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const ratings = await storage.getRatings(bookId);
    res.json(ratings);
  });

  // Fix ratings creation route
  app.post("/api/books/:id/ratings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    try {
      const rating = await storage.createRating({
        bookId,
        userId: req.user!.id,
        enjoyment: req.body.enjoyment,
        writing: req.body.writing,
        themes: req.body.themes,
        characters: req.body.characters,
        worldbuilding: req.body.worldbuilding,
        review: req.body.review,
        analysis: req.body.analysis, // Add this line to include the analysis
      });

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
              analysis: req.body.analysis, // Add this line to include the analysis
            })
            .where(
              and(eq(ratings.userId, req.user!.id), eq(ratings.bookId, bookId)),
            )
            .returning();

          return res.json(updatedRating);
        } catch (updateError) {
          return res.status(500).send("Failed to update rating");
        }
      }
      res.status(400).send(error.message);
    }
  });

  app.get("/api/my-books", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const books = await storage.getBooksByAuthor(req.user!.id);
    res.json(books);
  });

  app.post("/api/books", upload.single("cover"), async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(401);
    }

    if (!req.file) {
      return res.status(400).json({ message: "Cover image is required" });
    }

    const coverUrl = `/uploads/covers/${req.file.filename}`;
    const genres = JSON.parse(req.body.genres); // Parse the stringified genres array
    const formats = JSON.parse(req.body.formats); // Parse the stringified formats array
    const characters = req.body.characters
      ? JSON.parse(req.body.characters)
      : [];
    const awards = req.body.awards ? JSON.parse(req.body.awards) : [];
    const publishedDate = req.body.publishedDate
      ? new Date(req.body.publishedDate)
      : null;

    const book = await storage.createBook({
      title: req.body.title,
      description: req.body.description,
      authorId: req.user!.id,
      coverUrl,
      author: req.user!.authorName || req.user!.username, // Use authorName if available, fallback to username
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

  app.post("/api/books/:id/promote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const book = await storage.getBook(parseInt(req.params.id));
    if (!book || book.authorId !== req.user!.id) {
      return res.sendStatus(403);
    }

    const updatedBook = await storage.promoteBook(book.id);
    res.json(updatedBook);
  });

  app.patch("/api/books/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const book = await storage.getBook(parseInt(req.params.id));
    if (!book || book.authorId !== req.user!.id) {
      return res.sendStatus(403);
    }

    const updatedBook = await storage.updateBook(book.id, req.body);
    res.json(updatedBook);
  });

  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    if (req.body.username) {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(400).send("Username already taken");
      }
    }

    if (req.body.email) {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(400).send("Email already in use");
      }
    }

    const updatedUser = await storage.updateUser(req.user!.id, req.body);
    res.json(updatedUser);
  });

  app.post("/api/user/toggle-author", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const updatedUser = await storage.toggleAuthorStatus(req.user!.id);
    res.json(updatedUser);
  });

  app.get("/api/bookshelf", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookshelf = await storage.getBookshelf(req.user!.id);
    res.json(bookshelf);
  });

  app.post("/api/bookshelf/:bookId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookshelf = await storage.updateBookshelfStatus(
      req.user!.id,
      parseInt(req.params.bookId),
      req.body.status,
    );

    res.json(bookshelf);
  });

  app.delete("/api/books/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const book = await storage.getBook(parseInt(req.params.id));
    if (!book || book.authorId !== req.user!.id) {
      return res.sendStatus(403);
    }

    await storage.deleteBook(book.id, req.user!.id);
    res.sendStatus(200);
  });

  app.get("/api/authors/:id", async (req, res) => {
    const author = await storage.getUser(parseInt(req.params.id));
    if (!author?.isAuthor) return res.sendStatus(404);

    const [books, followerCount, genres, ratings] = await Promise.all([
      storage.getBooksByAuthor(author.id),
      storage.getFollowerCount(author.id),
      storage.getAuthorGenres(author.id),
      storage.getAuthorAggregateRatings(author.id),
    ]);

    res.json({
      ...author,
      books,
      followerCount,
      genres,
      aggregateRatings: ratings,
    });
  });

  app.get("/api/authors/:id/following", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const isFollowing = await storage.isFollowing(
      req.user!.id,
      parseInt(req.params.id),
    );
    res.json({ isFollowing });
  });

  app.post("/api/authors/:id/follow", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const authorId = parseInt(req.params.id);
    const author = await storage.getUser(authorId);
    if (!author?.isAuthor) return res.sendStatus(404);

    await storage.followAuthor(req.user!.id, authorId);
    res.sendStatus(200);
  });

  app.post("/api/authors/:id/unfollow", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const authorId = parseInt(req.params.id);
    const author = await storage.getUser(authorId);
    if (!author?.isAuthor) return res.sendStatus(404);

    await storage.unfollowAuthor(req.user!.id, authorId);
    res.sendStatus(200);
  });

  app.get("/api/books/followed-authors", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const books = await storage.getFollowedAuthorsBooks(req.user!.id);
      res.json(books);
    } catch (error) {
      console.error("Error fetching followed authors books:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch books from followed authors" });
    }
  });

  app.get("/api/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = req.user!.id;

      // Fetch all required data in parallel
      const [
        bookshelf,
        ratings,
        followingCount,
        followerCount,
        user
      ] = await Promise.all([
        storage.getBookshelf(userId),
        storage.getUserRatings(userId),
        storage.getFollowingCount(userId),
        storage.getFollowerCount(userId),
        storage.getUser(userId)
      ]);

      // Calculate reading stats
      const readingStats = {
        reading: bookshelf.filter(b => b.status === 'reading').length,
        completed: bookshelf.filter(b => b.status === 'read').length,
        wantToRead: bookshelf.filter(b => b.status === 'want-to-read').length
      };

      // Calculate average ratings using the proper weighted calculation
      const averageRatings = ratings.length > 0 ? {
        overall: ratings.reduce((acc, r) => acc + calculateWeightedRating(r), 0) / ratings.length,
        enjoyment: ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length,
        writing: ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
        themes: ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
        characters: ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length,
        worldbuilding: ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length,
      } : null;

      res.json({
        user: {
          ...user,
          followingCount,
          followerCount
        },
        readingStats,
        averageRatings,
        recentReviews: ratings.slice(0, 5),
        recommendations: await storage.getBooks() // This will be replaced with actual recommendations later
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}

function calculateWeightedRating(rating) {
  // Implement weighted rating logic here if needed.  For now, a simple sum.
  return rating.enjoyment + rating.writing + rating.themes + rating.characters + rating.worldbuilding;
}