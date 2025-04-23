import { Router, Request, Response } from "express";
import { db } from "../../db";
import { bookImpressions } from "@shared/schema";
import { and, eq, sql, count, desc, inArray, like } from "drizzle-orm";

const router = Router();

/**
 * GET /api/pro/analytics/referral-sources
 * Get aggregated referral source data for analysis
 * Requires PRO membership
 */
router.get("/referral-sources", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!req.user.isAuthor) {
    return res.status(403).json({ error: "Author access required" });
  }
  
  // Check if the user is a Pro user
  if (!req.user.isPro) {
    return res.status(403).json({ error: "Pro membership required" });
  }
  
  try {
    // Get query parameters
    const bookIds = req.query.bookIds 
      ? (req.query.bookIds as string).split(',').map(id => parseInt(id, 10)) 
      : [];
    
    // Basic validation
    if (bookIds.some(id => isNaN(id))) {
      return res.status(400).json({ error: "Invalid book ID in query" });
    }
    
    // Query to get referral source data by context (where they were sent from)
    const referralsByContext = await db
      .select({
        context: bookImpressions.context,
        count: count(),
      })
      .from(bookImpressions)
      .where(
        and(
          eq(bookImpressions.type, "referral-click"),
          bookIds.length > 0 ? inArray(bookImpressions.bookId, bookIds) : sql`1=1`
        )
      )
      .groupBy(bookImpressions.context)
      .orderBy(desc(count()))
      .execute();
    
    // Query to get referral source data by source
    const referralsBySource = await db
      .select({
        source: bookImpressions.source,
        count: count(),
      })
      .from(bookImpressions)
      .where(
        and(
          eq(bookImpressions.type, "referral-click"),
          like(bookImpressions.source, "referral_%"),  // Only get referral sources
          bookIds.length > 0 ? inArray(bookImpressions.bookId, bookIds) : sql`1=1`
        )
      )
      .groupBy(bookImpressions.source)
      .orderBy(desc(count()))
      .execute();
    
    // Process source data to extract retailer information
    const processedSources = referralsBySource.map(item => {
      // Extract retailer name from source (format: "referral_amazon_click")
      const sourceString = item.source as string;
      const parts = sourceString.split("_");
      
      // Format: "referral_[retailer]_click"
      let retailer = "Unknown";
      if (parts.length >= 2) {
        retailer = parts[1];
        // Capitalize first letter
        retailer = retailer.charAt(0).toUpperCase() + retailer.slice(1);
      }
      
      return {
        name: retailer,
        count: Number(item.count),
      };
    });
    
    // Return the data
    return res.json({
      byContext: referralsByContext.map(item => ({
        name: item.context,
        count: Number(item.count),
      })),
      bySource: processedSources,
    });
  } catch (error) {
    console.error("Error fetching referral sources:", error);
    return res.status(500).json({ error: "Failed to fetch referral sources" });
  }
});

export default router;