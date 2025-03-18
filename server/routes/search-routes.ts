import { Router } from "express";
import { dbStorage } from "../storage";
import { db } from "../db";
import { books } from "@shared/schema";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/books", async (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      return res.json({ books: [] });
    }

    // Use full text search with ranking
    const results = await db
      .select({
        ...books,
        rank: sql<number>`ts_rank(search_vector, plainto_tsquery('english', ${query}))`,
      })
      .from(books)
      .where(sql`search_vector @@ plainto_tsquery('english', ${query})`)
      .orderBy(sql`ts_rank(search_vector, plainto_tsquery('english', ${query})) DESC`)
      .limit(20);

    res.json({ 
      books: results.map(({ rank, ...book }) => book),
      metadata: {
        total: results.length,
        query
      }
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

export default router;
