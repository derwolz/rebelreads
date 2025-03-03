import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads/covers",
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Existing routes
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

    const rating = await storage.createRating({
      bookId: parseInt(req.params.id),
      userId: req.user!.id,
      rating: req.body.rating,
      review: req.body.review
    });

    res.json(rating);
  });

  // New routes for author features
  app.get("/api/my-books", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const books = await storage.getBooksByAuthor(req.user!.id);
    res.json(books);
  });

  app.post("/api/books", upload.single("cover"), async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAuthor) {
      return res.sendStatus(401);
    }

    const coverUrl = `/uploads/covers/${req.file!.filename}`;
    const book = await storage.createBook({
      ...req.body,
      authorId: req.user!.id,
      coverUrl,
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

  // Profile management routes
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

  const httpServer = createServer(app);
  return httpServer;
}