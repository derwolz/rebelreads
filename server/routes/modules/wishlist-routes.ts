import { Router, Request, Response } from "express";
import { dbStorage } from "../../storage";

const router = Router();

/**
 * POST /api/books/:id/wishlist
 * Add a book to the user's wishlist
 * Authentication required
 */
router.post("/books/:id/wishlist", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }
  
  try {
    const wishlistItem = await dbStorage.addToWishlist(req.user!.id, bookId);
    res.json(wishlistItem);
  } catch (error: any) {
    console.error(`Error adding to wishlist:`, error);
    res.status(500).json({ error: error.message || "Failed to add to wishlist" });
  }
});

/**
 * DELETE /api/books/:id/wishlist
 * Remove a book from the user's wishlist
 * Authentication required
 */
router.delete("/books/:id/wishlist", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }
  
  try {
    await dbStorage.removeFromWishlist(req.user!.id, bookId);
    res.json({ success: true });
  } catch (error: any) {
    console.error(`Error removing from wishlist:`, error);
    res.status(500).json({ error: error.message || "Failed to remove from wishlist" });
  }
});

/**
 * GET /api/wishlist/books
 * Get all books in the user's wishlist
 * Authentication required
 */
router.get("/wishlist/books", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const books = await dbStorage.getWishlistBooks(req.user!.id);
    res.json(books);
  } catch (error: any) {
    console.error(`Error getting wishlist books:`, error);
    res.status(500).json({ error: error.message || "Failed to get wishlist books" });
  }
});

export default router;