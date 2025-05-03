import { db } from "../db";
import { eq } from "drizzle-orm";
import { ratingSentimentThresholds, RatingSentimentThresholds, SentimentLevel } from "@shared/schema";
import { sql } from "drizzle-orm";

export interface IRatingSentimentStorage {
  getSentimentThresholds(): Promise<RatingSentimentThresholds[]>;
  getSentimentThresholdsByCriteria(criteria: string): Promise<RatingSentimentThresholds[]>;
  updateSentimentThreshold(
    id: number, 
    data: Partial<{
      criteriaName: string;
      sentimentLevel: SentimentLevel;
      ratingMin: number;
      ratingMax: number;
      requiredCount: number;
    }>
  ): Promise<RatingSentimentThresholds>;
}

export class RatingSentimentStorage implements IRatingSentimentStorage {
  /**
   * Get all rating sentiment thresholds
   */
  async getSentimentThresholds(): Promise<RatingSentimentThresholds[]> {
    try {
      const rawThresholds = await db
        .select()
        .from(ratingSentimentThresholds)
        .orderBy(ratingSentimentThresholds.criteriaName, ratingSentimentThresholds.ratingMin);
      
      // Convert string sentimentLevel to SentimentLevel type
      const thresholds: RatingSentimentThresholds[] = rawThresholds.map(t => ({
        ...t,
        // Cast the string to SentimentLevel
        sentimentLevel: t.sentimentLevel as SentimentLevel,
        // Ensure proper number type for values from decimal columns
        ratingMin: parseFloat(t.ratingMin.toString()),
        ratingMax: parseFloat(t.ratingMax.toString()),
      }));
      
      return thresholds;
    } catch (error) {
      console.error("Error getting sentiment thresholds:", error);
      throw error;
    }
  }

  /**
   * Get rating sentiment thresholds for a specific criteria
   */
  async getSentimentThresholdsByCriteria(criteria: string): Promise<RatingSentimentThresholds[]> {
    try {
      const rawThresholds = await db
        .select()
        .from(ratingSentimentThresholds)
        .where(eq(ratingSentimentThresholds.criteriaName, criteria))
        .orderBy(ratingSentimentThresholds.ratingMin);
      
      // Convert string sentimentLevel to SentimentLevel type
      const thresholds: RatingSentimentThresholds[] = rawThresholds.map(t => ({
        ...t,
        // Cast the string to SentimentLevel
        sentimentLevel: t.sentimentLevel as SentimentLevel,
        // Ensure proper number type for values from decimal columns
        ratingMin: parseFloat(t.ratingMin.toString()),
        ratingMax: parseFloat(t.ratingMax.toString()),
      }));
      
      return thresholds;
    } catch (error) {
      console.error(`Error getting sentiment thresholds for criteria ${criteria}:`, error);
      throw error;
    }
  }

  /**
   * Update a rating sentiment threshold
   */
  async updateSentimentThreshold(
    id: number, 
    data: Partial<{
      criteriaName: string;
      sentimentLevel: SentimentLevel;
      ratingMin: number;
      ratingMax: number;
      requiredCount: number;
    }>
  ): Promise<RatingSentimentThresholds> {
    try {
      // Convert number values to strings for the database
      const dbData: any = {
        ...data,
        updatedAt: new Date()
      };
      
      if (data.ratingMin !== undefined) {
        dbData.ratingMin = data.ratingMin.toString();
      }
      
      if (data.ratingMax !== undefined) {
        dbData.ratingMax = data.ratingMax.toString();
      }
      
      const [rawUpdated] = await db
        .update(ratingSentimentThresholds)
        .set(dbData)
        .where(eq(ratingSentimentThresholds.id, id))
        .returning();
      
      // Convert the result back to the expected format
      const updated: RatingSentimentThresholds = {
        ...rawUpdated,
        // Cast the string to SentimentLevel
        sentimentLevel: rawUpdated.sentimentLevel as SentimentLevel,
        // Ensure proper number type for values from decimal columns
        ratingMin: parseFloat(rawUpdated.ratingMin.toString()),
        ratingMax: parseFloat(rawUpdated.ratingMax.toString()),
      };
      
      return updated;
    } catch (error) {
      console.error(`Error updating sentiment threshold ${id}:`, error);
      throw error;
    }
  }
}

/**
 * Singleton instance of RatingSentimentStorage
 */
export const ratingSentimentStorage = new RatingSentimentStorage();