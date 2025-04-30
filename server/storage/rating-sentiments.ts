import { db } from "../db";
import { eq } from "drizzle-orm";
import { ratingSentimentThresholds, RatingSentimentThresholds } from "@shared/schema";

export interface IRatingSentimentStorage {
  getSentimentThresholds(): Promise<RatingSentimentThresholds[]>;
  getSentimentThresholdsByCriteria(criteria: string): Promise<RatingSentimentThresholds[]>;
  updateSentimentThreshold(
    id: number, 
    data: Partial<RatingSentimentThresholds>
  ): Promise<RatingSentimentThresholds>;
}

export class RatingSentimentStorage implements IRatingSentimentStorage {
  /**
   * Get all rating sentiment thresholds
   */
  async getSentimentThresholds(): Promise<RatingSentimentThresholds[]> {
    const thresholds = await db
      .select()
      .from(ratingSentimentThresholds)
      .orderBy(ratingSentimentThresholds.criteriaName, ratingSentimentThresholds.ratingMin);
    
    return thresholds;
  }

  /**
   * Get rating sentiment thresholds for a specific criteria
   */
  async getSentimentThresholdsByCriteria(criteria: string): Promise<RatingSentimentThresholds[]> {
    const thresholds = await db
      .select()
      .from(ratingSentimentThresholds)
      .where(eq(ratingSentimentThresholds.criteriaName, criteria))
      .orderBy(ratingSentimentThresholds.ratingMin);
    
    return thresholds;
  }

  /**
   * Update a rating sentiment threshold
   */
  async updateSentimentThreshold(
    id: number, 
    data: Partial<RatingSentimentThresholds>
  ): Promise<RatingSentimentThresholds> {
    const [updated] = await db
      .update(ratingSentimentThresholds)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(ratingSentimentThresholds.id, id))
      .returning();
    
    return updated;
  }
}

/**
 * Singleton instance of RatingSentimentStorage
 */
export const ratingSentimentStorage = new RatingSentimentStorage();