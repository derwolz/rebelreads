import { 
  Follower, 
  BookImpression, 
  BookClickThrough,
  Book
} from "@shared/schema";
import { 
  followers, 
  bookImpressions, 
  bookClickThroughs, 
  books, 
  ratings 
} from "@shared/schema";
import { db } from "../db";
import { eq, and, inArray, desc, isNull, sql } from "drizzle-orm";
import { calculateWeightedRating } from "@shared/schema";
import { BaseStorage } from "./base";
import { format } from "date-fns";

export interface ISocialStorage {
  // Following operations
  followAuthor(followerId: number, authorId: number): Promise<Follower>;
  unfollowAuthor(followerId: number, authorId: number): Promise<void>;
  isFollowing(followerId: number, authorId: number): Promise<boolean>;
  getFollowerCount(authorId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;
  getFollowerMetrics(authorId: number, days: number): Promise<{
    follows: Array<{ date: string; count: number }>;
    unfollows: Array<{ date: string; count: number }>;
  }>;

  // Book metrics
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

  // Author analytics
  getAuthorGenres(authorId: number): Promise<{ genre: string; count: number }[]>;
  getAuthorAggregateRatings(authorId: number): Promise<{
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  } | null>;
  getFollowedAuthorsBooks(userId: number): Promise<Book[]>;
}

export class SocialStorage extends BaseStorage implements ISocialStorage {
  async followAuthor(followerId: number, authorId: number): Promise<Follower> {
    const [follower] = await db
      .insert(followers)
      .values({ followerId, followingId: authorId })
      .returning();
    return follower;
  }

  async unfollowAuthor(followerId: number, authorId: number): Promise<void> {
    await db
      .update(followers)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(followers.followerId, followerId),
          eq(followers.followingId, authorId),
          isNull(followers.deletedAt),
        ),
      );
  }

  async isFollowing(followerId: number, authorId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, followerId),
          eq(followers.followingId, authorId),
          isNull(followers.deletedAt),
        ),
      );
    return !!result;
  }

  async getFollowerCount(authorId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(followers)
      .where(
        and(eq(followers.followingId, authorId), isNull(followers.deletedAt)),
      );
    return result?.count || 0;
  }

  async getFollowingCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(followers)
      .where(
        and(eq(followers.followerId, userId), isNull(followers.deletedAt)),
      );
    return result?.count || 0;
  }

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

  async getAuthorGenres(
    authorId: number,
  ): Promise<{ genre: string; count: number }[]> {
    const authorBooks = await db
      .select()
      .from(books)
      .where(eq(books.authorId, authorId));

    const genreCounts = new Map<string, number>();

    authorBooks.forEach((book) => {
      book.genres.forEach((genre) => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    });

    return Array.from(genreCounts.entries())
      .map(([genre, count]) => ({
        genre,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getAuthorAggregateRatings(authorId: number): Promise<{
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  } | null> {
    const authorBooks = await db
      .select()
      .from(books)
      .where(eq(books.authorId, authorId));
    
    const bookIds = authorBooks.map((book) => book.id);

    if (bookIds.length === 0) return null;

    const allRatings = await db
      .select()
      .from(ratings)
      .where(inArray(ratings.bookId, bookIds));

    if (allRatings.length === 0) return null;

    return {
      overall:
        allRatings.reduce((acc, r) => acc + calculateWeightedRating(r), 0) /
        allRatings.length,
      enjoyment:
        allRatings.reduce((acc, r) => acc + r.enjoyment, 0) / allRatings.length,
      writing:
        allRatings.reduce((acc, r) => acc + r.writing, 0) / allRatings.length,
      themes:
        allRatings.reduce((acc, r) => acc + r.themes, 0) / allRatings.length,
      characters:
        allRatings.reduce((acc, r) => acc + r.characters, 0) /
        allRatings.length,
      worldbuilding:
        allRatings.reduce((acc, r) => acc + r.worldbuilding, 0) /
        allRatings.length,
    };
  }

  async getFollowedAuthorsBooks(userId: number): Promise<Book[]> {
    const followedAuthors = await db
      .select({ authorId: followers.followingId })
      .from(followers)
      .where(eq(followers.followerId, userId));

    if (followedAuthors.length === 0) {
      return [];
    }

    const authorIds = followedAuthors.map((f) => f.authorId);
    return await db
      .select()
      .from(books)
      .where(inArray(books.authorId, authorIds));
  }

  async getFollowerMetrics(authorId: number, days: number): Promise<{
    follows: Array<{ date: string; count: number }>;
    unfollows: Array<{ date: string; count: number }>;
  }> {
    const [follows, unfollows] = await Promise.all([
      db
        .select({
          date: sql<string>`DATE(${followers.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(followers)
        .where(
          and(
            eq(followers.followingId, authorId),
            sql`${followers.createdAt} >= CURRENT_DATE - ${days}`,
          ),
        )
        .groupBy(sql`DATE(${followers.createdAt})`),
      db
        .select({
          date: sql<string>`DATE(${followers.deletedAt})`,
          count: sql<number>`count(*)`,
        })
        .from(followers)
        .where(
          and(
            eq(followers.followingId, authorId),
            sql`${followers.deletedAt} >= CURRENT_DATE - ${days}`,
          ),
        )
        .groupBy(sql`DATE(${followers.deletedAt})`),
    ]);

    return {
      follows: follows.map(r => ({
        date: format(new Date(r.date), 'yyyy-MM-dd'),
        count: Number(r.count),
      })),
      unfollows: unfollows.map(r => ({
        date: format(new Date(r.date), 'yyyy-MM-dd'),
        count: Number(r.count),
      })),
    };
  }
}

export const socialStorage = new SocialStorage();