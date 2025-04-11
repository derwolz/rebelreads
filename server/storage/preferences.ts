import { db } from "../db";
import { 
  users, 
  preferenceTaxonomies, 
  userPreferenceTaxonomies,
  InsertPreferenceTaxonomy,
  InsertUserPreferenceTaxonomy,
  PreferenceTaxonomy,
  UserPreferenceTaxonomy
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class PreferencesStorage {
  // Get all preference taxonomies
  async getPreferenceTaxonomies(): Promise<PreferenceTaxonomy[]> {
    return await db.select().from(preferenceTaxonomies).where(eq(preferenceTaxonomies.isActive, true));
  }

  // Get preference taxonomies for a specific user
  async getUserPreferenceTaxonomies(userId: number): Promise<(PreferenceTaxonomy & { position: number, weight: number })[]> {
    const results = await db
      .select({
        id: preferenceTaxonomies.id,
        name: preferenceTaxonomies.name, 
        description: preferenceTaxonomies.description,
        taxonomyType: preferenceTaxonomies.taxonomyType,
        isActive: preferenceTaxonomies.isActive,
        createdAt: preferenceTaxonomies.createdAt,
        updatedAt: preferenceTaxonomies.updatedAt,
        position: userPreferenceTaxonomies.position,
        weight: userPreferenceTaxonomies.weight
      })
      .from(userPreferenceTaxonomies)
      .innerJoin(
        preferenceTaxonomies, 
        eq(userPreferenceTaxonomies.taxonomyId, preferenceTaxonomies.id)
      )
      .where(and(
        eq(userPreferenceTaxonomies.userId, userId),
        eq(preferenceTaxonomies.isActive, true)
      ))
      .orderBy(userPreferenceTaxonomies.position);
    
    // Convert weight from string to number if needed
    return results.map(item => ({
      ...item,
      weight: typeof item.weight === 'string' ? parseFloat(item.weight) : item.weight
    }));
  }

  // Create a new preference taxonomy
  async createPreferenceTaxonomy(data: InsertPreferenceTaxonomy): Promise<PreferenceTaxonomy> {
    const result = await db.insert(preferenceTaxonomies).values(data).returning();
    return result[0];
  }

  // Create a user-preference taxonomy relation
  async createUserPreferenceTaxonomy(data: InsertUserPreferenceTaxonomy): Promise<UserPreferenceTaxonomy> {
    // Check if relation already exists
    const existing = await db.select()
      .from(userPreferenceTaxonomies)
      .where(and(
        eq(userPreferenceTaxonomies.userId, data.userId),
        eq(userPreferenceTaxonomies.taxonomyId, data.taxonomyId)
      ));

    if (existing.length > 0) {
      // Update existing relation
      const updated = await db.update(userPreferenceTaxonomies)
        .set({
          position: data.position,
          weight: data.weight,
          updatedAt: new Date()
        })
        .where(and(
          eq(userPreferenceTaxonomies.userId, data.userId),
          eq(userPreferenceTaxonomies.taxonomyId, data.taxonomyId)
        ))
        .returning();
      return updated[0];
    }

    // Create new relation
    const result = await db.insert(userPreferenceTaxonomies).values(data).returning();
    return result[0];
  }

  // Update a user's favorite genres (directly in users table)
  async updateUserFavoriteGenres(userId: number, genres: string[]): Promise<void> {
    await db.update(users)
      .set({ favoriteGenres: genres })
      .where(eq(users.id, userId));
  }

  // Delete a user preference taxonomy
  async deleteUserPreferenceTaxonomy(userId: number, taxonomyId: number): Promise<void> {
    await db.delete(userPreferenceTaxonomies)
      .where(and(
        eq(userPreferenceTaxonomies.userId, userId),
        eq(userPreferenceTaxonomies.taxonomyId, taxonomyId)
      ));
  }
}