import { db } from "../db";
import { homepageLayouts, HomepageSection } from "@shared/schema";
import { eq } from "drizzle-orm";

export class HomepageLayoutStorage {
  async getHomepageLayout(userId: number): Promise<HomepageSection[]> {
    // Find the layout for the user
    const layout = await db.query.homepageLayouts.findFirst({
      where: eq(homepageLayouts.userId, userId),
    });

    if (!layout) {
      // Create a default layout if none exists
      const defaultSections: HomepageSection[] = [
        {
          id: "authors-you-follow",
          type: "authors_you_follow",
          displayMode: "carousel",
          title: "Authors You Follow",
          itemCount: 12,
          visible: true,
        },
        {
          id: "popular",
          type: "popular",
          displayMode: "carousel",
          title: "Popular Books",
          itemCount: 12,
          visible: true,
        },
        {
          id: "you-may-like",
          type: "you_may_also_like",
          displayMode: "carousel",
          title: "You May Also Like",
          itemCount: 12,
          visible: true,
        },
        {
          id: "wishlist",
          type: "wishlist",
          displayMode: "grid",
          title: "Your Wishlist",
          itemCount: 12,
          visible: true,
        },
        {
          id: "unreviewed",
          type: "unreviewed",
          displayMode: "carousel",
          title: "Books To Review",
          itemCount: 8,
          visible: true,
        },
        {
          id: "reviewed",
          type: "reviewed",
          displayMode: "carousel",
          title: "Your Reviewed Books",
          itemCount: 8,
          visible: true,
        },
        {
          id: "completed",
          type: "completed",
          displayMode: "grid",
          title: "Completed Books",
          itemCount: 12,
          visible: true,
        }
      ];

      // Create the new layout
      await db.insert(homepageLayouts).values({
        userId,
        sections: defaultSections,
      });

      return defaultSections;
    }

    return layout.sections;
  }

  async updateHomepageLayout(userId: number, sections: HomepageSection[]): Promise<HomepageSection[]> {
    // Check if the user has a layout
    const existingLayout = await db.query.homepageLayouts.findFirst({
      where: eq(homepageLayouts.userId, userId),
    });

    if (existingLayout) {
      // Update existing layout
      await db.update(homepageLayouts)
        .set({ 
          sections, 
          updatedAt: new Date() 
        })
        .where(eq(homepageLayouts.userId, userId));
    } else {
      // Create new layout
      await db.insert(homepageLayouts).values({
        userId,
        sections,
      });
    }

    return sections;
  }
}