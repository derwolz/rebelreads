import {
  BookImpression,
  BookClickThrough,
  bookImpressions,
  bookClickThroughs,
  books,
  followers
} from "@shared/schema";
import { db } from "../db";
import { eq, and, inArray, sql, isNull } from "drizzle-orm";
import { subDays, format } from "date-fns";

export interface IAnalyticsStorage {
  recordBookImpression(
    bookId: number,
    userId: number | null,
    source: string,
    context: string,
  ): Promise<BookImpression>;
  recordBookClickThrough(
    bookId: number,
    userId: number | null,
    source: string,
    referrer: string,
  ): Promise<BookClickThrough>;
  updateBookStats(bookId: number, type: "impression" | "click"): Promise<void>;
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
}

export class AnalyticsStorage implements IAnalyticsStorage {
  async recordBookImpression(
    bookId: number,
    userId: number | null,
    source: string,
    context: string,
  ): Promise<BookImpression> {
    const [impression] = await db
      .insert(bookImpressions)
      .values({ bookId, userId, source, context })
      .returning();

    await this.updateBookStats(bookId, "impression");
    return impression;
  }

  async recordBookClickThrough(
    bookId: number,
    userId: number | null,
    source: string,
    referrer: string,
  ): Promise<BookClickThrough> {
    const [clickThrough] = await db
      .insert(bookClickThroughs)
      .values({ bookId, userId, source, referrer })
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

  async getBooksMetrics(
    bookIds: number[],
    days: number = 30,
    metrics: ("impressions" | "clicks" | "ctr")[] = ["impressions", "clicks"]
  ): Promise<{
    date: string;
    book:book;
    impressions:number;

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
}