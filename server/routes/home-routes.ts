import { Router } from "express";
import { dbStorage } from "../storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { db } from "../db";
import { ratings, books, followers } from "@shared/schema";
import { eq, and, inArray, desc } from "drizzle-orm";

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
    const books = await dbStorage.getFollowedAuthorsBooks(req.user!.id);
    res.json(books);
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

export default router;
