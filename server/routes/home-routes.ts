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