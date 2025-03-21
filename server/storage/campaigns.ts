import {
  Campaign,
  InsertCampaign,
  GiftedBook,
  InsertGiftedBook,
  CreditTransaction,
  campaigns,
  campaignBooks,
  giftedBooks,
  creditTransactions,
  books,
  users,
  User,
  Book,
  keywordBids,
  KeywordBid,
  InsertKeywordBid,
  adImpressions,
  AdImpression,
  InsertAdImpression,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

export interface ICampaignStorage {
  // Campaign methods
  getCampaigns(authorId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignStatus(id: number, status: "active" | "completed" | "paused"): Promise<Campaign>;
  updateCampaignMetrics(id: number, metrics: any): Promise<Campaign>;

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

  // Keyword bidding methods
  createKeywordBid(bid: InsertKeywordBid): Promise<KeywordBid>;
  updateKeywordBid(id: number, bid: Partial<InsertKeywordBid>): Promise<KeywordBid>;
  getKeywordBids(campaignId: number): Promise<KeywordBid[]>;
  updateBidMetrics(id: number, impressions: number, clicks: number, spend: string): Promise<KeywordBid>;
  adjustAutomaticBids(campaignId: number): Promise<void>;
  
  // Ad impressions and tracking methods
  recordAdImpression(data: InsertAdImpression): Promise<AdImpression>;
  recordAdClick(id: number): Promise<AdImpression>;
  getAdImpressions(campaignId: number): Promise<AdImpression[]>;
  getAdImpressionsByBook(bookId: number): Promise<AdImpression[]>; 
  getAdMetrics(campaignId: number, days?: number): Promise<{ 
    impressions: number, 
    clicks: number, 
    ctr: number,
    dailyStats: Array<{ date: string, impressions: number, clicks: number, ctr: number }>
  }>;
}

export class CampaignStorage implements ICampaignStorage {
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

  async getUserCredits(userId: number): Promise<string> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
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

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    return user;
  }

  async deductCredits(userId: number, amount: string, campaignId: number): Promise<User> {
    await db.transaction(async (tx) => {
      // Check balance
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user || parseFloat(user.credits) < parseFloat(amount)) {
        throw new Error("Insufficient credits");
      }

      // Update user credits
      await tx
        .update(users)
        .set({
          credits: sql`${users.credits} - ${amount}`,
        })
        .where(eq(users.id, userId));

      // Record transaction
      await tx.insert(creditTransactions).values({
        userId,
        amount: `-${amount}`,
        type: "campaign_spend",
        campaignId,
        description: "Campaign spending",
      });
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    return user;
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

  async createKeywordBid(bid: InsertKeywordBid): Promise<KeywordBid> {
    const [keywordBid] = await db
      .insert(keywordBids)
      .values(bid)
      .returning();
    return keywordBid;
  }

  async updateKeywordBid(
    id: number,
    bid: Partial<InsertKeywordBid>
  ): Promise<KeywordBid> {
    const [keywordBid] = await db
      .update(keywordBids)
      .set({
        ...bid,
        updatedAt: new Date(),
      })
      .where(eq(keywordBids.id, id))
      .returning();
    return keywordBid;
  }

  async getKeywordBids(campaignId: number): Promise<KeywordBid[]> {
    return await db
      .select()
      .from(keywordBids)
      .where(eq(keywordBids.campaignId, campaignId))
      .orderBy(desc(keywordBids.currentBid));
  }

  async updateBidMetrics(
    id: number,
    impressions: number,
    clicks: number,
    spend: string
  ): Promise<KeywordBid> {
    const [keywordBid] = await db
      .update(keywordBids)
      .set({
        impressions: sql`${keywordBids.impressions} + ${impressions}`,
        clicks: sql`${keywordBids.clicks} + ${clicks}`,
        spend: sql`${keywordBids.spend} + ${spend}`,
        updatedAt: new Date(),
      })
      .where(eq(keywordBids.id, id))
      .returning();
    return keywordBid;
  }

  async adjustAutomaticBids(campaignId: number): Promise<void> {
    // Get campaign details
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign || campaign.biddingStrategy !== "automatic") {
      return;
    }

    // Get all keyword bids for this campaign
    const bids = await this.getKeywordBids(campaignId);

    // Adjust bids based on performance and campaign settings
    for (const bid of bids) {
      const cpc = bid.clicks > 0 ? Number(bid.spend) / bid.clicks : 0;
      let newBid = Number(bid.currentBid);

      // Adjust bid based on target CPC
      if (campaign.targetCPC) {
        if (cpc > Number(campaign.targetCPC)) {
          newBid *= 0.95; // Decrease bid by 5%
        } else if (cpc < Number(campaign.targetCPC)) {
          newBid *= 1.05; // Increase bid by 5%
        }
      }

      // Ensure bid doesn't exceed max bid amount
      if (campaign.maxBidAmount) {
        newBid = Math.min(newBid, Number(campaign.maxBidAmount));
      }

      // Update the bid
      await this.updateKeywordBid(bid.id, {
        currentBid: newBid.toString(),
      });
    }
  }

  // Ad impression tracking methods
  async recordAdImpression(data: InsertAdImpression): Promise<AdImpression> {
    const [impression] = await db
      .insert(adImpressions)
      .values(data)
      .returning();
    
    // Update campaign metrics as well
    await this.updateCampaignMetrics(data.campaignId, {
      lastUpdated: new Date().toISOString(),
      totalImpressions: sql`COALESCE((campaigns.metrics->>'totalImpressions')::integer, 0) + 1`
    });
    
    return impression;
  }

  async recordAdClick(id: number): Promise<AdImpression> {
    const [impression] = await db
      .update(adImpressions)
      .set({
        clicked: true,
        clickedAt: new Date(),
      })
      .where(eq(adImpressions.id, id))
      .returning();
    
    // Update campaign metrics
    await this.updateCampaignMetrics(impression.campaignId, {
      lastUpdated: new Date().toISOString(),
      totalClicks: sql`COALESCE((campaigns.metrics->>'totalClicks')::integer, 0) + 1`
    });
    
    return impression;
  }

  async getAdImpressions(campaignId: number): Promise<AdImpression[]> {
    return await db
      .select()
      .from(adImpressions)
      .where(eq(adImpressions.campaignId, campaignId))
      .orderBy(desc(adImpressions.timestamp));
  }

  async getAdImpressionsByBook(bookId: number): Promise<AdImpression[]> {
    return await db
      .select()
      .from(adImpressions)
      .where(eq(adImpressions.bookId, bookId))
      .orderBy(desc(adImpressions.timestamp));
  }

  async getAdMetrics(campaignId: number, days: number = 30): Promise<{
    impressions: number;
    clicks: number;
    ctr: number;
    dailyStats: Array<{ date: string; impressions: number; clicks: number; ctr: number }>;
  }> {
    // Get overall metrics for the time period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get total impressions and clicks
    const impressions = await db
      .select({ count: sql`count(*)` })
      .from(adImpressions)
      .where(
        and(
          eq(adImpressions.campaignId, campaignId),
          sql`${adImpressions.timestamp} >= ${startDate}`
        )
      );
    
    const clicks = await db
      .select({ count: sql`count(*)` })
      .from(adImpressions)
      .where(
        and(
          eq(adImpressions.campaignId, campaignId),
          eq(adImpressions.clicked, true),
          sql`${adImpressions.timestamp} >= ${startDate}`
        )
      );

    // Get daily stats
    const dailyQueryResult = await db.execute(sql`
      SELECT 
        TO_CHAR(date_trunc('day', timestamp), 'YYYY-MM-DD') as date,
        COUNT(*) as impressions,
        SUM(CASE WHEN clicked = true THEN 1 ELSE 0 END) as clicks
      FROM ad_impressions
      WHERE campaign_id = ${campaignId}
      AND timestamp >= ${startDate}
      GROUP BY date_trunc('day', timestamp)
      ORDER BY date_trunc('day', timestamp)
    `);

    const totalImpressions = Number(impressions[0]?.count || 0);
    const totalClicks = Number(clicks[0]?.count || 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Format daily stats - convert query result to array
    const dailyStats: Array<{ date: string; impressions: number; clicks: number; ctr: number }> = [];
    
    if (dailyQueryResult.rows) {
      for (const row of dailyQueryResult.rows) {
        const dailyImpressions = Number(row.impressions);
        const dailyClicks = Number(row.clicks);
        const dailyCtr = dailyImpressions > 0 ? (dailyClicks / dailyImpressions) * 100 : 0;
        
        dailyStats.push({
          date: row.date,
          impressions: dailyImpressions,
          clicks: dailyClicks,
          ctr: dailyCtr
        });
      }
    }

    // Fill in missing days with zeros
    const allDays: Array<{ date: string; impressions: number; clicks: number; ctr: number }> = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();
    
    // Create map of existing data for quick lookup
    const dataByDate = dailyStats.reduce((acc: Record<string, any>, day) => {
      acc[day.date] = day;
      return acc;
    }, {});
    
    // Fill in all days
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (dataByDate[dateStr]) {
        allDays.push(dataByDate[dateStr]);
      } else {
        allDays.push({
          date: dateStr,
          impressions: 0,
          clicks: 0,
          ctr: 0
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: ctr,
      dailyStats: allDays
    };
  }
}