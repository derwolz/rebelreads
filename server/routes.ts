import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { dbStorage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { db } from "./db";
import { ratings, calculateWeightedRating } from "@shared/schema";
import { users, books, bookshelves } from "@shared/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { promisify } from "util";
import { scrypt } from "crypto";
import { randomBytes } from "crypto";
import { timingSafeEqual } from "crypto";

// Ensure uploads directories exist
const uploadsDir = "./uploads";
const coversDir = path.join(uploadsDir, "covers");
const profilesDir = path.join(uploadsDir, "profiles");

[uploadsDir, coversDir, profilesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const fileStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Choose directory based on upload type
    const uploadDir = file.fieldname === 'profileImage' ? profilesDir : coversDir;
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: fileStorage });

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  app.get("/api/books", async (_req, res) => {
    const books = await dbStorage.getBooks();
    res.json(books);
  });

  // In the book details route handler, add validation
  app.get("/api/books/:id", async (req, res) => {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const book = await dbStorage.getBook(bookId);
    if (!book) return res.sendStatus(404);
    res.json(book);
  });

  // Fix the ratings route as well
  app.get("/api/books/:id/ratings", async (req, res) => {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const ratings = await dbStorage.getRatings(bookId);
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
      const rating = await dbStorage.createRating({
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
    const books = await dbStorage.getBooksByAuthor(req.user!.id);
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

    const book = await dbStorage.createBook({
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

    const book = await dbStorage.getBook(parseInt(req.params.id));
    if (!book || book.authorId !== req.user!.id) {
      return res.sendStatus(403);
    }

    const updatedBook = await dbStorage.promoteBook(book.id);
    res.json(updatedBook);
  });

  app.patch("/api/books/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const book = await dbStorage.getBook(parseInt(req.params.id));
    if (!book || book.authorId !== req.user!.id) {
      return res.sendStatus(403);
    }

    const updatedBook = await dbStorage.updateBook(book.id, req.body);
    res.json(updatedBook);
  });

  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { currentPassword, newPassword, confirmPassword, ...updateData } = req.body;

    // If updating username, check if it's taken
    if (updateData.username) {
      const existingUser = await dbStorage.getUserByUsername(updateData.username);
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(400).send("Username already taken");
      }
    }

    // If updating email, check if it's taken
    if (updateData.email) {
      const existingUser = await dbStorage.getUserByEmail(updateData.email);
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(400).send("Email already in use");
      }
    }

    // Handle password change if requested
    if (currentPassword && newPassword && confirmPassword) {
      const user = await dbStorage.getUser(req.user!.id);

      // Verify current password
      const scryptAsync = promisify(scrypt);
      const [salt, hash] = user!.password!.split(":");
      const hashBuffer = await scryptAsync(currentPassword, salt, 64) as Buffer;
      const passwordValid = timingSafeEqual(
        Buffer.from(hash, "hex"),
        hashBuffer
      );

      if (!passwordValid) {
        return res.status(400).send("Current password is incorrect");
      }

      // Generate new password hash
      const newSalt = randomBytes(16).toString("hex");
      const newHashBuffer = await scryptAsync(newPassword, newSalt, 64) as Buffer;
      const newHashedPassword = `${newSalt}:${newHashBuffer.toString("hex")}`;

      updateData.password = newHashedPassword;
    }

    const updatedUser = await dbStorage.updateUser(req.user!.id, updateData);
    res.json(updatedUser);
  });

  app.post("/api/user/toggle-author", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const updatedUser = await dbStorage.toggleAuthorStatus(req.user!.id);
    res.json(updatedUser);
  });

  app.get("/api/bookshelf", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookshelf = await dbStorage.getBookshelf(req.user!.id);
    res.json(bookshelf);
  });

  app.post("/api/bookshelf/:bookId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookshelf = await dbStorage.updateBookshelfStatus(
      req.user!.id,
      parseInt(req.params.bookId),
      req.body.status,
    );

    res.json(bookshelf);
  });

  app.delete("/api/books/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const book = await dbStorage.getBook(parseInt(req.params.id));
    if (!book || book.authorId !== req.user!.id) {
      return res.sendStatus(403);
    }

    await dbStorage.deleteBook(book.id, req.user!.id);
    res.sendStatus(200);
  });

  app.get("/api/authors/:id", async (req, res) => {
    const author = await dbStorage.getUser(parseInt(req.params.id));
    if (!author?.isAuthor) return res.sendStatus(404);

    const [books, followerCount, genres, ratings] = await Promise.all([
      dbStorage.getBooksByAuthor(author.id),
      dbStorage.getFollowerCount(author.id),
      dbStorage.getAuthorGenres(author.id),
      dbStorage.getAuthorAggregateRatings(author.id),
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

    const isFollowing = await dbStorage.isFollowing(
      req.user!.id,
      parseInt(req.params.id),
    );
    res.json({ isFollowing });
  });

  app.post("/api/authors/:id/follow", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const authorId = parseInt(req.params.id);
    const author = await dbStorage.getUser(authorId);
    if (!author?.isAuthor) return res.sendStatus(404);

    await dbStorage.followAuthor(req.user!.id, authorId);
    res.sendStatus(200);
  });

  app.post("/api/authors/:id/unfollow", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const authorId = parseInt(req.params.id);
    const author = await dbStorage.getUser(authorId);
    if (!author?.isAuthor) return res.sendStatus(404);

    await dbStorage.unfollowAuthor(req.user!.id, authorId);
    res.sendStatus(200);
  });

  app.get("/api/books/followed-authors", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const books = await dbStorage.getFollowedAuthorsBooks(req.user!.id);
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
        dbStorage.getBookshelf(userId),
        dbStorage.getUserRatings(userId),
        dbStorage.getFollowingCount(userId),
        dbStorage.getFollowerCount(userId),
        dbStorage.getUser(userId)
      ]);

      // Calculate reading stats
      const readingStats = {
        reading: bookshelf.filter(b => b.status === 'reading').length,
        completed: bookshelf.filter(b => b.status === 'read').length,
        wantToRead: bookshelf.filter(b => b.status === 'want-to-read').length
      };

      // Calculate average ratings using the proper weighted calculation
      const averageRatings = ratings.length > 0 ? {
        // First calculate individual category averages
        enjoyment: ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length,
        writing: ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
        themes: ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
        characters: ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length,
        worldbuilding: ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length,
        // Then calculate overall score using weights on the averages
        overall: (
          (ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length) * 0.3 +
          (ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length) * 0.2 +
          (ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length) * 0.2 +
          (ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length) * 0.1 +
          (ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length) * 0.1
        )
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
        recommendations: await dbStorage.getBooks() // This will be replaced with actual recommendations later
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });


  // Add the profile image upload endpoint
  app.post("/api/user/profile-image", upload.single("profileImage"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ message: "No image file provided" });

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    try {
      const updatedUser = await dbStorage.updateUser(req.user!.id, {
        profileImageUrl: imageUrl,
      });
      res.json({ profileImageUrl: imageUrl });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculateWeightedRating(rating) {
  // Implement weighted rating logic here if needed.  For now, a simple sum.
  return rating.enjoyment + rating.writing + rating.themes + rating.characters + rating.worldbuilding;
}