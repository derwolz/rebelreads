import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

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
