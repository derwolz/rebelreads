import { 
  Campaign,
  InsertCampaign,
  Publisher,
  InsertPublisher,
  PublisherAuthor,
  CreditTransaction,
  GiftedBook,
  InsertGiftedBook,
  User,
  Book
} from "@shared/schema";
import { 
  campaigns,
  campaignBooks,
  publishers,
  publishersAuthors,
  creditTransactions,
  giftedBooks,
  books,
  users
} from "@shared/schema";
import { db } from "../db";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { BaseStorage } from "./base";

export interface ICampaignStorage {
  // Campaign methods
  getCampaigns(authorId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignStatus(id: number, status: "active" | "completed" | "paused"): Promise<Campaign>;
  updateCampaignMetrics(id: number, metrics: any): Promise<Campaign>;

  // Publisher methods
  getPublishers(): Promise<Publisher[]>;
  getPublisher(id: number): Promise<Publisher | undefined>;
  createPublisher(publisher: InsertPublisher): Promise<Publisher>;
  getPublisherAuthors(publisherId: number): Promise<User[]>;
  addAuthorToPublisher(publisherId: number, authorId: number, contractStart: Date): Promise<PublisherAuthor>;
  removeAuthorFromPublisher(publisherId: number, authorId: number): Promise<void>;
  getAuthorPublisher(authorId: number): Promise<Publisher | undefined>;

  // Credit methods
  getUserCredits(userId: number): Promise<string>;
  addCredits(userId: number, amount: string, description?: string): Promise<User>;
  deductCredits(userId: number, amount: string, campaignId: number): Promise<User>;
  getCreditTransactions(userId: number): Promise<CreditTransaction[]>;

  // Gifted books methods
  getGiftedBooks(campaignId: number): Promise<GiftedBook[]>;
  createGiftedBook(data: InsertGiftedBook): Promise<GiftedBook>;
  claimGiftedBook(uniqueCode: string, userId: number): Promise<GiftedBook>;
  getAvailableGiftedBook(): Promise<{ giftedBook: GiftedBook; book: Book } | null>;
}

export class CampaignStorage extends BaseStorage implements ICampaignStorage {
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
    // Use a transaction to ensure atomicity
    const [claimedBook] = await db.transaction(async (tx) => {
      // First check if the book is available
      const [book] = await tx
        .select()
        .from(giftedBooks)
        .where(
          and(
            eq(giftedBooks.uniqueCode, uniqueCode),
            eq(giftedBooks.status, "unclaimed")
          )
        );

      if (!book) {
        throw new Error("Book is no longer available");
      }

      // Update the book status
      return await tx
        .update(giftedBooks)
        .set({
          status: "claimed",
          claimedByUserId: userId,
          claimedAt: new Date(),
        })
        .where(eq(giftedBooks.uniqueCode, uniqueCode))
        .returning();
    });

    if (!claimedBook) {
      throw new Error("Failed to claim book");
    }

    return claimedBook;
  }

  async getAvailableGiftedBook(): Promise<{ giftedBook: GiftedBook; book: Book } | null> {
    const [result] = await db
      .select({
        giftedBook: giftedBooks,
        book: books,
      })
      .from(giftedBooks)
      .where(eq(giftedBooks.status, "unclaimed"))
      .leftJoin(books, eq(books.id, giftedBooks.bookId))
      .limit(1);

    return result || null;
  }
}

export const campaignStorage = new CampaignStorage();