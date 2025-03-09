import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { books } from "@shared/schema";
import { isAdmin } from "../middleware/auth";

const router = Router();

// Middleware to ensure only admins can access these routes
router.use(isAdmin);

router.post("/books/bulk-upload", async (req, res) => {
  try {
    const { books: booksToUpload } = req.body;

    if (!Array.isArray(booksToUpload)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Process books in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    const results = [];

    for (let i = 0; i < booksToUpload.length; i += BATCH_SIZE) {
      const batch = booksToUpload.slice(i, i + BATCH_SIZE);

      const booksToInsert = batch.map(book => ({
        title: book.title,
        description: book.description || "",
        author: book.author,
        authorId: req.user!.id, // Set the admin as the author temporarily
        isbn: book.isbn || null,
        publishedDate: book.publishedDate ? new Date(book.publishedDate) : new Date(),
        genres: book.genres || [],
        language: book.language || "English",
        coverUrl: "/placeholder-cover.jpg", // Default cover image
        formats: [], // Default empty formats array
        userId: req.user!.id, // Associate with the admin user
      }));

      const insertedBooks = await db.insert(books).values(booksToInsert).returning();
      results.push(...insertedBooks);
    }

    res.json({
      success: true,
      message: `Successfully imported ${results.length} books`,
      books: results,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      error: "Failed to process bulk upload",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;