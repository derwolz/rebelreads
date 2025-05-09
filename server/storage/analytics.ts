import {
  BookImpression,
  BookClickThrough,
  bookImpressions,
  bookClickThroughs,
  books,
  followers,
  popularBooks,
  PopularBook,
  InsertPopularBook
} from "@shared/schema";
import { db } from "../db";
import { eq, and, inArray, sql, isNull, desc, asc, gt, like } from "drizzle-orm";
import { subDays, format, addDays } from "date-fns";

export interface IAnalyticsStorage {
  recordBookImpression(
    bookId: number,
    userId: number | null,
    source: string,
    context: string,
    type?: string,
    weight?: number,
    position?: number,
    container_type?: string,
    container_id?: string,
    metadata?: Record<string, any>,
  ): Promise<BookImpression>;
  recordBookClickThrough(
    bookId: number,
    userId: number | null,
    source: string,
    referrer: string,
    position?: number,
    container_type?: string,
    container_id?: string,
    metadata?: Record<string, any>,
  ): Promise<BookClickThrough>;
  updateBookStats(bookId: number, type: "impression" | "click"): Promise<void>;
  getBookImpressions(bookId: number): Promise<BookImpression[]>;
  getBookClickThroughs(bookId: number): Promise<BookClickThrough[]>;
  getBooksMetrics(
    bookIds: number[],
    days?: number,
    metrics?: ("impressions" | "clicks" | "ctr")[]
  ): Promise<{
    date: string;
    metrics: {
      [key: string]: number;
    };
  }[]>;
  getFollowerMetrics(authorId: number, days: number): Promise<{
    follows: Array<{ date: string; count: number }>;
    unfollows: Array<{ date: string; count: number }>;
  }>;
  calculatePopularBooks(): Promise<void>;
  getPopularBooks(limit?: number): Promise<PopularBook[]>;
}

export class AnalyticsStorage implements IAnalyticsStorage {
  async recordBookImpression(
    bookId: number,
    userId: number | null,
    source: string,
    context: string,
    type: string = "view",
    weight: number = 1.0,
    position?: number,
    container_type?: string,
    container_id?: string,
    metadata?: Record<string, any>
  ): Promise<BookImpression> {
    // Convert weight to string for decimal column
    const weightStr = weight.toString();
    
    const [impression] = await db
      .insert(bookImpressions)
      .values({ 
        bookId, 
        userId, 
        source, 
        context,
        type,
        weight: weightStr,
        position,
        container_type,
        container_id,
        metadata: metadata ? JSON.stringify(metadata) : null
      })
      .returning();

    await this.updateBookStats(bookId, "impression");
    return impression;
  }

  async recordBookClickThrough(
    bookId: number,
    userId: number | null,
    source: string,
    referrer: string,
    position?: number,
    container_type?: string,
    container_id?: string,
    metadata?: Record<string, any>
  ): Promise<BookClickThrough> {
    const [clickThrough] = await db
      .insert(bookClickThroughs)
      .values({ 
        bookId, 
        userId, 
        source, 
        referrer,
        position,
        container_type,
        container_id,
        metadata: metadata ? JSON.stringify(metadata) : null
      })
      .returning();

    await this.updateBookStats(bookId, "click");
    return clickThrough;
  }

  async updateBookStats(
    bookId: number,
    type: "impression" | "click",
  ): Promise<void> {
    const now = new Date();
    if (type === "impression") {
      await db
        .update(books)
        .set({
          impressionCount: sql`${books.impressionCount} + 1`,
          lastImpressionAt: now,
        })
        .where(eq(books.id, bookId));
    } else {
      await db
        .update(books)
        .set({
          clickThroughCount: sql`${books.clickThroughCount} + 1`,
          lastClickThroughAt: now,
        })
        .where(eq(books.id, bookId));
    }
  }
  
  async getBookImpressions(bookId: number): Promise<BookImpression[]> {
    return db
      .select()
      .from(bookImpressions)
      .where(eq(bookImpressions.bookId, bookId));
  }
  
  async getBookClickThroughs(bookId: number): Promise<BookClickThrough[]> {
    return db
      .select()
      .from(bookClickThroughs)
      .where(eq(bookClickThroughs.bookId, bookId));
  }

  async getBooksMetrics(
    bookIds: number[],
    days: number = 30,
    metrics: ("impressions" | "clicks" | "ctr")[] = ["impressions", "clicks"]
  ): Promise<{
    date: string;
    metrics: {
      [key: string]: number;
    };
  }[]> {
    const startDate = subDays(new Date(), days);

    const result = await db.transaction(async (tx) => {
      // Get daily impressions if requested
      const impressionsPromise = metrics.includes("impressions") || metrics.includes("ctr")
        ? tx
            .select({
              bookId: bookImpressions.bookId,
              date: sql<string>`DATE(${bookImpressions.timestamp})`,
              count: sql<number>`count(*)`,
            })
            .from(bookImpressions)
            .where(
              and(
                inArray(bookImpressions.bookId, bookIds),
                sql`${bookImpressions.timestamp} > ${startDate}`
              )
            )
            .groupBy(bookImpressions.bookId, sql`DATE(${bookImpressions.timestamp})`)
        : Promise.resolve([]);

      // Get daily clicks if requested
      const clicksPromise = metrics.includes("clicks") || metrics.includes("ctr")
        ? tx
            .select({
              bookId: bookClickThroughs.bookId,
              date: sql<string>`DATE(${bookClickThroughs.timestamp})`,
              count: sql<number>`count(*)`,
            })
            .from(bookClickThroughs)
            .where(
              and(
                inArray(bookClickThroughs.bookId, bookIds),
                sql`${bookClickThroughs.timestamp} > ${startDate}`
              )
            )
            .groupBy(bookClickThroughs.bookId, sql`DATE(${bookClickThroughs.timestamp})`)
        : Promise.resolve([]);

      const [impressions, clicks] = await Promise.all([
        impressionsPromise,
        clicksPromise,
      ]);

      // Create a map of all dates in the range
      const dateMap = new Map<string, { [key: string]: number }>();
      const currentDate = new Date(startDate);
      const endDate = new Date();

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dateMap.set(dateStr, {});
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Fill in the metrics
      bookIds.forEach((bookId) => {
        // Process impressions
        if (metrics.includes("impressions") || metrics.includes("ctr")) {
          impressions
            .filter((imp) => imp.bookId === bookId)
            .forEach((imp) => {
              const dateMetrics = dateMap.get(imp.date) || {};
              dateMetrics[`Book ${bookId}_impressions`] = imp.count;
              dateMap.set(imp.date, dateMetrics);
            });
        }

        // Process clicks
        if (metrics.includes("clicks") || metrics.includes("ctr")) {
          clicks
            .filter((click) => click.bookId === bookId)
            .forEach((click) => {
              const dateMetrics = dateMap.get(click.date) || {};
              dateMetrics[`Book ${bookId}_clicks`] = click.count;
              dateMap.set(click.date, dateMetrics);
            });
        }

        // Calculate CTR if requested
        if (metrics.includes("ctr")) {
          dateMap.forEach((dateMetrics, date) => {
            const impressionCount = dateMetrics[`Book ${bookId}_impressions`] || 0;
            const clickCount = dateMetrics[`Book ${bookId}_clicks`] || 0;
            dateMetrics[`Book ${bookId}_ctr`] = impressionCount > 0
              ? (clickCount / impressionCount) * 100
              : 0;
          });
        }
      });

      return Array.from(dateMap.entries()).map(([date, metrics]) => ({
        date,
        metrics
      }));
    });

    return result;
  }

  async getFollowerMetrics(authorId: number, days: number): Promise<{
    follows: Array<{ date: string; count: number }>;
    unfollows: Array<{ date: string; count: number }>;
  }> {
    const startDate = subDays(new Date(), days);

    // Get new follows
    const follows = await db
      .select({
        date: sql<string>`DATE(${followers.createdAt})`.as('date'),
        count: sql<number>`count(*)`.as('count'),
      })
      .from(followers)
      .where(
        and(
          eq(followers.followingId, authorId),
          isNull(followers.deletedAt),
          sql`${followers.createdAt} > ${startDate}`
        )
      )
      .groupBy(sql`DATE(${followers.createdAt})`);

    // Get unfollows
    const unfollows = await db
      .select({
        date: sql<string>`DATE(${followers.deletedAt})`.as('date'),
        count: sql<number>`count(*)`.as('count'),
      })
      .from(followers)
      .where(
        and(
          eq(followers.followingId, authorId),
          sql`${followers.deletedAt} IS NOT NULL`,
          sql`${followers.deletedAt} > ${startDate}`
        )
      )
      .groupBy(sql`DATE(${followers.deletedAt})`);

    return {
      follows: follows.map(f => ({
        date: format(new Date(f.date), 'yyyy-MM-dd'),
        count: Number(f.count)
      })),
      unfollows: unfollows.map(u => ({
        date: format(new Date(u.date), 'yyyy-MM-dd'),
        count: Number(u.count)
      }))
    };
  }

  /**
   * Calculate popular books using a sigmoid function with a threshold of 14 days
   * This function should be run daily at 00:00:00 GMT
   * Uses weighted engagements only:
   * - detail-expand (hover): 0.25
   * - card-click: 0.5
   * - referral-click: 1.0
   * - view impressions: 0.0 (explicitly excluded from calculation)
   */
  async calculatePopularBooks(): Promise<void> {
    try {
      // Get current date for calculation
      const now = new Date();
      const threshold = 14; // 14 days threshold

      // Get books with meaningful interaction counts for ranking
      const bookIds = await db
        .select({
          id: books.id,
        })
        .from(books)
        .where(
          and(
            gt(books.impressionCount, 0),
            gt(books.clickThroughCount, 0)
          )
        )
        .limit(100) // Consider top 100 books with both impressions and clicks
        .then(result => result.map(book => book.id));
      
      if (bookIds.length === 0) {
        console.log('No books with impressions and clicks found');
        return;
      }
      
      // Get weighted impressions for each book, but only count engagement types (detail-expand, card-click)
      // Exclude 'view' type impressions (weight = 0) as they are not engagements
      const weightedImpressions = await db
        .select({
          bookId: bookImpressions.bookId,
          // Sum the weight values for impressions, only for engagement types
          totalWeightedImpressions: sql<string>`SUM(
            CASE 
              WHEN ${bookImpressions.type} = 'view' THEN 0
              ELSE ${bookImpressions.weight}
            END
          )`,
        })
        .from(bookImpressions)
        .where(inArray(bookImpressions.bookId, bookIds))
        .groupBy(bookImpressions.bookId);
      
      // Create a map for impression weights
      const impressionWeightMap = new Map<number, number>();
      weightedImpressions.forEach(record => {
        impressionWeightMap.set(
          record.bookId, 
          parseFloat(record.totalWeightedImpressions)
        );
      });

      // Get referral click-throughs (still highest weighted)
      const clickThroughResults = await db
        .select({
          bookId: bookClickThroughs.bookId,
          totalClicks: sql<number>`count(*)`,
        })
        .from(bookClickThroughs)
        .where(
          and(
            inArray(bookClickThroughs.bookId, bookIds),
            like(bookClickThroughs.source, 'referral_%')
          )
        )
        .groupBy(bookClickThroughs.bookId);
      
      // Create a map for referral clicks
      const clicksMap = new Map<number, number>();
      clickThroughResults.forEach(record => {
        clicksMap.set(record.bookId, record.totalClicks);
      });
      
      // Get book data for calculating sigmoid
      const bookData = await db
        .select({
          id: books.id,
          impressionCount: books.impressionCount,
          clickThroughCount: books.clickThroughCount,
        })
        .from(books)
        .where(inArray(books.id, bookIds));
      
      // Get existing popular books for rank comparison and first ranked date
      const existingPopularBooks = await db
        .select()
        .from(popularBooks)
        .where(eq(popularBooks.isActive, true));
      
      // Create a map for easy lookup
      const existingPopularBooksMap = new Map<number, PopularBook>();
      existingPopularBooks.forEach(book => {
        existingPopularBooksMap.set(book.bookId, book);
      });
      
      // Calculate sigmoid values for each book
      const scoreData = bookData.map(book => {
        // Get weighted impressions (only engagement types, not 'view') and referral clicks
        const weightedImpressionValue = impressionWeightMap.get(book.id) || 0;
        const referralClicks = clicksMap.get(book.id) || 0;
        
        // Combined weighted interaction score (engagement impressions + referral clicks)
        // Only counts detail-expand (0.25), card-click (0.5), and referral clicks (1.0)
        // Regular 'view' impressions have a weight of 0
        const totalWeightedInteractions = weightedImpressionValue + referralClicks;
        
        const existingPopular = existingPopularBooksMap.get(book.id);
        let firstRankedAt = now;
        
        if (existingPopular) {
          firstRankedAt = existingPopular.firstRankedAt;
        }
        
        // Calculate days since first ranked
        const daysSinceFirstRanked = Math.max(
          0, 
          (now.getTime() - firstRankedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Sigmoid function: 1 / (1 + e^((days_since_first_ranked - threshold) / 2))
        const sigmoidDecay = 1 / (1 + Math.exp((daysSinceFirstRanked - threshold) / 2));
        
        // Final score is weighted interactions * sigmoidDecay
        const score = totalWeightedInteractions * sigmoidDecay;
        
        return {
          bookId: book.id,
          totalImpressions: book.impressionCount,
          totalClickThroughs: book.clickThroughCount,
          weightedImpressions: weightedImpressionValue,
          referralClicks: referralClicks,
          totalWeightedInteractions: totalWeightedInteractions,
          sigmoidValue: score,
          firstRankedAt: firstRankedAt,
        };
      });
      
      // Sort by sigmoid value and take top 10
      const topBooks = scoreData
        .sort((a, b) => b.sigmoidValue - a.sigmoidValue)
        .slice(0, 10);
      
      // Begin transaction to update popular books
      await db.transaction(async (tx) => {
        // Set all current entries to inactive
        await tx
          .update(popularBooks)
          .set({ isActive: false })
          .where(eq(popularBooks.isActive, true));
        
        // Insert new entries
        for (let i = 0; i < topBooks.length; i++) {
          const book = topBooks[i];
          const sigmoidValueStr = book.sigmoidValue.toString(); // Convert to string for decimal column
          
          await tx.insert(popularBooks).values({
            bookId: book.bookId,
            totalImpressions: book.totalImpressions,
            totalClickThroughs: book.totalClickThroughs,
            sigmoidValue: sigmoidValueStr,
            rank: i + 1,
            isActive: true,
            firstRankedAt: book.firstRankedAt,
            calculatedAt: new Date()
          });
        }
      });
      
      console.log(`Calculated popular books - ${topBooks.length} entries updated`);
    } catch (error) {
      console.error("Error calculating popular books:", error);
      throw error;
    }
  }

  /**
   * Retrieves the current active popular books
   * @param limit Maximum number of books to return, defaults to 10
   */
  async getPopularBooks(limit: number = 10): Promise<PopularBook[]> {
    try {
      return db
        .select()
        .from(popularBooks)
        .where(eq(popularBooks.isActive, true))
        .orderBy(asc(popularBooks.rank))
        .limit(limit);
    } catch (error) {
      console.error("Error getting popular books:", error);
      return [];
    }
  }
}