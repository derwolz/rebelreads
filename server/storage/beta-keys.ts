import {
  BetaKey,
  InsertBetaKey,
  BetaKeyUsage,
  betaKeys,
  betaKeyUsage,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, gt, count, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface IBetaKeyStorage {
  createBetaKey(data: Omit<InsertBetaKey, "key">): Promise<BetaKey>;
  generateBetaKey(data: Omit<InsertBetaKey, "key">, prefix?: string): Promise<BetaKey>;
  getBetaKeys(): Promise<BetaKey[]>;
  getBetaKey(id: number): Promise<BetaKey | undefined>;
  getBetaKeyByKey(key: string): Promise<BetaKey | undefined>;
  updateBetaKey(id: number, isActive: boolean): Promise<BetaKey>;
  deleteBetaKey(id: number): Promise<void>;
  validateBetaKey(key: string): Promise<boolean>;
  recordBetaKeyUsage(betaKeyId: number, userId: number): Promise<BetaKeyUsage>;
  getBetaKeyUsage(betaKeyId: number): Promise<BetaKeyUsage[]>;
  hasUserUsedBetaKey(userId: number): Promise<boolean>;
  isBetaActive(): Promise<boolean>;
}

export class BetaKeyStorage implements IBetaKeyStorage {
  async createBetaKey(data: Omit<InsertBetaKey, "key">): Promise<BetaKey> {
    const key = uuidv4();
    const [betaKey] = await db
      .insert(betaKeys)
      .values({ ...data, key })
      .returning();
    return betaKey;
  }

  async generateBetaKey(data: Omit<InsertBetaKey, "key">, prefix: string = "BETA"): Promise<BetaKey> {
    // Generate a key with format PREFIX-XXXXX-XXXX-XXXX-XXXX where X is alphanumeric
    const randomPart = (length: number) => {
      return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    };
    
    // First part is 5 chars, others are 4 chars each
    const key = `${prefix}-${randomPart(5)}-${randomPart(4)}-${randomPart(4)}-${randomPart(4)}`;
    
    const [betaKey] = await db
      .insert(betaKeys)
      .values({ ...data, key })
      .returning();
    return betaKey;
  }

  async getBetaKeys(): Promise<BetaKey[]> {
    return db.select().from(betaKeys).orderBy(betaKeys.createdAt);
  }

  async getBetaKey(id: number): Promise<BetaKey | undefined> {
    const [key] = await db
      .select()
      .from(betaKeys)
      .where(eq(betaKeys.id, id));
    return key;
  }

  async getBetaKeyByKey(key: string): Promise<BetaKey | undefined> {
    const [betaKey] = await db
      .select()
      .from(betaKeys)
      .where(eq(betaKeys.key, key));
    return betaKey;
  }

  async updateBetaKey(id: number, isActive: boolean): Promise<BetaKey> {
    const [betaKey] = await db
      .update(betaKeys)
      .set({ isActive })
      .where(eq(betaKeys.id, id))
      .returning();
    return betaKey;
  }

  async deleteBetaKey(id: number): Promise<void> {
    await db.delete(betaKeys).where(eq(betaKeys.id, id));
  }

  async validateBetaKey(key: string): Promise<boolean> {
    const betaKey = await this.getBetaKeyByKey(key);
    
    if (!betaKey) {
      return false;
    }

    // Check if the key is active
    if (!betaKey.isActive) {
      return false;
    }

    // Check if the key has expired
    if (betaKey.expiresAt && betaKey.expiresAt < new Date()) {
      return false;
    }

    // Check if the key has reached its usage limit
    if (betaKey.usageLimit && betaKey.usageCount >= betaKey.usageLimit) {
      return false;
    }

    // If all checks pass, increment the usage count
    await db
      .update(betaKeys)
      .set({ usageCount: betaKey.usageCount + 1 })
      .where(eq(betaKeys.id, betaKey.id));

    return true;
  }

  async recordBetaKeyUsage(betaKeyId: number, userId: number): Promise<BetaKeyUsage> {
    const [usage] = await db
      .insert(betaKeyUsage)
      .values({ betaKeyId, userId })
      .returning();
    return usage;
  }

  async getBetaKeyUsage(betaKeyId: number): Promise<BetaKeyUsage[]> {
    return db
      .select()
      .from(betaKeyUsage)
      .where(eq(betaKeyUsage.betaKeyId, betaKeyId))
      .orderBy(betaKeyUsage.usedAt);
  }

  async hasUserUsedBetaKey(userId: number): Promise<boolean> {
    // Check if the user has used any beta key before
    const usages = await db
      .select()
      .from(betaKeyUsage)
      .where(eq(betaKeyUsage.userId, userId))
      .limit(1);
    
    return usages.length > 0;
  }

  async isBetaActive(): Promise<boolean> {
    // First check if BETA_ACTIVE environment variable is set to "true"
    if (process.env.BETA_ACTIVE !== "true") {
      return false;
    }
    
    // Then check if we're still before the end date
    if (process.env.BETA_END_DATE) {
      try {
        const betaEndDate = new Date(process.env.BETA_END_DATE);
        const now = new Date();
        return now < betaEndDate;
      } catch (error) {
        console.error("Error parsing BETA_END_DATE:", error);
      }
    }
    
    // Default to true if BETA_ACTIVE is "true" and no end date is specified or there was an error
    return true;
  }
}