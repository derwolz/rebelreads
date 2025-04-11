import { db } from "../db";
import { homepageLayouts, HomepageSection } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Interface for Homepage Layout Storage operations
 */
export interface IHomepageLayoutStorage {
  getHomepageLayout(userId: number): Promise<HomepageSection[]>;
  updateHomepageLayout(userId: number, sections: HomepageSection[]): Promise<HomepageSection[]>;
}

/**
 * Storage class for handling homepage layout operations
 */
export class HomepageLayoutStorage implements IHomepageLayoutStorage {
  /**
   * Get the homepage layout for a user
   * 
   * @param userId The ID of the user
   * @returns Array of homepage sections
   */
  async getHomepageLayout(userId: number): Promise<HomepageSection[]> {
    try {
      // Attempt to find the user's homepage layout
      const layout = await db.query.homepageLayouts.findFirst({
        where: eq(homepageLayouts.userId, userId),
      });

      // If layout exists, return the sections
      if (layout) {
        return layout.sections;
      }

      // Otherwise return empty array (will be populated with defaults by the frontend)
      return [];
    } catch (error) {
      console.error("Error getting homepage layout:", error);
      throw new Error("Failed to get homepage layout");
    }
  }

  /**
   * Update the homepage layout for a user
   * 
   * @param userId The ID of the user
   * @param sections The homepage sections to save
   * @returns The updated homepage sections
   */
  async updateHomepageLayout(userId: number, sections: HomepageSection[]): Promise<HomepageSection[]> {
    try {
      // Check if user already has a layout
      const existingLayout = await db.query.homepageLayouts.findFirst({
        where: eq(homepageLayouts.userId, userId),
      });

      if (existingLayout) {
        // Update existing layout
        await db.update(homepageLayouts)
          .set({ 
            sections,
            updatedAt: new Date(),
          })
          .where(eq(homepageLayouts.userId, userId));
      } else {
        // Create new layout
        await db.insert(homepageLayouts)
          .values({
            userId,
            sections,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }

      return sections;
    } catch (error) {
      console.error("Error updating homepage layout:", error);
      throw new Error("Failed to update homepage layout");
    }
  }
}