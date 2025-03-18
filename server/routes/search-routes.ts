import { Router } from "express";
import { dbStorage } from "../storage";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.json({ books: [] });
    }

    const books = await dbStorage.selectBooks(query);

    res.json({ 
      books,
      metadata: {
        total: books.length,
        query
      }
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

export default router;