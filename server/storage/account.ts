import {
  User,
  Rating,
  ReadingStatus,
  InsertUser,
  UpdateProfile,
  users,
  ratings,
  reading_status,
  followers,
  Follower,
  books,
  Book,
  rating_preferences,
  RatingPreferences,
  replies,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, inArray, ilike, desc, isNull, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "../db";
import { subDays, format } from "date-fns";

const PostgresSessionStore = connectPg(session);

export interface IAccountStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<UpdateProfile>): Promise<User>;
  toggleAuthorStatus(id: number): Promise<User>;

  getRatings(bookId: number): Promise<Rating[]>;
  createRating(rating: Omit<Rating, "id">): Promise<Rating>;
  getUserRatings(userId: number): Promise<Rating[]>;
  
  getReplies(reviewId: number): Promise<any[]>;
  createReply(reviewId: number, authorId: number, content: string): Promise<any>;

  getReadingStatus(
    userId: number,
    bookId: number,
  ): Promise<ReadingStatus | undefined>;
  toggleWishlist(userId: number, bookId: number): Promise<ReadingStatus>;
  markAsCompleted(userId: number, bookId: number): Promise<ReadingStatus>;
  getWishlistedBooks(userId: number): Promise<Book[]>;
  getCompletedBooks(userId: number): Promise<Book[]>;

  followAuthor(followerId: number, authorId: number): Promise<Follower>;
  unfollowAuthor(followerId: number, authorId: number): Promise<void>;
  isFollowing(followerId: number, authorId: number): Promise<boolean>;
  getFollowerCount(authorId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;

  getRatingPreferences(userId: number): Promise<RatingPreferences | undefined>;
  saveRatingPreferences(userId: number, criteriaOrder: string[], criteriaWeights?: Record<string, number>): Promise<RatingPreferences>;
  
  getFollowerMetrics(
    authorId: number,
    days: number,
  ): Promise<{
    follows: Array<{ date: string; count: number }>;
    unfollows: Array<{ date: string; count: number }>;
  }>;
}

export class AccountStorage implements IAccountStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<UpdateProfile>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async toggleAuthorStatus(id: number): Promise<User> {
    const user = await this.getUser(id);
    const [updatedUser] = await db
      .update(users)
      .set({ isAuthor: !user?.isAuthor })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getRatings(bookId: number): Promise<Rating[]> {
    return await db
      .select({
        id: ratings.id,
        userId: ratings.userId,
        bookId: ratings.bookId,
        enjoyment: ratings.enjoyment,
        writing: ratings.writing,
        themes: ratings.themes,
        characters: ratings.characters,
        worldbuilding: ratings.worldbuilding,
        review: ratings.review,
        analysis: ratings.analysis,
        createdAt: ratings.createdAt,
        featured: ratings.featured,
        report_status: ratings.report_status,
        report_reason: ratings.report_reason,
      })
      .from(ratings)
      .where(eq(ratings.bookId, bookId));
  }

  async getFollowerMetrics(authorId: number, days: number = 30) {
    const startDate = subDays(new Date(), days);

    // Get daily follow counts
    const follows = await db
      .select({
        date: sql<string>`DATE(${followers.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(followers)
      .where(
        and(
          eq(followers.followingId, authorId),
          sql`${followers.createdAt} >= ${startDate}`,
          sql`${followers.deletedAt} IS NULL`,
        ),
      )
      .groupBy(sql`DATE(${followers.createdAt})`);

    // Get daily unfollow counts
    const unfollows = await db
      .select({
        date: sql<string>`DATE(${followers.deletedAt})`,
        count: sql<number>`count(*)`,
      })
      .from(followers)
      .where(
        and(
          eq(followers.followingId, authorId),
          sql`${followers.deletedAt} >= ${startDate}`,
          sql`${followers.deletedAt} IS NOT NULL`,
        ),
      )
      .groupBy(sql`DATE(${followers.deletedAt})`);

    // Generate all dates in range and ensure 0 counts for missing dates
    const dateRange = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      dateRange.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create final response with 0s for missing dates
    const followsMap = new Map(follows.map((f) => [f.date, f.count]));
    const unfollowsMap = new Map(unfollows.map((u) => [u.date, u.count]));

    return {
      follows: dateRange.map((date) => ({
        date,
        count: followsMap.get(date) || 0,
      })),
      unfollows: dateRange.map((date) => ({
        date,
        count: unfollowsMap.get(date) || 0,
      })),
    };
  }

  async createRating(rating: Omit<Rating, "id">): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getUserRatings(userId: number): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt));
  }

  async getReadingStatus(
    userId: number,
    bookId: number,
  ): Promise<ReadingStatus | undefined> {
    const [status] = await db
      .select()
      .from(reading_status)
      .where(
        and(
          eq(reading_status.userId, userId),
          eq(reading_status.bookId, bookId),
        ),
      );
    return status;
  }

  async toggleWishlist(userId: number, bookId: number): Promise<ReadingStatus> {
    const existingStatus = await this.getReadingStatus(userId, bookId);

    if (existingStatus) {
      const [updated] = await db
        .update(reading_status)
        .set({ isWishlisted: !existingStatus.isWishlisted })
        .where(eq(reading_status.id, existingStatus.id))
        .returning();
      return updated;
    }

    const [status] = await db
      .insert(reading_status)
      .values({ userId, bookId, isWishlisted: true })
      .returning();
    return status;
  }

  async markAsCompleted(
    userId: number,
    bookId: number,
  ): Promise<ReadingStatus> {
    const existingStatus = await this.getReadingStatus(userId, bookId);

    if (existingStatus) {
      const [updated] = await db
        .update(reading_status)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          isWishlisted: false,
        })
        .where(eq(reading_status.id, existingStatus.id))
        .returning();
      return updated;
    }

    const [status] = await db
      .insert(reading_status)
      .values({
        userId,
        bookId,
        isCompleted: true,
        completedAt: new Date(),
      })
      .returning();
    return status;
  }

  async getWishlistedBooks(userId: number): Promise<Book[]> {
    const wishlistedBooks = await db
      .select({
        books: books,
      })
      .from(books)
      .innerJoin(
        reading_status,
        and(
          eq(reading_status.bookId, books.id),
          eq(reading_status.userId, userId),
          eq(reading_status.isWishlisted, true),
        ),
      );
    return wishlistedBooks.map(({ books }) => books);
  }

  async getCompletedBooks(userId: number): Promise<Book[]> {
    const completedBooks = await db
      .select({
        books: books,
      })
      .from(books)
      .innerJoin(
        reading_status,
        and(
          eq(reading_status.bookId, books.id),
          eq(reading_status.userId, userId),
          eq(reading_status.isCompleted, true),
        ),
      );
    return completedBooks.map(({ books }) => books);
  }

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

  async getRatingPreferences(userId: number): Promise<RatingPreferences | undefined> {
    const preferences = await db
      .select()
      .from(rating_preferences)
      .where(eq(rating_preferences.userId, userId));
    
    return preferences[0];
  }

  async saveRatingPreferences(userId: number, criteriaOrder: string[], criteriaWeights?: Record<string, number>): Promise<RatingPreferences> {
    console.log(`Storage: saveRatingPreferences called for user ${userId} with order:`, criteriaOrder);
    
    // Generate weights if not provided
    if (!criteriaWeights) {
      const positionWeights = [0.35, 0.25, 0.20, 0.12, 0.08]; // Weights by position
      criteriaWeights = {};
      
      // Assign weights based on position in the criteria order
      criteriaOrder.forEach((criterion, index) => {
        criteriaWeights![criterion] = positionWeights[index];
      });
    }
    
    console.log(`Storage: Using criteria weights:`, criteriaWeights);
    console.log(`Storage: JSON stringified weights:`, JSON.stringify(criteriaWeights));
    
    // Check if preferences already exist
    const existing = await this.getRatingPreferences(userId);
    console.log("Storage: existing preferences:", existing);
    
    try {
      if (existing) {
        console.log("Storage: updating existing preferences");
        // Update existing
        
        // Explicitly create the data object to update
        const dataToUpdate = { 
          criteriaOrder,
          criteriaWeights,
          updatedAt: new Date()
        };
        console.log("Storage: data to update:", JSON.stringify(dataToUpdate));
        
        const [updated] = await db
          .update(rating_preferences)
          .set(dataToUpdate)
          .where(eq(rating_preferences.userId, userId))
          .returning();
        
        console.log("Storage: updated preferences returned from DB:", updated ? JSON.stringify(updated) : "null");
        
        if (!updated) {
          console.error("Storage: update didn't return any data");
          
          // Let's check if the row still exists
          const checkResult = await db
            .select()
            .from(rating_preferences)
            .where(eq(rating_preferences.userId, userId));
          
          console.log("Storage: check if row exists after update:", checkResult.length > 0 ? "Yes" : "No");
          
          if (checkResult.length > 0) {
            console.log("Storage: row data after update:", JSON.stringify(checkResult[0]));
            return checkResult[0];
          }
        }
        
        // Mark onboarding as complete if not already
        const user = await this.getUser(userId);
        if (user && !user.hasCompletedOnboarding) {
          await db
            .update(users)
            .set({ hasCompletedOnboarding: true })
            .where(eq(users.id, userId));
        }
        
        return updated;
      } else {
        console.log("Storage: creating new preferences");
        // Create new
        
        // Explicitly create the data object to insert
        const dataToInsert = {
          userId,
          criteriaOrder,
          criteriaWeights
        };
        console.log("Storage: data to insert:", JSON.stringify(dataToInsert));
        
        const [created] = await db
          .insert(rating_preferences)
          .values(dataToInsert)
          .returning();
        
        console.log("Storage: created preferences returned from DB:", created ? JSON.stringify(created) : "null");
        
        if (!created) {
          console.error("Storage: insert didn't return any data");
          
          // Let's check if the row was actually created
          const checkResult = await db
            .select()
            .from(rating_preferences)
            .where(eq(rating_preferences.userId, userId));
          
          console.log("Storage: check if row exists after insert:", checkResult.length > 0 ? "Yes" : "No");
          
          if (checkResult.length > 0) {
            console.log("Storage: row data after insert:", JSON.stringify(checkResult[0]));
            return checkResult[0];
          }
        }
        
        // Mark onboarding as complete
        await db
          .update(users)
          .set({ hasCompletedOnboarding: true })
          .where(eq(users.id, userId));
        
        return created;
      }
    } catch (error) {
      console.error("Storage: Error saving preferences:", error);
      console.error("Storage: Error details:", error instanceof Error ? error.message : String(error));
      console.error("Storage: Error stack:", error instanceof Error ? error.stack : "No stack available");
      
      // If there's an error, let's try a direct query as a fallback
      try {
        console.log("Storage: trying fallback direct SQL query");
        
        // Convert criteriaOrder and criteriaWeights to JSON
        const criteriaOrderJson = JSON.stringify(criteriaOrder);
        const criteriaWeightsJson = JSON.stringify(criteriaWeights || {});
        
        if (existing) {
          // Update using SQL
          const result = await db.execute(sql`
            UPDATE rating_preferences 
            SET 
              criteria_order = ${criteriaOrderJson}::jsonb,
              criteria_weights = ${criteriaWeightsJson}::jsonb,
              updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING *
          `);
          
          console.log("Storage: SQL update result:", result.rows.length > 0 ? "Success" : "No rows updated");
          
          if (result.rows.length > 0) {
            return result.rows[0] as RatingPreferences;
          }
        } else {
          // Insert using SQL
          const result = await db.execute(sql`
            INSERT INTO rating_preferences (user_id, criteria_order, criteria_weights, created_at, updated_at)
            VALUES (${userId}, ${criteriaOrderJson}::jsonb, ${criteriaWeightsJson}::jsonb, NOW(), NOW())
            RETURNING *
          `);
          
          console.log("Storage: SQL insert result:", result.rows.length > 0 ? "Success" : "No rows inserted");
          
          if (result.rows.length > 0) {
            return result.rows[0] as RatingPreferences;
          }
        }
      } catch (sqlError) {
        console.error("Storage: Fallback SQL query failed:", sqlError);
      }
      
      throw error;
    }
  }
  
  async getReplies(reviewId: number): Promise<any[]> {
    return await db
      .select()
      .from(replies)
      .where(eq(replies.reviewId, reviewId))
      .orderBy(desc(replies.createdAt));
  }
  
  async createReply(reviewId: number, authorId: number, content: string): Promise<any> {
    const [reply] = await db
      .insert(replies)
      .values({
        reviewId,
        authorId,
        content
      })
      .returning();
    return reply;
  }
}
