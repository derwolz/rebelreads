import { db } from '../db';
import { homepageLayouts, HomepageSection, InsertHomepageLayout } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface IHomepageLayoutStorage {
  getHomepageLayout(userId: number): Promise<HomepageSection[] | null>;
  saveHomepageLayout(userId: number, sections: HomepageSection[]): Promise<HomepageSection[]>;
}

export class HomepageLayoutStorage implements IHomepageLayoutStorage {
  async getHomepageLayout(userId: number): Promise<HomepageSection[] | null> {
    try {
      const layout = await db.query.homepageLayouts.findFirst({
        where: eq(homepageLayouts.userId, userId)
      });
      
      return layout ? layout.sections : null;
    } catch (error) {
      console.error('Error getting homepage layout:', error);
      throw error;
    }
  }

  async saveHomepageLayout(userId: number, sections: HomepageSection[]): Promise<HomepageSection[]> {
    try {
      // Check if layout exists
      const existingLayout = await db.query.homepageLayouts.findFirst({
        where: eq(homepageLayouts.userId, userId)
      });

      const now = new Date();

      if (existingLayout) {
        // Update existing layout
        await db
          .update(homepageLayouts)
          .set({ 
            sections, 
            updatedAt: now 
          })
          .where(eq(homepageLayouts.userId, userId));
      } else {
        // Create new layout
        const newLayout: InsertHomepageLayout = {
          userId,
          sections,
          createdAt: now,
          updatedAt: now
        };
        
        await db.insert(homepageLayouts).values(newLayout);
      }

      return sections;
    } catch (error) {
      console.error('Error saving homepage layout:', error);
      throw error;
    }
  }
}