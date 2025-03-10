import {
  User,
  Book,
  Rating,
  ReadingStatus,
  InsertUser,
  UpdateProfile,
  calculateWeightedRating,
  reading_status,
  bookImpressions,
  BookImpression,
  bookClickThroughs,
  BookClickThrough,
  Campaign,
  InsertCampaign,
  campaigns,
  campaignBooks,
  publishers,
  publishersAuthors,
  InsertPublisher,
  Publisher,
  PublisherAuthor,
  CreditTransaction,
  creditTransactions, // Added this import
  GiftedBook, // Added this import
  InsertGiftedBook, // Added this import
  giftedBooks, // Added this import

} from "@shared/schema";
import { users, books, ratings, followers, Follower } from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, ilike, desc, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { sql } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<UpdateProfile>): Promise<User>;
  toggleAuthorStatus(id: number): Promise<User>;

  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  getBooksByAuthor(authorId: number): Promise<Book[]>;
  createBook(book: Omit<Book, "id">): Promise<Book>;
  promoteBook(id: number): Promise<Book>;
  updateBook(id: number, data: Partial<Book>): Promise<Book>;
  deleteBook(id: number, authorId: number): Promise<void>;

  getRatings(bookId: number): Promise<Rating[]>;
  createRating(rating: Omit<Rating, "id">): Promise<Rating>;
  getUserRatings(userId: number): Promise<Rating[]>;

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

  getAuthorGenres(
    authorId: number,
  ): Promise<{ genre: string; count: number }[]>;
  getAuthorAggregateRatings(authorId: number): Promise<{
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  } | null>;
  getFollowedAuthorsBooks(userId: number): Promise<Book[]>;

  sessionStore: session.Store;
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

  // Add new campaign methods
  getCampaigns(authorId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignStatus(id: number, status: "active" | "completed" | "paused"): Promise<Campaign>;
  updateCampaignMetrics(id: number, metrics: any): Promise<Campaign>;

  // Add new publisher methods
  getPublishers(): Promise<Publisher[]>;
  getPublisher(id: number): Promise<Publisher | undefined>;
  createPublisher(publisher: InsertPublisher): Promise<Publisher>;
  getPublisherAuthors(publisherId: number): Promise<User[]>;
  addAuthorToPublisher(publisherId: number, authorId: number, contractStart: Date): Promise<PublisherAuthor>;
  removeAuthorFromPublisher(publisherId: number, authorId: number): Promise<void>;
  getAuthorPublisher(authorId: number): Promise<Publisher | undefined>;

  // Add new credit methods
  getUserCredits(userId: number): Promise<string>;
  addCredits(userId: number, amount: string, description?: string): Promise<User>;
  deductCredits(userId: number, amount: string, campaignId: number): Promise<User>;
  getCreditTransactions(userId: number): Promise<CreditTransaction[]>;

  // Add new gifted books methods
  getGiftedBooks(campaignId: number): Promise<GiftedBook[]>;
  createGiftedBook(data: InsertGiftedBook): Promise<GiftedBook>;
  claimGiftedBook(uniqueCode: string, userId: number): Promise<GiftedBook>;
}

export class DatabaseStorage implements IStorage {
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

  async getBooks(): Promise<Book[]> {
    return await db.select().from(books);
  }

  async selectBooks(query: string): Promise<Book[]> {
    const results = await db
      .select()
      .from(books)
      .where(ilike(books.title, query))
      .limit(20);
    console.log(results, "Filtered search results");
    return results;
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async getBooksByAuthor(authorId: number): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.authorId, authorId));
  }

  async createBook(book: Omit<Book, "id">): Promise<Book> {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  async promoteBook(id: number): Promise<Book> {
    const [book] = await db
      .update(books)
      .set({ promoted: true })
      .where(eq(books.id, id))
      .returning();
    return book;
  }

  async updateBook(id: number, data: Partial<Book>): Promise<Book> {
    const [book] = await db
      .update(books)
      .set(data)
      .where(eq(books.id, id))
      .returning();
    return book;
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
        report_reason: ratings.report_reason
      })
      .from(ratings)
      .where(eq(ratings.bookId, bookId));
  }

  async createRating(rating: Omit<Rating, "id">): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
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
      .select()
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
      .select()
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

  async deleteBook(id: number, authorId: number): Promise<void> {
    await db
      .delete(books)
      .where(and(eq(books.id, id), eq(books.authorId, authorId)));
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
    const books = await this.getBooksByAuthor(authorId);
    const genreCounts = new Map<string, number>();

    books.forEach((book) => {
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
    const authorBooks = await this.getBooksByAuthor(authorId);
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
    const followedAuthorsBooks = await db
      .select()
      .from(books)
      .where(inArray(books.authorId, authorIds));
    return followedAuthorsBooks;
  }
  async getUserRatings(userId: number): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt));
  }

  async getCampaigns(authorId: number): Promise<Campaign[]> {
    const campaignResults = await db
      .select({
        campaign: campaigns,
        books: sql<Pick<Book, "id" | "title">[]>`
          json_agg(json_build_object('id', ${books.id}, 'title', ${books.title}))
        `.as('books'),
      })
      .from(campaigns)
      .leftJoin(campaignBooks, eq(campaigns.id, campaignBooks.campaignId))
      .leftJoin(books, eq(campaignBooks.bookId, books.id))
      .where(eq(campaigns.authorId, authorId))
      .groupBy(campaigns.id);

    return campaignResults.map(({ campaign, books }) => ({
      ...campaign,
      books: books || [],
    }));
  }

  async createCampaign(data: InsertCampaign): Promise<Campaign> {
    const { books: bookIds, ...campaignData } = data;

    const [campaign] = await db.insert(campaigns)
      .values({
        ...campaignData,
        startDate: new Date(campaignData.startDate),
        endDate: new Date(campaignData.endDate),
      })
      .returning();

    await db.insert(campaignBooks)
      .values(
        bookIds.map(bookId => ({
          campaignId: campaign.id,
          bookId,
        }))
      );

    const [result] = await db
      .select({
        campaign: campaigns,
        books: sql<Pick<Book, "id" | "title">[]>`
          json_agg(json_build_object('id', ${books.id}, 'title', ${books.title}))
        `.as('books'),
      })
      .from(campaigns)
      .leftJoin(campaignBooks, eq(campaigns.id, campaignBooks.campaignId))
      .leftJoin(books, eq(campaignBooks.bookId, books.id))
      .where(eq(campaigns.id, campaign.id))
      .groupBy(campaigns.id);

    return {
      ...result.campaign,
      books: result.books || [],
    };
  }

  async updateCampaignStatus(
    id: number,
    status: "active" | "completed" | "paused"
  ): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set({ status })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async updateCampaignMetrics(id: number, metrics: any): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set({ metrics })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async getPublishers(): Promise<Publisher[]> {
    return await db.select().from(publishers);
  }

  async getPublisher(id: number): Promise<Publisher | undefined> {
    const [publisher] = await db
      .select()
      .from(publishers)
      .where(eq(publishers.id, id));
    return publisher;
  }

  async createPublisher(publisher: InsertPublisher): Promise<Publisher> {
    const [newPublisher] = await db
      .insert(publishers)
      .values(publisher)
      .returning();
    return newPublisher;
  }

  async getPublisherAuthors(publisherId: number): Promise<User[]> {
    const result = await db
      .select({
        user: users,
      })
      .from(publishersAuthors)
      .where(eq(publishersAuthors.publisherId, publisherId))
      .innerJoin(users, eq(users.id, publishersAuthors.authorId))
      .where(isNull(publishersAuthors.contractEnd));

    return result.map(r => r.user);
  }

  async addAuthorToPublisher(
    publisherId: number,
    authorId: number,
    contractStart: Date
  ): Promise<PublisherAuthor> {
    const [relation] = await db
      .insert(publishersAuthors)
      .values({
        publisherId,
        authorId,
        contractStart,
      })
      .returning();
    return relation;
  }

  async removeAuthorFromPublisher(
    publisherId: number,
    authorId: number
  ): Promise<void> {
    await db
      .update(publishersAuthors)
      .set({
        contractEnd: new Date(),
      })
      .where(
        and(
          eq(publishersAuthors.publisherId, publisherId),
          eq(publishersAuthors.authorId, authorId),
          isNull(publishersAuthors.contractEnd)
        )
      );
  }

  async getAuthorPublisher(authorId: number): Promise<Publisher | undefined> {
    const [result] = await db
      .select({
        publisher: publishers,
      })
      .from(publishersAuthors)
      .where(
        and(
          eq(publishersAuthors.authorId, authorId),
          isNull(publishersAuthors.contractEnd)
        )
      )
      .innerJoin(
        publishers,
        eq(publishers.id, publishersAuthors.publisherId)
      );

    return result?.publisher;
  }

  async getUserCredits(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    return user?.credits || "0";
  }

  async addCredits(userId: number, amount: string, description?: string): Promise<User> {
    await db.transaction(async (tx) => {
      // Update user credits
      const [user] = await tx
        .update(users)
        .set({
          credits: sql`${users.credits} + ${amount}`,
        })
        .where(eq(users.id, userId))
        .returning();

      // Record transaction
      await tx.insert(creditTransactions).values({
        userId,
        amount,
        type: "deposit",
        description: description || "Credit deposit",
      });

      return user;
    });

    return await this.getUser(userId);
  }

  async deductCredits(userId: number, amount: string, campaignId: number): Promise<User> {
    await db.transaction(async (tx) => {
      // Check balance
      const user = await this.getUser(userId);
      if (!user || parseFloat(user.credits) < parseFloat(amount)) {
        throw new Error("Insufficient credits");
      }

      // Update user credits
      const [updatedUser] = await tx
        .update(users)
        .set({
          credits: sql`${users.credits} - ${amount}`,
        })
        .where(eq(users.id, userId))
        .returning();

      // Record transaction
      await tx.insert(creditTransactions).values({
        userId,
        amount: `-${amount}`,
        type: "campaign_spend",
        campaignId,
        description: "Campaign spending",
      });

      return updatedUser;
    });

    return await this.getUser(userId);
  }

  async getCreditTransactions(userId: number): Promise<CreditTransaction[]> {
    return await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
  }

  async getGiftedBooks(campaignId: number): Promise<GiftedBook[]> {
    return await db
      .select()
      .from(giftedBooks)
      .where(eq(giftedBooks.campaignId, campaignId));
  }

  async createGiftedBook(data: InsertGiftedBook): Promise<GiftedBook> {
    const [giftedBook] = await db
      .insert(giftedBooks)
      .values(data)
      .returning();
    return giftedBook;
  }

  async claimGiftedBook(uniqueCode: string, userId: number): Promise<GiftedBook> {
    const [giftedBook] = await db
      .update(giftedBooks)
      .set({
        status: "claimed",
        claimedByUserId: userId,
        claimedAt: new Date(),
      })
      .where(eq(giftedBooks.uniqueCode, uniqueCode))
      .returning();
    return giftedBook;
  }
}

export const dbStorage = new DatabaseStorage();