import express from "express";
import { dbStorage } from "../storage";
import { db } from "../db";
import { bookShelves, bookImages } from "@shared/schema";
import { and, eq, like } from "drizzle-orm";
import { asc } from "drizzle-orm";

const router = express.Router();

// GET /api/link-preview/book-shelf - Public endpoint for previewing shared bookshelves
router.get("/book-shelf", async (req, res) => {
  try {
    const { username, shelfname } = req.query;

    if (!username || !shelfname) {
      return res.status(400).json({ error: "Missing username or shelfname" });
    }

    // Get user by username
    const user = await dbStorage.getUserByUsername(username as string);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get the shelf using direct database access
    const decodedShelfName = decodeURIComponent(shelfname as string);
    
    // Find the bookshelf directly in the database by title and user ID
    const shelf = await db.query.bookShelves.findFirst({
      where: and(
        eq(bookShelves.userId, user.id),
        eq(bookShelves.isShared, true),
        // Use case-insensitive comparison for title
        like(bookShelves.title, decodedShelfName)
      )
    });
    
    if (!shelf) {
      return res.status(404).json({ error: "Bookshelf not found or not shared" });
    }
    
    // Get owner display info
    const owner = {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      profileImageUrl: user.profileImageUrl
    };
    
    // Return the shelf data
    return res.json({
      shelf,
      owner,
      books: [] // Not needed for preview
    });
  } catch (error) {
    console.error("Error in bookshelf preview:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/link-preview/books/:id - Public endpoint for previewing books
router.get("/books/:id", async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    // Get the book
    const book = await dbStorage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Get book images from the database using direct DB access
    try {
      const images = await db.query.bookImages.findMany({
        where: eq(bookImages.bookId, bookId)
      });
      
      // Return the book data with images
      return res.json({
        ...book,
        images
      });
    } catch (error) {
      // If there's an error getting images, just return the book without images
      console.error("Error fetching book images:", error);
      return res.json(book);
    }
  } catch (error) {
    console.error("Error in book preview:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;