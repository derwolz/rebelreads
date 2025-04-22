import { db } from "../db";
import { homepageLayouts, type HomepageSection } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";

export interface IHomepageLayoutStorage {
  getHomepageLayout(userId: number): Promise<HomepageSection[]>;
  updateHomepageLayout(userId: number, sections: HomepageSection[]): Promise<HomepageSection[]>;
}

export class HomepageLayoutStorage implements IHomepageLayoutStorage {
  /**
   * Get homepage layout for a specific user
   * If no layout exists, returns the default layout
   */
  async getHomepageLayout(userId: number): Promise<HomepageSection[]> {
    try {
      // Try to get the user's custom layout
      const layoutResults = await db
        .select()
        .from(homepageLayouts)
        .where(eq(homepageLayouts.userId, userId));

      // If user has a custom layout, return it
      if (layoutResults.length > 0 && layoutResults[0].sections) {
        return layoutResults[0].sections as HomepageSection[];
      }

      // Otherwise, return the default layout
      return this.getDefaultLayout();
    } catch (error) {
      log(`Error getting homepage layout: ${error}`, "homepage-layout");
      throw error;
    }
  }

  /**
   * Update homepage layout for a specific user
   */
  async updateHomepageLayout(userId: number, sections: HomepageSection[]): Promise<HomepageSection[]> {
    try {
      // Check if user already has a layout
      const existing = await db
        .select()
        .from(homepageLayouts)
        .where(eq(homepageLayouts.userId, userId));

      if (existing.length === 0) {
        // Create new layout record
        await db.insert(homepageLayouts).values({
          userId,
          sections: sections as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Update existing layout
        await db
          .update(homepageLayouts)
          .set({
            sections: sections as any,
            updatedAt: new Date(),
          })
          .where(eq(homepageLayouts.userId, userId));
      }

      return sections;
    } catch (error) {
      log(`Error updating homepage layout: ${error}`, "homepage-layout");
      throw error;
    }
  }

  /**
   * Get the default homepage layout
   */
  private getDefaultLayout(): HomepageSection[] {
    return [
      {
        id: "default-authors-you-follow",
        type: "authors_you_follow",
        displayMode: "carousel",
        title: "Authors You Follow",
        itemCount: 10,
        visible: true,
      },
      {
        id: "default-popular",
        type: "popular",
        displayMode: "carousel",
        title: "Popular Books",
        itemCount: 10,
        visible: true,
      },
      {
        id: "default-you-may-also-like",
        type: "you_may_also_like",
        displayMode: "carousel",
        title: "You May Also Like",
        itemCount: 10,
        visible: true,
      },
      {
        id: "default-wishlist",
        type: "wishlist",
        displayMode: "carousel",
        title: "Your Wishlist",
        itemCount: 10,
        visible: true,
      },
      {
        id: "default-unreviewed",
        type: "unreviewed",
        displayMode: "carousel",
        title: "Books to Review",
        itemCount: 10,
        visible: true,
      },
      {
        id: "default-reviewed",
        type: "reviewed",
        displayMode: "carousel",
        title: "Your Reviewed Books",
        itemCount: 10,
        visible: true,
      },
      {
        id: "default-completed",
        type: "completed",
        displayMode: "carousel",
        title: "Completed Books",
        itemCount: 10,
        visible: true,
      },
      {
        id: "default-coming-soon",
        type: "coming_soon",
        displayMode: "carousel",
        title: "Coming Soon",
        itemCount: 10,
        visible: true,
      },
    ];
  }
}

// Create a singleton instance
export const homepageLayoutStorage = new HomepageLayoutStorage();