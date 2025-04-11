import { 
  eq, 
  and, 
  asc, 
  desc,
  inArray,
  sql
} from "drizzle-orm";
import { 
  db,
  pool
} from "../db";
import {
  userTaxonomyPreferences,
  userTaxonomyItems,
  genreTaxonomies,
  UserTaxonomyPreference,
  UserTaxonomyItem,
  InsertUserTaxonomyPreference,
  InsertUserTaxonomyItem
} from "../../shared/schema";

/**
 * Class for managing user taxonomy preferences in the database
 */
export class UserTaxonomyStorage {
  /**
   * Get all taxonomy preferences for a user
   */
  async getUserTaxonomyPreferences(userId: number): Promise<UserTaxonomyPreference[]> {
    return db.select()
      .from(userTaxonomyPreferences)
      .where(eq(userTaxonomyPreferences.userId, userId))
      .orderBy(desc(userTaxonomyPreferences.updatedAt));
  }
  
  /**
   * Get the default taxonomy preference for a user
   */
  async getUserDefaultTaxonomyPreference(userId: number): Promise<UserTaxonomyPreference | undefined> {
    const results = await db.select()
      .from(userTaxonomyPreferences)
      .where(
        and(
          eq(userTaxonomyPreferences.userId, userId),
          eq(userTaxonomyPreferences.isDefault, true)
        )
      )
      .limit(1);
    
    return results[0];
  }
  
  /**
   * Get custom view preferences for a user
   */
  async getUserCustomViewPreferences(userId: number): Promise<UserTaxonomyPreference[]> {
    return db.select()
      .from(userTaxonomyPreferences)
      .where(
        and(
          eq(userTaxonomyPreferences.userId, userId),
          eq(userTaxonomyPreferences.isCustomView, true)
        )
      )
      .orderBy(desc(userTaxonomyPreferences.updatedAt));
  }
  
  /**
   * Get a taxonomy preference by ID
   */
  async getTaxonomyPreferenceById(id: number): Promise<UserTaxonomyPreference | undefined> {
    const results = await db.select()
      .from(userTaxonomyPreferences)
      .where(eq(userTaxonomyPreferences.id, id))
      .limit(1);
    
    return results[0];
  }
  
  /**
   * Create a new taxonomy preference
   */
  async createTaxonomyPreference(data: InsertUserTaxonomyPreference): Promise<UserTaxonomyPreference> {
    // Start a transaction
    return pool.transaction(async (tx) => {
      // If this is set as default, update any existing default to non-default
      if (data.isDefault) {
        await tx.update(userTaxonomyPreferences)
          .set({ isDefault: false })
          .where(
            and(
              eq(userTaxonomyPreferences.userId, data.userId),
              eq(userTaxonomyPreferences.isDefault, true)
            )
          );
      }
      
      const result = await tx.insert(userTaxonomyPreferences)
        .values(data)
        .returning();
      
      return result[0];
    });
  }
  
  /**
   * Update an existing taxonomy preference
   */
  async updateTaxonomyPreference(
    id: number, 
    data: Partial<Omit<UserTaxonomyPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserTaxonomyPreference> {
    // Start a transaction
    return pool.transaction(async (tx) => {
      // If this is set as default, update any existing default to non-default
      if (data.isDefault) {
        const preference = await this.getTaxonomyPreferenceById(id);
        if (preference) {
          await tx.update(userTaxonomyPreferences)
            .set({ isDefault: false })
            .where(
              and(
                eq(userTaxonomyPreferences.userId, preference.userId),
                eq(userTaxonomyPreferences.isDefault, true),
                sql`${userTaxonomyPreferences.id} != ${id}`
              )
            );
        }
      }
      
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await tx.update(userTaxonomyPreferences)
        .set(updateData)
        .where(eq(userTaxonomyPreferences.id, id))
        .returning();
      
      return result[0];
    });
  }
  
  /**
   * Delete a taxonomy preference
   */
  async deleteTaxonomyPreference(id: number): Promise<void> {
    // First delete all associated taxonomy items
    await db.delete(userTaxonomyItems)
      .where(eq(userTaxonomyItems.preferenceId, id));
    
    // Then delete the preference
    await db.delete(userTaxonomyPreferences)
      .where(eq(userTaxonomyPreferences.id, id));
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
        name: genreTaxonomies.name,
        description: genreTaxonomies.description
      })
      .from(userTaxonomyItems)
      .innerJoin(
        genreTaxonomies, 
        eq(userTaxonomyItems.taxonomyId, genreTaxonomies.id)
      )
      .where(eq(userTaxonomyItems.preferenceId, preferenceId))
      .orderBy(asc(userTaxonomyItems.rank));
  }
  
  /**
   * Add taxonomy items to a preference
   */
  async addTaxonomyItems(
    preferenceId: number, 
    items: Array<Omit<InsertUserTaxonomyItem, 'preferenceId'>>
  ): Promise<UserTaxonomyItem[]> {
    if (items.length === 0) {
      return [];
    }
    
    const result = await db.insert(userTaxonomyItems)
      .values(items.map(item => ({
        ...item,
        preferenceId
      })))
      .returning();
    
    return result;
  }
  
  /**
   * Replace all taxonomy items for a preference
   */
  async replaceTaxonomyItems(
    preferenceId: number, 
    items: Array<Omit<InsertUserTaxonomyItem, 'preferenceId'>>
  ): Promise<UserTaxonomyItem[]> {
    return pool.transaction(async (tx) => {
      // Delete existing items
      await tx.delete(userTaxonomyItems)
        .where(eq(userTaxonomyItems.preferenceId, preferenceId));
      
      // Skip insert if no items provided
      if (items.length === 0) {
        return [];
      }
      
      // Insert new items
      const result = await tx.insert(userTaxonomyItems)
        .values(items.map(item => ({
          ...item,
          preferenceId
        })))
        .returning();
      
      return result;
    });
  }
}