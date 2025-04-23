import { Router, Request, Response } from "express";
import { db } from "../../db";
import { bookImpressions, referralClicks } from "@shared/schema";
import { and, eq, sql, count, desc, inArray, like, isNotNull } from "drizzle-orm";

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
    
    // LEGACY: Query for old referral clicks still in bookImpressions table (backwards compatibility)
    const legacyReferralsByContext = await db
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
    
    // NEW: Query for referral source data by origin context (where clicks came from)
    const newReferralsBySource = await db
      .select({
        sourceContext: referralClicks.sourceContext,
        count: count(),
      })
      .from(referralClicks)
      .where(
        bookIds.length > 0 ? inArray(referralClicks.bookId, bookIds) : sql`1=1`
      )
      .groupBy(referralClicks.sourceContext)
      .orderBy(desc(count()))
      .execute();
    
    // NEW: Query for domain data (actual destination domains)
    const domainData = await db
      .select({
        targetDomain: referralClicks.targetDomain,
        targetSubdomain: referralClicks.targetSubdomain,
        count: count(),
      })
      .from(referralClicks)
      .where(
        bookIds.length > 0 ? inArray(referralClicks.bookId, bookIds) : sql`1=1`
      )
      .groupBy(referralClicks.targetDomain, referralClicks.targetSubdomain)
      .orderBy(desc(count()))
      .execute();
    
    // Process domain data to include full domain (domain + subdomain if present)
    const processedDomains = domainData.map(item => {
      let displayDomain = item.targetDomain;
      if (item.targetSubdomain) {
        displayDomain = `${item.targetSubdomain}.${item.targetDomain}`;
      }
      
      return {
        name: displayDomain,
        domain: item.targetDomain,
        subdomain: item.targetSubdomain,
        count: Number(item.count),
      };
    });
    
    // NEW: Query for retailer name data
    const retailerData = await db
      .select({
        retailerName: referralClicks.retailerName,
        count: count(),
      })
      .from(referralClicks)
      .where(
        bookIds.length > 0 ? inArray(referralClicks.bookId, bookIds) : sql`1=1`
      )
      .groupBy(referralClicks.retailerName)
      .orderBy(desc(count()))
      .execute();
    
    // Process retailer data
    const processedRetailers = retailerData.map(item => {
      return {
        name: item.retailerName,
        count: Number(item.count),
      };
    });
    
    // LEGACY (for backwards compatibility)
    // Process domain data from metadata in old bookImpressions table
    const legacyReferralsByDomain = await db
      .select({
        metadata: bookImpressions.metadata,
        count: count(),
      })
      .from(bookImpressions)
      .where(
        and(
          eq(bookImpressions.type, "referral-click"),
          isNotNull(bookImpressions.metadata),
          bookIds.length > 0 ? inArray(bookImpressions.bookId, bookIds) : sql`1=1`
        )
      )
      .groupBy(bookImpressions.metadata)
      .orderBy(desc(count()))
      .execute();
    
    // Process legacy domain data from metadata
    const legacyProcessedDomains = legacyReferralsByDomain.map(item => {
      let domain = "Unknown";
      try {
        const metadata = item.metadata as any;
        if (metadata && metadata.referralDomain) {
          domain = metadata.referralDomain;
        }
      } catch (e) {
        console.error("Error parsing referral domain metadata:", e);
      }
      
      return {
        name: domain,
        count: Number(item.count),
      };
    });
    
    // LEGACY (for backwards compatibility)
    // Query to get old referral source data by source string (retailer name)
    const legacyReferralsBySource = await db
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
    
    // Process legacy source data to extract retailer information
    const legacyProcessedSources = legacyReferralsBySource.map(item => {
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
    
    // Combine all sources of data with new data taking precedence
    const combinedBySource = [...processedRetailers, ...legacyProcessedSources];
    const combinedByDomain = [...processedDomains, ...legacyProcessedDomains];
    
    // Convert legacy context data and new source context data to same format
    const byContextData = [
      ...newReferralsBySource.map(item => ({
        name: item.sourceContext,
        count: Number(item.count)
      })),
      ...legacyReferralsByContext.map(item => ({
        name: item.context,
        count: Number(item.count)
      }))
    ];
    
    // Return the combined data
    return res.json({
      byContext: byContextData,
      bySource: combinedBySource,
      byDomain: combinedByDomain,
    });
  } catch (error) {
    console.error("Error fetching referral sources:", error);
    return res.status(500).json({ error: "Failed to fetch referral sources" });
  }
});

export default router;