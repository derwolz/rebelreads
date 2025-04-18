import { Router } from "express";
import { dbStorage } from "../storage";
import { applyContentFilters } from "../utils/content-filters";
import { Request } from "express";

const router = Router();

router.get("/", async (req: Request, res) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.json({ books: [] });
    }

    // Get search results
    const books = await dbStorage.selectBooks(query);
    
    // Apply content blocking if user is authenticated
    if (req.user) {
      // Extract book IDs from search results
      const bookIds = books.map(book => book.id);
      
      // Apply content filters
      const filteredBookIds = await applyContentFilters(req.user.id, bookIds);
      
      // Filter out blocked books
      const filteredBooks = books.filter(book => filteredBookIds.includes(book.id));
      
      // Return filtered books
      return res.json({ 
        books: filteredBooks,
        metadata: {
          total: filteredBooks.length,
          originalTotal: books.length,
          query,
          filtered: books.length !== filteredBooks.length
        }
      });
    }

    // Return unfiltered books if user is not authenticated
    res.json({ 
      books,
      metadata: {
        total: books.length,
        query,
        filtered: false
      }
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

export default router;