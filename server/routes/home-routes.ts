import { Router } from "express";
import path from "path";
import express from "express";
import { dbStorage } from "../storage";

// Import route modules
import bookRoutes from "./modules/book-routes-fixed"; // Using fixed version with better error handling
import authorRoutes from "./modules/author-routes";
import ratingRoutes from "./modules/rating-routes";
import wishlistRoutes from "./modules/wishlist-routes";
import dashboardRoutes from "./modules/dashboard-routes";

const router = Router();

// Register all module routes
router.use("/books", bookRoutes);
router.use("/authors", authorRoutes);
router.use("/", ratingRoutes); // These routes already have the full paths like /books/:id/ratings
router.use("/", wishlistRoutes); // These routes already have the full paths like /books/:id/wishlist
router.use("/dashboard", dashboardRoutes);

// Special case for the coming-soon endpoint at the root level
// This ensures it's accessible at /api/coming-soon
router.get("/coming-soon", async (req, res) => {
  try {
    // Force JSON content type to prevent Vite intercept - specify explicitly to avoid HTML responses
    res.set('Content-Type', 'application/json');
    
    // This is a public endpoint - don't require authentication
    // Express will automatically add auth middleware to all routes,
    // but we explicitly want this to be a public endpoint
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const comingSoonBooks = await dbStorage.getComingSoonBooks(limit);
    res.json(comingSoonBooks);
  } catch (error) {
    console.error("Error getting coming soon books:", error);
    res.status(500).json({ error: "Failed to get coming soon books" });
  }
});

// Register the my-books route directly here to avoid routing conflicts
router.get("/my-books", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  // Get the author ID from the user ID
  const author = await dbStorage.getAuthorByUserId(req.user.id);
  
  if (!author) {
    return res.status(403).json({ error: "User is not an author or author record not found" });
  }
  
  const books = await dbStorage.getBooksByAuthor(author.id);
  res.json(books);
});

// Add these individual routes here if they don't fit in any of the modules:
// For example: router.get("/some-unique-endpoint", (req, res) => {...});

export default router;