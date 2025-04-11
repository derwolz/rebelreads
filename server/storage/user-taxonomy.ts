import { db } from "../db";
import { 
  userTaxonomyPreferences, 
  userTaxonomyItems, 
  UserTaxonomyPreference, 
  UserTaxonomyItem, 
  InsertUserTaxonomyPreference, 
  InsertUserTaxonomyItem,
  genreTaxonomies
} from "../../shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export class UserTaxonomyStorage {
  /**
   * Get all taxonomy preferences for a user
   */
  async getUserTaxonomyPreferences(userId: number): Promise<UserTaxonomyPreference[]> {
    return db.select().from(userTaxonomyPreferences)
      .where(eq(userTaxonomyPreferences.userId, userId))
      .orderBy(asc(userTaxonomyPreferences.name));
  }

  /**
   * Get user's default taxonomy preference
   */
  async getUserDefaultTaxonomyPreference(userId: number): Promise<UserTaxonomyPreference | undefined> {
    const results = await db.select().from(userTaxonomyPreferences)
      .where(and(
        eq(userTaxonomyPreferences.userId, userId),
        eq(userTaxonomyPreferences.isDefault, true)
      ))
      .limit(1);
    
    return results.length > 0 ? results[0] : undefined;
  }

  /**
   * Get all custom view taxonomy preferences for a user
   */
  async getUserCustomViewPreferences(userId: number): Promise<UserTaxonomyPreference[]> {
    return db.select().from(userTaxonomyPreferences)
      .where(and(
        eq(userTaxonomyPreferences.userId, userId),
        eq(userTaxonomyPreferences.isCustomView, true)
      ))
      .orderBy(asc(userTaxonomyPreferences.name));
  }

  /**
   * Get taxonomy preference by ID
   */
  async getTaxonomyPreferenceById(preferenceId: number): Promise<UserTaxonomyPreference | undefined> {
    const results = await db.select().from(userTaxonomyPreferences)
      .where(eq(userTaxonomyPreferences.id, preferenceId))
      .limit(1);
    
    return results.length > 0 ? results[0] : undefined;
  }

  /**
   * Create a new taxonomy preference
   */
  async createTaxonomyPreference(preferenceData: InsertUserTaxonomyPreference): Promise<UserTaxonomyPreference> {
    // If this is being set as default, remove default from all others
    if (preferenceData.isDefault) {
      await db.update(userTaxonomyPreferences)
        .set({ isDefault: false })
        .where(eq(userTaxonomyPreferences.userId, preferenceData.userId));
    }
    
    const [newPreference] = await db.insert(userTaxonomyPreferences)
      .values(preferenceData)
      .returning();
    
    return newPreference;
  }

  /**
   * Update a taxonomy preference
   */
  async updateTaxonomyPreference(preferenceId: number, preferenceData: Partial<UserTaxonomyPreference>): Promise<UserTaxonomyPreference | null> {
    const currentPreference = await this.getTaxonomyPreferenceById(preferenceId);
    if (!currentPreference) return null;
    
    // If this is being set as default, remove default from all others
    if (preferenceData.isDefault && !currentPreference.isDefault) {
      await db.update(userTaxonomyPreferences)
        .set({ isDefault: false })
        .where(eq(userTaxonomyPreferences.userId, currentPreference.userId));
    }
    
    const [updatedPreference] = await db.update(userTaxonomyPreferences)
      .set({
        ...preferenceData,
        updatedAt: new Date()
      })
      .where(eq(userTaxonomyPreferences.id, preferenceId))
      .returning();
    
    return updatedPreference;
  }

  /**
   * Delete a taxonomy preference
   */
  async deleteTaxonomyPreference(preferenceId: number): Promise<void> {
    await db.delete(userTaxonomyPreferences)
      .where(eq(userTaxonomyPreferences.id, preferenceId));
  }

  /**
   * Get taxonomy items for a preference
   */
  async getTaxonomyItems(preferenceId: number): Promise<Array<UserTaxonomyItem & { name: string; description: string | null }>> {
    return db.select({
      id: userTaxonomyItems.id,
      preferenceId: userTaxonomyItems.preferenceId,
      taxonomyId: userTaxonomyItems.taxonomyId,
      type: userTaxonomyItems.type,
      rank: userTaxonomyItems.rank,
      createdAt: userTaxonomyItems.createdAt,
      name: genreTaxonomies.name,
      description: genreTaxonomies.description
    })
    .from(userTaxonomyItems)
    .innerJoin(genreTaxonomies, eq(userTaxonomyItems.taxonomyId, genreTaxonomies.id))
    .where(eq(userTaxonomyItems.preferenceId, preferenceId))
    .orderBy(asc(userTaxonomyItems.rank));
  }

  /**
   * Add taxonomy items to a preference
   */
  async addTaxonomyItems(items: InsertUserTaxonomyItem[]): Promise<UserTaxonomyItem[]> {
    if (items.length === 0) return [];
    
    const newItems = await db.insert(userTaxonomyItems)
      .values(items)
      .returning();
    
    return newItems;
  }

  /**
   * Replace all taxonomy items for a preference
   */
  async replaceTaxonomyItems(preferenceId: number, items: Omit<InsertUserTaxonomyItem, "preferenceId">[]): Promise<UserTaxonomyItem[]> {
    // Delete all existing items
    await db.delete(userTaxonomyItems)
      .where(eq(userTaxonomyItems.preferenceId, preferenceId));
    
    if (items.length === 0) return [];
    
    // Add new items
    const newItems = await db.insert(userTaxonomyItems)
      .values(items.map(item => ({
        ...item,
        preferenceId
      })))
      .returning();
    
    return newItems;
  }
}