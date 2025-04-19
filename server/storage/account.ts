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
  userGenreViews,
  viewGenres,
  genreTaxonomies,
  UserGenreView,
  ViewGenre,
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
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<UpdateProfile>): Promise<User>;
  toggleAuthorStatus(id: number): Promise<User>;

  getRatings(bookId: number): Promise<Rating[]>;
  getRatingsForBooks(bookIds: number[]): Promise<Rating[]>;
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
  saveRatingPreferences(userId: number, weights: Record<string, number>): Promise<RatingPreferences>;
  
  getUserGenreViews(userId: number): Promise<UserGenreView[]>;
  getViewGenres(viewId: number, page?: number, limit?: number): Promise<{ genres: ViewGenre[], total: number }>;
  createGenreView(userId: number, name: string, rank: number, isDefault: boolean): Promise<UserGenreView>;
  updateGenreView(viewId: number, data: Partial<{name: string, rank: number, isDefault: boolean}>): Promise<UserGenreView>;
  deleteGenreView(viewId: number): Promise<void>;
  addGenreToView(viewId: number, taxonomyId: number, type: string, rank: number): Promise<ViewGenre>;
  removeGenreFromView(viewGenreId: number): Promise<void>;
  updateGenreRank(viewGenreId: number, newRank: number): Promise<ViewGenre>;
  
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
    // Convert username to lowercase for case-insensitive comparison
    const lowercaseUsername = username.toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, lowercaseUsername));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Convert email to lowercase for case-insensitive comparison
    const lowercaseEmail = email.toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, lowercaseEmail));
    return user;
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.provider, provider),
          eq(users.providerId, providerId)
        )
      );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Import the normalizeEmail function to handle aliases
    const { normalizeEmail } = await import("@shared/utils/email-validator");
    
    // Normalize email to handle aliases (gmail dots, plus addressing, etc.)
    // This helps prevent multiple accounts with the same effective email
    // Also ensure email and username are stored in lowercase
    const normalizedUser = {
      ...insertUser,
      email: normalizeEmail(insertUser.email?.toLowerCase() || ""),
      username: insertUser.username?.toLowerCase()
    };
    
    const [user] = await db.insert(users).values(normalizedUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<UpdateProfile>): Promise<User> {
    // Import the normalizeEmail function to handle aliases
    const { normalizeEmail } = await import("@shared/utils/email-validator");
    
    // Normalize email address to handle aliases when updating
    // Also ensure email and username are stored in lowercase if they're being updated
    const normalizedData = {
      ...data,
      email: data.email ? normalizeEmail(data.email.toLowerCase()) : undefined,
      username: data.username ? data.username.toLowerCase() : undefined
    };
    
    const [user] = await db
      .update(users)
      .set(normalizedData)
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
  
  async getRatingsForBooks(bookIds: number[]): Promise<Rating[]> {
    if (!bookIds || bookIds.length === 0) {
      return [];
    }
    
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
      .where(inArray(ratings.bookId, bookIds));
  }

  async getFollowerMetrics(authorId: number, days: number = 30) {
    const startDate = subDays(new Date(), days);

    // Log the time range we're using
    console.log(`Getting follower metrics from ${startDate.toISOString()} to ${new Date().toISOString()}`);

    // Get all followers regardless of creation date
    const allFollowers = await db
      .select({
        date: sql<string>`DATE(${followers.createdAt})`,
        id: followers.id,
        createdAt: followers.createdAt
      })
      .from(followers)
      .where(
        and(
          eq(followers.followingId, authorId),
          isNull(followers.deletedAt)
        )
      )
      .orderBy(followers.createdAt);
    
    // Now specifically look for the followers from March 3rd and March 4th that we know exist
    const marchFollowers = await db
      .select({
        date: sql<string>`DATE(${followers.createdAt})`,
        count: sql<number>`count(*)`
      })
      .from(followers)
      .where(
        and(
          eq(followers.followingId, authorId),
          isNull(followers.deletedAt),
          // This will find followers from March
          sql`${followers.createdAt} >= '2025-03-01' AND ${followers.createdAt} < '2025-04-01'`
        )
      )
      .groupBy(sql`DATE(${followers.createdAt})`);
    
    console.log("March followers:", JSON.stringify(marchFollowers));
      
    console.log(`Total followers found: ${allFollowers.length}`);
    if (allFollowers.length > 0) {
      console.log(`First follower date: ${allFollowers[0].date}, last follower date: ${allFollowers[allFollowers.length - 1].date}`);
    }

    // Get all unfollows within the date range
    const allUnfollows = await db
      .select({
        date: sql<string>`DATE(${followers.deletedAt})`,
        id: followers.id,
        deletedAt: followers.deletedAt
      })
      .from(followers)
      .where(
        and(
          eq(followers.followingId, authorId),
          sql`${followers.deletedAt} IS NOT NULL`,
          sql`${followers.deletedAt} >= ${startDate}`
        )
      )
      .orderBy(followers.deletedAt);
    
    console.log(`Total unfollows in range: ${allUnfollows.length}`);

    // Generate all dates in range
    const dateRange = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      dateRange.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count follows per day within the range
    const followsByDate = new Map();
    dateRange.forEach(date => followsByDate.set(date, 0));
    
    // Add March data from our specific query if available
    if (marchFollowers.length > 0) {
      marchFollowers.forEach(item => {
        if (item.date) {
          const dateStr = format(new Date(item.date), "yyyy-MM-dd");
          // If the date is in our range, add the count
          if (followsByDate.has(dateStr)) {
            followsByDate.set(dateStr, Number(item.count) || 0);
          }
        }
      });
    }
    
    // Also add April data from all followers
    allFollowers.forEach(follower => {
      if (follower.createdAt) {
        const followerDate = format(new Date(follower.createdAt), "yyyy-MM-dd");
        const followerDateTime = new Date(followerDate);
        const isApril = followerDate.startsWith('2025-04');
        if (isApril && followsByDate.has(followerDate)) {
          followsByDate.set(followerDate, followsByDate.get(followerDate) + 1);
        }
      }
    });

    // Count unfollows per day
    const unfollowsByDate = new Map();
    dateRange.forEach(date => unfollowsByDate.set(date, 0));
    
    allUnfollows.forEach(unfollow => {
      if (unfollow.deletedAt) {
        const unfollowDate = format(new Date(unfollow.deletedAt), "yyyy-MM-dd");
        if (unfollowsByDate.has(unfollowDate)) {
          unfollowsByDate.set(unfollowDate, unfollowsByDate.get(unfollowDate) + 1);
        }
      }
    });

    // Create final response
    return {
      follows: Array.from(followsByDate.entries()).map(([date, count]) => ({
        date,
        count
      })),
      unfollows: Array.from(unfollowsByDate.entries()).map(([date, count]) => ({
        date,
        count
      }))
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

  async saveRatingPreferences(userId: number, weights: Record<string, number>): Promise<RatingPreferences> {
    console.log(`Storage: saveRatingPreferences called for user ${userId} with weights:`, weights);
    
    // Ensure all weights are provided or use defaults
    const criteriaWeights = {
      enjoyment: weights.enjoyment ?? 0.35,
      writing: weights.writing ?? 0.25,
      themes: weights.themes ?? 0.2,
      characters: weights.characters ?? 0.12,
      worldbuilding: weights.worldbuilding ?? 0.08
    };
    
    console.log(`Storage: Using criteria weights:`, criteriaWeights);
    
    // Check if preferences already exist
    const existing = await this.getRatingPreferences(userId);
    console.log("Storage: existing preferences:", existing);
    
    try {
      if (existing) {
        console.log("Storage: updating existing preferences");
        // Update existing
        
        // Explicitly create the data object to update with individual columns
        const dataToUpdate = { 
          // Add individual columns for each criteria - convert numbers to strings for decimal columns
          themes: String(criteriaWeights.themes),
          worldbuilding: String(criteriaWeights.worldbuilding),
          writing: String(criteriaWeights.writing),
          enjoyment: String(criteriaWeights.enjoyment),
          characters: String(criteriaWeights.characters),
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
        
        // Explicitly create the data object to insert with individual columns
        const dataToInsert = {
          userId,
          // Add individual columns for each criteria - convert numbers to strings for decimal columns
          themes: String(criteriaWeights.themes),
          worldbuilding: String(criteriaWeights.worldbuilding),
          writing: String(criteriaWeights.writing),
          enjoyment: String(criteriaWeights.enjoyment),
          characters: String(criteriaWeights.characters)
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
        
        if (existing) {
          // Update using SQL with individual columns
          const result = await db.execute(sql`
            UPDATE rating_preferences 
            SET 
              themes = ${String(criteriaWeights.themes)},
              worldbuilding = ${String(criteriaWeights.worldbuilding)},
              writing = ${String(criteriaWeights.writing)},
              enjoyment = ${String(criteriaWeights.enjoyment)},
              characters = ${String(criteriaWeights.characters)},
              updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING *
          `);
          
          console.log("Storage: SQL update result:", result.rows.length > 0 ? "Success" : "No rows updated");
          
          if (result.rows.length > 0) {
            return result.rows[0] as RatingPreferences;
          }
        } else {
          // Insert using SQL with individual columns
          const result = await db.execute(sql`
            INSERT INTO rating_preferences (
              user_id, 
              themes,
              worldbuilding,
              writing,
              enjoyment,
              characters,
              created_at, 
              updated_at
            )
            VALUES (
              ${userId}, 
              ${String(criteriaWeights.themes)},
              ${String(criteriaWeights.worldbuilding)},
              ${String(criteriaWeights.writing)},
              ${String(criteriaWeights.enjoyment)},
              ${String(criteriaWeights.characters)},
              NOW(), 
              NOW()
            )
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
  
  async getUserGenreViews(userId: number): Promise<UserGenreView[]> {
    const views = await db
      .select()
      .from(userGenreViews)
      .where(eq(userGenreViews.userId, userId))
      .orderBy(userGenreViews.rank);
    
    return views;
  }

  async getViewGenres(viewId: number, page: number = 0, limit: number = 0): Promise<{ genres: ViewGenre[], total: number }> {
    // First get the total count of genres for pagination metadata
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(viewGenres)
      .where(eq(viewGenres.viewId, viewId));
      
    const total = Number(countResult[0]?.count || 0);
    
    // Build the query
    let query = db
      .select({
        id: viewGenres.id,
        viewId: viewGenres.viewId,
        taxonomyId: viewGenres.taxonomyId,
        type: viewGenres.type,
        rank: viewGenres.rank,
        createdAt: viewGenres.createdAt,
        name: genreTaxonomies.name,  // Include the name from taxonomies
        description: genreTaxonomies.description // Include description for potential future use
      })
      .from(viewGenres)
      .leftJoin(
        genreTaxonomies, 
        eq(viewGenres.taxonomyId, genreTaxonomies.id)
      )
      .where(eq(viewGenres.viewId, viewId))
      .orderBy(viewGenres.rank);
    
    // Apply pagination if requested
    if (limit > 0) {
      const offset = page * limit;
      query = query.limit(limit).offset(offset);
    }
    
    // Execute the query
    const genres = await query;
    
    return { genres, total };
  }

  async createGenreView(userId: number, name: string, rank: number, isDefault: boolean): Promise<UserGenreView> {
    const [view] = await db
      .insert(userGenreViews)
      .values({
        userId,
        name,
        rank,
        isDefault,
      })
      .returning();
    
    return view;
  }

  async updateGenreView(viewId: number, data: Partial<{name: string, rank: number, isDefault: boolean}>): Promise<UserGenreView> {
    const [updatedView] = await db
      .update(userGenreViews)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(userGenreViews.id, viewId))
      .returning();
    
    if (!updatedView) {
      throw new Error("Failed to update genre view");
    }
    
    return updatedView;
  }

  async deleteGenreView(viewId: number): Promise<void> {
    // First delete all genres in this view
    await db
      .delete(viewGenres)
      .where(eq(viewGenres.viewId, viewId));
    
    // Then delete the view itself
    await db
      .delete(userGenreViews)
      .where(eq(userGenreViews.id, viewId));
  }

  async addGenreToView(viewId: number, taxonomyId: number, type: string, rank: number): Promise<ViewGenre> {
    const [genre] = await db
      .insert(viewGenres)
      .values({
        viewId,
        taxonomyId,
        type,
        rank,
      })
      .returning();
    
    return genre;
  }

  async removeGenreFromView(viewGenreId: number): Promise<void> {
    await db
      .delete(viewGenres)
      .where(eq(viewGenres.id, viewGenreId));
  }

  async updateGenreRank(viewGenreId: number, newRank: number): Promise<ViewGenre> {
    const [updatedGenre] = await db
      .update(viewGenres)
      .set({ rank: newRank })
      .where(eq(viewGenres.id, viewGenreId))
      .returning();
    
    if (!updatedGenre) {
      throw new Error("Failed to update genre rank");
    }
    
    return updatedGenre;
  }
}
