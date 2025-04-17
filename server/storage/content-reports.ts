import { Pool } from 'pg';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { ContentReport, InsertContentReport, contentReports } from '../../shared/schema';

export interface IContentReportStorage {
  getContentReports(): Promise<ContentReport[]>;
  getContentReportsByBook(bookId: number): Promise<ContentReport[]>;
  getContentReportsByUser(userId: number): Promise<ContentReport[]>;
  getContentReport(id: number): Promise<ContentReport | null>;
  createContentReport(data: InsertContentReport): Promise<ContentReport>;
  updateContentReportStatus(id: number, status: string, adminNotes?: string): Promise<ContentReport | null>;
  deleteContentReport(id: number): Promise<boolean>;
}

export class ContentReportStorage implements IContentReportStorage {
  async getContentReports(): Promise<ContentReport[]> {
    return await db.select().from(contentReports).orderBy(contentReports.createdAt);
  }

  async getContentReportsByBook(bookId: number): Promise<ContentReport[]> {
    return await db.select().from(contentReports)
      .where(eq(contentReports.bookId, bookId))
      .orderBy(contentReports.createdAt);
  }

  async getContentReportsByUser(userId: number): Promise<ContentReport[]> {
    return await db.select().from(contentReports)
      .where(eq(contentReports.userId, userId))
      .orderBy(contentReports.createdAt);
  }

  async getContentReport(id: number): Promise<ContentReport | null> {
    const results = await db.select().from(contentReports)
      .where(eq(contentReports.id, id));
    return results.length > 0 ? results[0] : null;
  }

  async createContentReport(data: InsertContentReport): Promise<ContentReport> {
    const result = await db.insert(contentReports).values(data).returning();
    return result[0];
  }

  async updateContentReportStatus(id: number, status: string, adminNotes?: string): Promise<ContentReport | null> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    
    const result = await db.update(contentReports)
      .set(updateData)
      .where(eq(contentReports.id, id))
      .returning();
      
    return result.length > 0 ? result[0] : null;
  }

  async deleteContentReport(id: number): Promise<boolean> {
    const result = await db.delete(contentReports)
      .where(eq(contentReports.id, id))
      .returning({ id: contentReports.id });
      
    return result.length > 0;
  }
}