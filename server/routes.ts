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
import { users, books, bookshelves, replies, followers } from "@shared/schema"; // Added replies and followers imports
import { eq, and, inArray, desc, sql, ilike, or, isNotNull } from "drizzle-orm";
import { promisify } from "util";
import { scrypt } from "crypto";
import { randomBytes } from "crypto";
import { timingSafeEqual } from "crypto";
import { format } from "date-fns";

// Ensure uploads directories exist
const uploadsDir = "./uploads";
const coversDir = path.join(uploadsDir, "covers");
const profilesDir = path.join(uploadsDir, "profiles");

[uploadsDir, coversDir, profilesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Choose directory based on upload type
    const uploadDir =
      file.fieldname === "profileImage" ? profilesDir : coversDir;
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

  app.post("/api/books/:id/ratings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    try {
      // Start a transaction for creating/updating the rating
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

  // Deprecate the following code
  // app.post("/api/books/:id/promote", async (req, res) => {
  //   if (!req.isAuthenticated()) return res.sendStatus(401);
  //
  //   const book = await dbStorage.getBook(parseInt(req.params.id));
  //   if (!book || book.authorId !== req.user!.id) {
  //     return res.sendStatus(403);
  //   }
  //
  //   const updatedBook = await dbStorage.promoteBook(book.id);
  //   res.json(updatedBook);
  // });

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

    const { currentPassword, newPassword, confirmPassword, ...updateData } =
      req.body;

    // If updating username, check if it's taken
    if (updateData.username) {
      const existingUser = await dbStorage.getUserByUsername(
        updateData.username,
      );
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
      const hashBuffer = (await scryptAsync(
        currentPassword,
        salt,
        64,
      )) as Buffer;
      const passwordValid = timingSafeEqual(
        Buffer.from(hash, "hex"),
        hashBuffer,
      );

      if (!passwordValid) {
        return res.status(400).send("Current password is incorrect");
      }

      // Generate new password hash
      const newSalt = randomBytes(16).toString("hex");
      const newHashBuffer = (await scryptAsync(
        newPassword,
        newSalt,
        64,
      )) as Buffer;
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

  app.get("/api/books/:id/reading-status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const status = await dbStorage.getReadingStatus(req.user!.id, bookId);
    res.json(status || {});
  });

  app.post("/api/books/:id/wishlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const status = await dbStorage.toggleWishlist(req.user!.id, bookId);
    res.json(status);
  });

  app.delete("/api/books/:id/wishlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const status = await dbStorage.toggleWishlist(req.user!.id, bookId);
    res.json(status);
  });

  app.get("/api/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = req.user!.id;

      // Fetch all required data in parallel
      const [
        wishlistedBooks,
        completedBooks,
        ratings,
        followingCount,
        followerCount,
        user,
      ] = await Promise.all([
        dbStorage.getWishlistedBooks(userId),
        dbStorage.getCompletedBooks(userId),
        dbStorage.getUserRatings(userId),
        dbStorage.getFollowingCount(userId),
        dbStorage.getFollowerCount(userId),
        dbStorage.getUser(userId),
      ]);

      // Calculate reading stats
      const readingStats = {
        wishlisted: wishlistedBooks.length,
        completed: completedBooks.length,
      };

      // Calculate average ratings using the proper weighted calculation
      const averageRatings =
        ratings.length > 0
          ? {
              enjoyment:
                ratings.reduce((acc, r) => acc + r.enjoyment, 0) /
                ratings.length,
              writing:
                ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
              themes:
                ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
              characters:
                ratings.reduce((acc, r) => acc + r.characters, 0) /
                ratings.length,
              worldbuilding:
                ratings.reduce((acc, r) => acc + r.worldbuilding, 0) /
                ratings.length,
              // Calculate overall score using weights
              overall:
                ratings.reduce(
                  (acc, r) => acc + calculateWeightedRating(r),
                  0,
                ) / ratings.length,
            }
          : null;

      res.json({
        user: {
          ...user,
          followingCount,
          followerCount,
        },
        readingStats,
        averageRatings,
        recentReviews: ratings.slice(0, 5),
        recommendations: [], // This will be implemented later with actual recommendations
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
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

  // Add the profile image upload endpoint
  app.post(
    "/api/user/profile-image",
    upload.single("profileImage"),
    async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      if (!req.file)
        return res.status(400).json({ message: "No image file provided" });

      const imageUrl = `/uploads/profiles/${req.file.filename}`;

      try {
        await dbStorage.updateUser(req.user!.id, {
          profileImageUrl: imageUrl,
        });
        res.json({ profileImageUrl: imageUrl });
      } catch (error) {
        console.error("Error updating profile image:", error);
        res.status(500).json({ message: "Failed to update profile image" });
      }
    },
  );

  // Add author endpoint
  app.get("/api/authors/:id", async (req, res) => {
    try {
      const authorId = parseInt(req.params.id);
      if (isNaN(authorId)) {
        return res.status(400).json({ error: "Invalid author ID" });
      }

      // Get author details
      const author = await dbStorage.getUser(authorId);
      if (!author || !author.isAuthor) {
        return res.status(404).json({ error: "Author not found" });
      }

      // Get author's books with genres
      const authorBooks = await db
        .select()
        .from(books)
        .where(eq(books.authorId, authorId));

      // Calculate genre distribution
      const genreCounts: { [key: string]: number } = {};
      authorBooks.forEach((book) => {
        if (Array.isArray(book.genres)) {
          book.genres.forEach((genre) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          });
        }
      });

      const genres = Object.entries(genreCounts).map(([genre, count]) => ({
        genre,
        count,
      }));

      // Get follower count
      const followerCount = await dbStorage.getFollowerCount(authorId);

      // Get ratings for all author's books
      const bookIds = authorBooks.map((book) => book.id);
      const authorRatings = await db
        .select()
        .from(ratings)
        .where(inArray(ratings.bookId, bookIds));

      // Calculate aggregate ratings
      const aggregateRatings =
        authorRatings.length > 0
          ? {
              enjoyment:
                authorRatings.reduce((acc, r) => acc + r.enjoyment, 0) /
                authorRatings.length,
              writing:
                authorRatings.reduce((acc, r) => acc + r.writing, 0) /
                authorRatings.length,
              themes:
                authorRatings.reduce((acc, r) => acc + r.themes, 0) /
                authorRatings.length,
              characters:
                authorRatings.reduce((acc, r) => acc + r.characters, 0) /
                authorRatings.length,
              worldbuilding:
                authorRatings.reduce((acc, r) => acc + r.worldbuilding, 0) /
                authorRatings.length,
              overall:
                authorRatings.reduce(
                  (acc, r) => acc + calculateWeightedRating(r),
                  0,
                ) / authorRatings.length,
            }
          : undefined;

      res.json({
        id: author.id,
        username: author.username,
        authorName: author.authorName,
        authorBio: author.authorBio,
        birthDate: author.birthDate,
        deathDate: author.deathDate,
        website: author.website,
        socialMediaLinks: author.socialMediaLinks,
        books: authorBooks,
        followerCount,
        genres,
        aggregateRatings,
      });
    } catch (error) {
      console.error("Error fetching author details:", error);
      res.status(500).json({ error: "Failed to fetch author details" });
    }
  });

  // Add this near the other API endpoints
  app.get("/api/genres", async (_req, res) => {
    try {
      // Get all unique genres from existing books
      const result = await db.select({ genres: books.genres }).from(books);

      // Flatten and deduplicate genres
      const uniqueGenres = Array.from(
        new Set(result.flatMap((r) => r.genres || [])),
      ).sort();

      res.json(uniqueGenres);
    } catch (error) {
      console.error("Error fetching genres:", error);
      res.status(500).json({ error: "Failed to fetch genres" });
    }
  });

  // Add near the other API endpoints
  app.get("/api/pro/dashboard", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(401);
    }

    try {
      const authorId = req.user!.id;

      // Get author's books
      const books = await dbStorage.getBooksByAuthor(authorId);

      // Get all ratings for author's books
      const bookIds = books.map((book) => book.id);
      const allRatings = await db
        .select()
        .from(ratings)
        .where(inArray(ratings.bookId, bookIds));

      // Calculate average rating
      const averageRating =
        allRatings.length > 0
          ? allRatings.reduce((acc, r) => acc + calculateWeightedRating(r), 0) /
            allRatings.length
          : 0;

      // Generate sample interest data (In a real app, this would come from actual view/interaction tracking)
      const today = new Date();
      const bookInterest = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (29 - i));
        return {
          date: format(date, "MMM dd"),
          ...Object.fromEntries(
            books.map((book) => [
              book.title,
              // Random number between 50-200 with some trending
              Math.floor(100 + Math.random() * 100 + i / 2),
            ]),
          ),
        };
      });

      res.json({
        bookInterest,
        totalReviews: allRatings.length,
        averageRating,
        recentReports: 0, // Placeholder for review reports feature
      });
    } catch (error) {
      console.error("Error fetching pro dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Add after the /api/pro/dashboard endpoint
  app.get("/api/campaigns", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(401);
    }

    try {
      const campaigns = await dbStorage.getCampaigns(req.user!.id);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(401);
    }

    try {
      const campaign = await dbStorage.createCampaign({
        ...req.body,
        authorId: req.user!.id,
      });
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(401);
    }

    try {
      const campaign = await dbStorage.updateCampaignStatus(
        parseInt(req.params.id),
        req.body.status
      );
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign status:", error);
      res.status(500).json({ error: "Failed to update campaign status" });
    }
  });

  // Add near the other API endpoints
  app.get("/api/pro/reviews", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(401);
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;

      // Get all books by the author
      const authorBooks = await dbStorage.getBooksByAuthor(req.user!.id);
      const bookIds = authorBooks.map((book) => book.id);

      // Get paginated reviews for author's books
      const reviews = await db
        .select({
          review: ratings,
          user: users,
          replies: replies,
        })
        .from(ratings)
        .where(inArray(ratings.bookId, bookIds))
        .leftJoin(users, eq(users.id, ratings.userId))
        .leftJoin(replies, eq(replies.reviewId, ratings.id))
        .orderBy(desc(ratings.createdAt))
        .limit(limit)
        .offset(offset);

      // Check if there are more reviews
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(ratings)
        .where(inArray(ratings.bookId, bookIds));

      const hasMore = totalCount[0].count > page * limit;

      // Group replies with their reviews
      const processedReviews = reviews.reduce((acc: any[], curr) => {
        const existingReview = acc.find((r) => r.id === curr.review.id);
        if (existingReview) {
          if (curr.replies) {
            existingReview.replies.push(curr.replies);
          }
        } else {
          acc.push({
            ...curr.review,
            user: curr.user,
            replies: curr.replies ? [curr.replies] : [],
          });
        }
        return acc;
      }, []);

      res.json({
        reviews: processedReviews,
        hasMore,
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/pro/reviews/:id/feature", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(403);
    }

    try {
      const reviewId = parseInt(req.params.id);
      const { featured } = req.body;

      // Verify the review belongs to one of the author's books
      const review = await db
        .select()
        .from(ratings)
        .where(eq(ratings.id, reviewId))
        .limit(1);

      if (!review.length) {
        return res.status(404).json({ error: "Review not found" });
      }

      const book = await dbStorage.getBook(review[0].bookId);
      if (!book || book.authorId !== req.user!.id) {
        return res.sendStatus(403);
      }

      // Update the review's featured status
      const [updatedReview] = await db
        .update(ratings)
        .set({ featured })
        .where(eq(ratings.id, reviewId))
        .returning();

      res.json(updatedReview);
    } catch (error) {
      console.error("Error featuring review:", error);
      res.status(500).json({ error: "Failed to feature review" });
    }
  });

  app.post("/api/pro/reviews/:id/reply", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(403);
    }

    try {
      const reviewId = parseInt(req.params.id);
      const { content } = req.body;

      // Verify the review belongs to one of the author's books
      const review = await db
        .select()
        .from(ratings)
        .where(eq(ratings.id, reviewId))
        .limit(1);

      if (!review.length) {
        return res.status(404).json({ error: "Review not found" });
      }

      const book = await dbStorage.getBook(review[0].bookId);
      if (!book || book.authorId !== req.user!.id) {
        return res.sendStatus(403);
      }

      // Create the reply
      const [newReply] = await db
        .insert(replies)
        .values({
          reviewId,
          authorId: req.user!.id,
          content,
        })
        .returning();

      res.json(newReply);
    } catch (error) {
      console.error("Error replying to review:", error);
      res.status(500).json({ error: "Failed to reply to review" });
    }
  });

  app.post("/api/pro/reviews/:id/report", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(403);
    }

    try {
      const reviewId = parseInt(req.params.id);
      const { reason } = req.body;

      // Verify the review belongs to one of the author's books
      const review = await db
        .select()
        .from(ratings)
        .where(eq(ratings.id, reviewId))
        .limit(1);

      if (!review.length) {
        return res.status(404).json({ error: "Review not found" });
      }

      const book = await dbStorage.getBook(review[0].bookId);
      if (!book || book.authorId !== req.user!.id) {
        return res.sendStatus(403);
      }

      // Store the report (You'll need to add a reports table to your schema)
      // For now, we'll just acknowledge the report
      res.json({ success: true });
    } catch (error) {
      console.error("Error reporting review:", error);
      res.status(500).json({ error: "Failed to report review" });
    }
  });

  app.get("/api/search/books", async (req, res) => {
    try {
      const query = req.query.q as string;
      console.error(query, "app Request");
      if (!query || query.length < 2) {
        return res.json({ books: [] });
      }

      const searchPattern = `%${query.toLowerCase()}%`;

      const results = await dbStorage.selectBooks(searchPattern);

      res.json({ books: results });
    } catch (error) {
      console.error("Book search error:", error);
      res.status(500).json({ error: "Failed to search books" });
    }
  });

  app.get("/api/search/authors", async (req, res) => {
    try {
      const query = req.query.q as string;

      if (!query || query.length < 2) {
        return res.json({ authors: [] });
      }

      const searchPattern = `%${query.toLowerCase()}%`;

      // Get matching authors by name
      const authors = await db
        .select({
          id: users.id,
          username: users.username,
          authorName: users.authorName,
          authorBio: users.authorBio,
          authorImageUrl: users.profileImageUrl,
          socialMediaLinks: users.socialMediaLinks,
        })
        .from(users)
        .where(
          and(
            users.isAuthor.equals(true),
            or(
              ilike(users.username, searchPattern),
              ilike(users.authorName, searchPattern),
            ),
          ),
        )
        .limit(10);

      // Get books and aggregate ratings for each author
      const authorsWithDetails = await Promise.all(
        authors.map(async (author) => {
          const authorBooks = await db
            .select()
            .from(books)
            .where(eq(books.authorId, author.id));

          const bookIds = authorBooks.map((book) => book.id);
          const authorRatings =
            bookIds.length > 0
              ? await db
                  .select()
                  .from(ratings)
                  .where(inArray(ratings.bookId, bookIds))
              : [];

          const followerCount = await dbStorage.getFollowerCount(author.id);

          const aggregateRatings =
            authorRatings.length > 0
              ? {
                  enjoyment:
                    authorRatings.reduce((acc, r) => acc + r.enjoyment, 0) /
                    authorRatings.length,
                  writing:
                    authorRatings.reduce((acc, r) => acc + r.writing, 0) /
                    authorRatings.length,
                  themes:
                    authorRatings.reduce((acc, r) => acc + r.themes, 0) /
                    authorRatings.length,
                  characters:
                    authorRatings.reduce((acc, r) => acc + r.characters, 0) /
                    authorRatings.length,
                  worldbuilding:
                    authorRatings.reduce((acc, r) => acc + r.worldbuilding, 0) /
                    authorRatings.length,
                  overall:
                    authorRatings.reduce(
                      (acc, r) => acc + calculateWeightedRating(r),
                      0,
                    ) / authorRatings.length,
                }
              : undefined;

          return {
            ...author,
            books: authorBooks,
            followerCount,
            aggregateRatings,
          };
        }),
      );

      res.json({ authors: authorsWithDetails });
    } catch (error) {
      console.error("Author search error:", error);
      res.status(500).json({ error: "Failed to search authors" });
    }
  });

  // Add after other book-related routes
  app.post("/api/books/:id/impression", async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }

      const userId = req.isAuthenticated() ? req.user!.id : null;
      const { source, context } = req.body;

      const impression = await dbStorage.recordBookImpression(
        bookId,
        userId,
        source,
        context,
      );

      res.json(impression);
    } catch (error) {
      console.error("Error recording impression:", error);
      res.status(500).json({ error: "Failed to record impression" });
    }
  });

  app.post("/api/books/:id/click-through", async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }

      const userId = req.isAuthenticated() ? req.user!.id : null;
      const { source, referrer } = req.body;

      const clickThrough = await dbStorage.recordBookClickThrough(
        bookId,
        userId,
        source,
        referrer,
      );

      res.json(clickThrough);
    } catch (error) {
      console.error("Error recording click-through:", error);
      res.status(500).json({ error: "Failed to record click-through" });
    }
  });

  // Add after other API endpoint definitions
  app.get("/api/pro/book-analytics", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(401);
    }

    try {
      const authorId = req.user!.id;
      const bookIds = req.query.bookIds
        ? (req.query.bookIds as string).split(",").map(Number)
        : [];
      const days = parseInt(req.query.days as string) || 30;

      // Get all books if no specific books requested
      const books =
        bookIds.length > 0
          ? await db
              .select()
              .from(books)
              .where(
                and(eq(books.authorId, authorId), inArray(books.id, bookIds)),
              )
          : await dbStorage.getBooksByAuthor(authorId);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get analytics data for each book
      const analyticsData = await Promise.all(
        books.map(async (book) => {
          // Get impressions
          const impressions = await db
            .select({
              date: sql`DATE(${bookImpressions.timestamp})`,
              count: sql`COUNT(*)`,
            })
            .from(bookImpressions)
            .where(
              and(
                eq(bookImpressions.bookId, book.id),
                sql`${bookImpressions.timestamp} >= ${startDate}`,
                sql`${bookImpressions.timestamp} <= ${endDate}`,
              ),
            )
            .groupBy(sql`DATE(${bookImpressions.timestamp})`)
            .orderBy(sql`DATE(${bookImpressions.timestamp})`);

          // Get click-throughs
          const clickThroughs = await db
            .select({
              date: sql`DATE(${bookClickThroughs.timestamp})`,
              count: sql`COUNT(*)`,
            })
            .from(bookClickThroughs)
            .where(
              and(
                eq(bookClickThroughs.bookId, book.id),
                sql`${bookClickThroughs.timestamp} >= ${startDate}`,
                sql`${bookClickThroughs.timestamp} <= ${endDate}`,
              ),
            )
            .groupBy(sql`DATE(${bookClickThroughs.timestamp})`)
            .orderBy(sql`DATE(${bookClickThroughs.timestamp})`);

          // Get referral clicks
          const referralClicks = await db
            .select({
              date: sql`DATE(${bookClickThroughs.timestamp})`,
              count: sql`COUNT(*)`,
            })
            .from(bookClickThroughs)
            .where(
              and(
                eq(bookClickThroughs.bookId, book.id),
                sql`${bookClickThroughs.source} LIKE 'referral_%'`,
                sql`${bookClickThroughs.timestamp} >= ${startDate}`,
                sql`${bookClickThroughs.timestamp} <= ${endDate}`,
              ),
            )
            .groupBy(sql`DATE(${bookClickThroughs.timestamp})`)
            .orderBy(sql`DATE(${bookClickThroughs.timestamp})`);

          return {
            bookId: book.id,
            title: book.title,
            metrics: {
              impressions,
              clickThroughs,
              referralClicks,
            },
          };
        }),
      );

      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching book analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  app.get("/api/pro/book-performance", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(401);
    }

    try {
      const authorId = req.user!.id;
      const bookIds = req.query.bookIds
        ? (req.query.bookIds as string).split(",").map(Number)
        : [];
      const metrics = ((req.query.metrics as string) || "").split(",");
      const days = parseInt(req.query.days as string) || 30;

      // Get all books if no specific books requested
      const authorBooks = await db
        .select()
        .from(books)
        .where(
          bookIds.length > 0
            ? and(eq(books.authorId, authorId), inArray(books.id, bookIds))
            : eq(books.authorId, authorId),
        );

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const performanceData = await Promise.all(
        authorBooks.map(async (book) => {
          const data: any = {
            bookId: book.id,
            title: book.title,
            metrics: {},
          };

          if (metrics.includes("impressions")) {
            const impressions = await db
              .select({
                date: sql`DATE(${bookImpressions.timestamp})`,
                count: sql`COUNT(*)`,
              })
              .from(bookImpressions)
              .where(
                and(
                  eq(bookImpressions.bookId, book.id),
                  sql`${bookImpressions.timestamp} >= ${startDate}`,
                  sql`${bookImpressions.timestamp} <= ${endDate}`,
                ),
              )
              .groupBy(sql`DATE(${bookImpressions.timestamp})`)
              .orderBy(sql`DATE(${bookImpressions.timestamp})`);

            data.metrics.impressions = impressions;
          }

          if (metrics.includes("clicks")) {
            const clicks = await db
              .select({
                date: sql`DATE(${bookClickThroughs.timestamp})`,
                count: sql`COUNT(*)`,
              })
              .from(bookClickThroughs)
              .where(
                and(
                  eq(bookClickThroughs.bookId, book.id),
                  sql`${bookClickThroughs.source} NOT LIKE 'referral_%'`,
                  sql`${bookClickThroughs.timestamp} >= ${startDate}`,
                  sql`${bookClickThroughs.timestamp} <= ${endDate}`,
                ),
              )
              .groupBy(sql`DATE(${bookClickThroughs.timestamp})`)
              .orderBy(sql`DATE(${bookClickThroughs.timestamp})`);

            data.metrics.clicks = clicks;
          }

          if (metrics.includes("referrals")) {
            const referrals = await db
              .select({
                date: sql`DATE(${bookClickThroughs.timestamp})`,
                count: sql`COUNT(*)`,
              })
              .from(bookClickThroughs)
              .where(
                and(
                  eq(bookClickThroughs.bookId, book.id),
                  sql`${bookClickThroughs.source} LIKE 'referral_%'`,
                  sql`${bookClickThroughs.timestamp} >= ${startDate}`,
                  sql`${bookClickThroughs.timestamp} <= ${endDate}`,
                ),
              )
              .groupBy(sql`DATE(${bookClickThroughs.timestamp})`)
              .orderBy(sql`DATE(${bookClickThroughs.timestamp})`);

            data.metrics.referrals = referrals;
          }

          return data;
        }),
      );

      res.json(performanceData);
    } catch (error) {
      console.error("Error fetching book performance:", error);
      res.status(500).json({ error: "Failed to fetch performance data" });
    }
  });

  app.get("/api/pro/follower-analytics", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(401);
    }

    try {
      const authorId = req.user!.id;
      const timeRange = parseInt(req.query.timeRange as string) || 30; // Default to 30 days

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      // Get follower history from followers table
      const followerHistory = await db
        .select({
          date: sql`to_char(${followers.createdAt}::date, 'YYYY-MM-DD')`,
          count: sql`COUNT(*)`,
        })
        .from(followers)
        .where(
          and(
            eq(followers.followingId, authorId),
            sql`${followers.createdAt} >= ${startDate}::date`,
            sql`${followers.createdAt} <= ${endDate}::date`,
          ),
        )
        .groupBy(sql`${followers.createdAt}::date`)
        .orderBy(sql`${followers.createdAt}::date`);

      // Get unfollower history
      const unfollowerHistory = await db
        .select({
          date: sql`to_char(${followers.deletedAt}::date, 'YYYY-MM-DD')`,
          count: sql`COUNT(*)`,
        })
        .from(followers)
        .where(
          and(
            eq(followers.followingId, authorId),
            sql`${followers.deletedAt} >= ${startDate}::date`,
            sql`${followers.deletedAt} <= ${endDate}::date`,
            isNotNull(followers.deletedAt),
          ),
        )
        .groupBy(sql`${followers.deletedAt}::date`)
        .orderBy(sql`${followers.deletedAt}::date`);

      // Fill in missing dates with zero counts
      const dateMap = new Map();
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap.set(dateStr, { date: dateStr, count: "0" });
      }

      // Update with actual follow counts
      followerHistory.forEach(({ date, count }) => {
        if (dateMap.has(date)) {
          dateMap.get(date).count = count.toString();
        }
      });

      // Create array of follows with all dates
      const follows = Array.from(dateMap.values());

      // Reset dateMap for unfollows
      dateMap.clear();
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap.set(dateStr, { date: dateStr, count: "0" });
      }

      // Update with actual unfollow counts
      unfollowerHistory.forEach(({ date, count }) => {
        if (dateMap.has(date)) {
          dateMap.get(date).count = count.toString();
        }
      });

      // Create array of unfollows with all dates
      const unfollows = Array.from(dateMap.values());

      res.json({
        follows,
        unfollows,
      });
    } catch (error) {
      console.error("Error fetching follower analytics:", error);
      res.status(500).json({ error: "Failed to fetch follower analytics" });
    }
  });

  // Adding publisher routes
  app.get("/api/publishers", async (_req, res) => {
    try {
      const publishers = await dbStorage.getPublishers();
      res.json(publishers);
    } catch (error) {
      console.error("Error fetching publishers:", error);
      res.status(500).json({ error: "Failed to fetch publishers" });
    }
  });

  app.get("/api/publishers/:id", async (req, res) => {
    try {
      const publisherId = parseInt(req.params.id);
      if (isNaN(publisherId)) {
        return res.status(400).json({ error: "Invalid publisher ID" });
      }

      const publisher = await dbStorage.getPublisher(publisherId);
      if (!publisher) {
        return res.status(404).json({ error: "Publisher not found" });
      }

      // Get publisher's authors and their books
      const authors = await dbStorage.getPublisherAuthors(publisherId);
      const authorBooks = await Promise.all(
        authors.map(async (author) => ({
          author,
          books: await dbStorage.getBooksByAuthor(author.id),
        }))
      );

      res.json({
        ...publisher,
        authors: authorBooks,
      });
    } catch (error) {
      console.error("Error fetching publisher details:", error);
      res.status(500).json({ error: "Failed to fetch publisher details" });
    }
  });

  app.post("/api/publishers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const publisher = await dbStorage.createPublisher(req.body);
      res.json(publisher);
    } catch (error) {
      console.error("Error creating publisher:", error);
      res.status(500).json({ error: "Failed to create publisher" });
    }
  });

  app.post("/api/publishers/:id/authors/:authorId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const publisherId = parseInt(req.params.id);
      const authorId = parseInt(req.params.authorId);

      if (isNaN(publisherId) || isNaN(authorId)) {
        return res.status(400).json({ error: "Invalid ID provided" });
      }

      const relation = await dbStorage.addAuthorToPublisher(
        publisherId,
        authorId,
        new Date(req.body.contractStart || new Date())
      );
      res.json(relation);
    } catch (error) {
      console.error("Error adding author to publisher:", error);
      res.status(500).json({ error: "Failed to add author to publisher" });
    }
  });

  app.delete("/api/publishers/:id/authors/:authorId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const publisherId = parseInt(req.params.id);
      const authorId = parseInt(req.params.authorId);

      if (isNaN(publisherId) || isNaN(authorId)) {
        return res.status(400).json({ error: "Invalid ID provided" });
      }

      await dbStorage.removeAuthorFromPublisher(publisherId, authorId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error removing author from publisher:", error);
      res.status(500).json({ error: "Failed to remove author from publisher" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}