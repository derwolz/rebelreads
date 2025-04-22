import { Router } from "express";
import path from "path";
import express from "express";

// Import route modules
import bookRoutes from "./modules/book-routes";
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

// Add these individual routes here if they don't fit in any of the modules:
// For example: router.get("/some-unique-endpoint", (req, res) => {...});

export default router;