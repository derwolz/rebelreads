import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from 'express';
import { db } from './db';
import { ratings } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

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

  app.get("/api/books/:id", async (req, res) => {
    const book = await storage.getBook(parseInt(req.params.id));
    if (!book) return res.sendStatus(404);
    res.json(book);
  });

  app.get("/api/books/:id/ratings", async (req, res) => {
    const ratings = await storage.getRatings(parseInt(req.params.id));
    res.json(ratings);
  });

  app.post("/api/books/:id/ratings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Try to create new rating
      const rating = await storage.createRating({
        bookId: parseInt(req.params.id),
        userId: req.user!.id,
        enjoyment: req.body.enjoyment,
        writing: req.body.writing,
        themes: req.body.themes,
        characters: req.body.characters,
        worldbuilding: req.body.worldbuilding,
        review: req.body.review
      });

      res.json(rating);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        try {
          // If rating exists, update it
          const [updatedRating] = await db
            .update(ratings)
            .set({
              enjoyment: req.body.enjoyment,
              writing: req.body.writing,
              themes: req.body.themes,
              characters: req.body.characters,
              worldbuilding: req.body.worldbuilding,
              review: req.body.review
            })
            .where(
              and(
                eq(ratings.userId, req.user!.id),
                eq(ratings.bookId, parseInt(req.params.id))
              )
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
    const characters = req.body.characters ? JSON.parse(req.body.characters) : [];
    const awards = req.body.awards ? JSON.parse(req.body.awards) : [];
    const publishedDate = req.body.publishedDate ? new Date(req.body.publishedDate) : null;

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
      language: req.body.language || "English"
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
      req.body.status
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

  const httpServer = createServer(app);
  return httpServer;
}