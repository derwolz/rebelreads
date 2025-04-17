import { Router, Request, Response } from "express";
import { db } from "../db";
import { 
  books, 
  authors, 
  bookGenreTaxonomies, 
  bookImages,
  genreTaxonomies,
  viewGenres,
  userBlocks,
  userGenreViews
} from "@shared/schema";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

const router = Router();

/**
 * Get the taxonomically closest books to a specific view
 * This route returns the top 150 books that match the taxonomies of a genre view
 * Books are ranked by taxonomic similarity to the view
 */
router.get("/genre/:viewId", async (req: Request, res: Response) => {
  try {
    const viewId = parseInt(req.params.viewId);
    const userId = req.user?.id;
    const limit = 150; // Return up to 150 top matches
    
    if (isNaN(viewId)) {
      return res.status(400).json({ error: "Invalid view ID" });
    }
    
    console.log(`Finding taxonomically similar books for view ID: ${viewId}`);
    
    // 1. Get the genre view information
    const viewResult = await db.select()
      .from(userGenreViews)
      .where(eq(userGenreViews.id, viewId))
      .limit(1);
    
    if (viewResult.length === 0) {
      return res.status(404).json({ error: "Genre view not found" });
    }
    
    // 2. Get all taxonomy IDs associated with this view
    const viewTaxonomiesResult = await db.select({
      taxonomyId: viewGenres.taxonomyId,
      rank: viewGenres.rank,
      type: viewGenres.type,
      name: genreTaxonomies.name,
      category: genreTaxonomies.type,
    })
    .from(viewGenres)
    .innerJoin(genreTaxonomies, eq(viewGenres.taxonomyId, genreTaxonomies.id))
    .where(eq(viewGenres.viewId, viewId))
    .orderBy(viewGenres.rank);
    
    if (!viewTaxonomiesResult || viewTaxonomiesResult.length === 0) {
      console.log(`No taxonomies found for view ID: ${viewId}`);
      return res.json([]);
    }
    
    const taxonomyIds = viewTaxonomiesResult.map((t) => t.taxonomyId);
    
    // 3. Create a map of taxonomy importance based on rank
    // We'll use a formula of 1/(1+ln(rank)) to give more weight to higher-ranked taxonomies
    const taxonomyImportance: Record<number, number> = {};
    viewTaxonomiesResult.forEach((taxonomy, index) => {
      const rank = taxonomy.rank || (index + 1);
      taxonomyImportance[taxonomy.taxonomyId] = 1.0 / (1.0 + Math.log(rank));
    });
    
    console.log(`Found ${taxonomyIds.length} taxonomies for view ID: ${viewId}`);
    
    // 4. Calculate the most taxonomically similar books
    // Prepare the query with a straightforward approach
    const query = sql`
      WITH book_taxonomies AS (
        SELECT 
          bt.book_id,
          bt.taxonomy_id,
          CASE
            WHEN bt.importance IS NOT NULL THEN bt.importance
            ELSE 0.5
          END as weight
        FROM book_genre_taxonomies bt
        WHERE bt.taxonomy_id IN (${sql.join(taxonomyIds)})
      ),
      book_scores AS (
        SELECT 
          book_id,
          SUM(weight) as total_score,
          COUNT(taxonomy_id) as matching_count
        FROM book_taxonomies
        GROUP BY book_id
        ORDER BY total_score DESC, matching_count DESC
        LIMIT ${limit * 2} -- Get more than we need to account for filtering
      )
      SELECT 
        b.id,
        b.title,
        b.description,
        b.published_date,
        b.language,
        b.page_count,
        a.id as author_id,
        a.name as author_name,
        a.image_url as author_image_url,
        img.url as cover_url,
        bs.total_score,
        bs.matching_count
      FROM book_scores bs
      JOIN books b ON bs.book_id = b.id
      JOIN authors a ON b.author_id = a.id
      LEFT JOIN book_images img ON b.id = img.book_id AND img.position = 1
      WHERE b.deleted_at IS NULL
      ORDER BY bs.total_score DESC, bs.matching_count DESC
      LIMIT ${limit}
    `;
    
    const similarBooksResult = await db.execute(query);
    // Cast the result to proper format according to the database driver
    const similarBooks = similarBooksResult.rows && Array.isArray(similarBooksResult.rows) 
      ? similarBooksResult.rows 
      : [];
    
    // 5. Apply content filtering if the user is authenticated
    let filteredBooks = similarBooks;
    if (userId) {
      // Get user's content blocks
      const userBlocksResult = await db
        .select()
        .from(userBlocks)
        .where(eq(userBlocks.userId, userId));
      
      if (userBlocksResult && userBlocksResult.length > 0) {
        // Group blocks by type
        const blockedAuthors = userBlocksResult
          .filter(block => block.blockType === 'author')
          .map(block => block.blockId);
        
        const blockedBooks = userBlocksResult
          .filter(block => block.blockType === 'book')
          .map(block => block.blockId);
        
        // Apply filtering
        filteredBooks = similarBooks.filter((book: any) => {
          // Skip books by blocked authors
          if (blockedAuthors.includes(book.author_id)) {
            return false;
          }
          
          // Skip directly blocked books
          if (blockedBooks.includes(book.id)) {
            return false;
          }
          
          return true;
        });
        
        console.log(`Filtered out ${similarBooks.length - filteredBooks.length} blocked items`);
      }
    }
    
    // 6. Format the response
    const formattedBooks = filteredBooks.map((book: any) => ({
      id: book.id,
      title: book.title,
      description: book.description,
      publishedDate: book.published_date,
      language: book.language,
      pageCount: book.page_count,
      authorId: book.author_id,
      authorName: book.author_name,
      authorImageUrl: book.author_image_url,
      coverUrl: book.cover_url,
      taxonomicScore: book.total_score,
      matchingTaxonomies: book.matching_count
    }));
    
    console.log(`Returning ${formattedBooks.length} taxonomically similar books`);
    res.json(formattedBooks);
  } catch (error) {
    console.error("Error finding taxonomically similar books:", error);
    res.status(500).json({ error: "Failed to find similar books" });
  }
});

export default router;