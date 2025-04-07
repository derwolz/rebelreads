import {
  AuthorAnalytics,
  InsertAuthorAnalytics,
  AuthorPageView,
  InsertAuthorPageView,
  AuthorFormAnalytics,
  InsertAuthorFormAnalytics,
  authorAnalytics,
  authorPageViews,
  authorFormAnalytics
} from "@shared/schema";
import { db } from "../db";
import { eq, and, between, sql, SQL } from "drizzle-orm";
import { subDays } from "date-fns";

export interface IAuthorAnalyticsStorage {
  // General author actions tracking
  recordAuthorAction(data: InsertAuthorAnalytics): Promise<AuthorAnalytics>;
  getAuthorActions(
    authorId: number, 
    actionTypes?: string[], 
    startDate?: Date, 
    endDate?: Date
  ): Promise<AuthorAnalytics[]>;
  
  // Page view tracking
  recordPageView(data: InsertAuthorPageView): Promise<AuthorPageView>;
  updatePageViewExit(id: number, exitedAt: Date): Promise<AuthorPageView>;
  getAuthorPageViews(
    authorId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<AuthorPageView[]>;
  
  // Form tracking
  recordFormAnalytics(data: InsertAuthorFormAnalytics): Promise<AuthorFormAnalytics>;
  updateFormStatus(
    id: number, 
    status: string, 
    completedAt?: Date,
    formData?: any,
    abandonedStep?: string
  ): Promise<AuthorFormAnalytics>;
  getAuthorFormAnalytics(
    authorId: number, 
    formIds?: string[],
    startDate?: Date, 
    endDate?: Date
  ): Promise<AuthorFormAnalytics[]>;
  
  // Aggregated analytics
  getAuthorActivitySummary(
    authorId: number, 
    days: number
  ): Promise<{
    actionCounts: { [actionType: string]: number },
    pageViews: { [pageUrl: string]: number },
    formCompletionRates: { [formId: string]: { started: number, completed: number, rate: number } },
    totalTimeSpent: number
  }>;
}

export class AuthorAnalyticsStorage implements IAuthorAnalyticsStorage {
  // General author actions tracking
  async recordAuthorAction(data: InsertAuthorAnalytics): Promise<AuthorAnalytics> {
    const [record] = await db
      .insert(authorAnalytics)
      .values(data)
      .returning();
    return record;
  }
  
  async getAuthorActions(
    authorId: number, 
    actionTypes?: string[], 
    startDate?: Date, 
    endDate?: Date
  ): Promise<AuthorAnalytics[]> {
    // Start with the base condition
    const conditions = [eq(authorAnalytics.authorId, authorId)];
    
    // Add additional conditions if provided
    if (actionTypes && actionTypes.length > 0) {
      conditions.push(sql`${authorAnalytics.actionType} IN (${sql.join(actionTypes, sql`, `)})`);
    }
    
    if (startDate) {
      conditions.push(sql`${authorAnalytics.timestamp} >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`${authorAnalytics.timestamp} <= ${endDate}`);
    }
    
    // Use a single and() call with all conditions
    return await db
      .select()
      .from(authorAnalytics)
      .where(and(...conditions))
      .orderBy(authorAnalytics.timestamp);
  }
  
  // Page view tracking
  async recordPageView(data: InsertAuthorPageView): Promise<AuthorPageView> {
    const [record] = await db
      .insert(authorPageViews)
      .values(data)
      .returning();
    return record;
  }
  
  async updatePageViewExit(id: number, exitedAt: Date): Promise<AuthorPageView> {
    const [record] = await db
      .update(authorPageViews)
      .set({
        exitedAt,
        duration: sql`EXTRACT(EPOCH FROM (${exitedAt}::timestamp - ${authorPageViews.enteredAt}::timestamp))::integer`
      })
      .where(eq(authorPageViews.id, id))
      .returning();
    return record;
  }
  
  async getAuthorPageViews(
    authorId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<AuthorPageView[]> {
    // Start with the base condition
    const conditions = [eq(authorPageViews.authorId, authorId)];
    
    // Add additional conditions if provided
    if (startDate) {
      conditions.push(sql`${authorPageViews.enteredAt} >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`${authorPageViews.enteredAt} <= ${endDate}`);
    }
    
    // Use a single and() call with all conditions
    return await db
      .select()
      .from(authorPageViews)
      .where(and(...conditions))
      .orderBy(authorPageViews.enteredAt);
  }
  
  // Form tracking
  async recordFormAnalytics(data: InsertAuthorFormAnalytics): Promise<AuthorFormAnalytics> {
    const [record] = await db
      .insert(authorFormAnalytics)
      .values(data)
      .returning();
    return record;
  }
  
  async updateFormStatus(
    id: number, 
    status: string, 
    completedAt?: Date,
    formData?: any,
    abandonedStep?: string
  ): Promise<AuthorFormAnalytics> {
    // Create a base updates object
    const updates: any = { 
      status 
    };
    
    if (completedAt) {
      updates.completedAt = completedAt;
      // We'll calculate the duration after the initial update
    }
    
    if (formData) {
      updates.formData = formData;
    }
    
    if (abandonedStep) {
      updates.abandonedStep = abandonedStep;
    }
    
    // Update the record first
    const [record] = await db
      .update(authorFormAnalytics)
      .set(updates)
      .where(eq(authorFormAnalytics.id, id))
      .returning();
    
    // If we need to update the duration, do it in a separate query
    if (completedAt) {
      // First get the startedAt value
      const [formRecord] = await db
        .select({ startedAt: authorFormAnalytics.startedAt })
        .from(authorFormAnalytics)
        .where(eq(authorFormAnalytics.id, id));
      
      if (formRecord) {
        const startedAt = formRecord.startedAt;
        const durationInSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);
        
        // Now update with the calculated duration
        const [updatedRecord] = await db
          .update(authorFormAnalytics)
          .set({ duration: durationInSeconds })
          .where(eq(authorFormAnalytics.id, id))
          .returning();
        
        return updatedRecord;
      }
    }
    
    return record;
  }
  
  async getAuthorFormAnalytics(
    authorId: number, 
    formIds?: string[],
    startDate?: Date, 
    endDate?: Date
  ): Promise<AuthorFormAnalytics[]> {
    // Start with the base condition
    const conditions = [eq(authorFormAnalytics.authorId, authorId)];
    
    // Add additional conditions if provided
    if (formIds && formIds.length > 0) {
      conditions.push(sql`${authorFormAnalytics.formId} IN (${sql.join(formIds, sql`, `)})`);
    }
    
    if (startDate) {
      conditions.push(sql`${authorFormAnalytics.startedAt} >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`${authorFormAnalytics.startedAt} <= ${endDate}`);
    }
    
    // Use a single and() call with all conditions
    return await db
      .select()
      .from(authorFormAnalytics)
      .where(and(...conditions))
      .orderBy(authorFormAnalytics.startedAt);
  }
  
  // Aggregated analytics
  async getAuthorActivitySummary(
    authorId: number, 
    days: number = 30
  ): Promise<{
    actionCounts: { [actionType: string]: number },
    pageViews: { [pageUrl: string]: number },
    formCompletionRates: { [formId: string]: { started: number, completed: number, rate: number } },
    totalTimeSpent: number
  }> {
    const startDate = subDays(new Date(), days);
    
    // Get action counts by type
    const actionResults = await db
      .select({
        actionType: authorAnalytics.actionType,
        count: sql<number>`count(*)::int`
      })
      .from(authorAnalytics)
      .where(and(
        eq(authorAnalytics.authorId, authorId),
        sql`${authorAnalytics.timestamp} >= ${startDate}`
      ))
      .groupBy(authorAnalytics.actionType);
    
    const actionCounts: { [actionType: string]: number } = {};
    for (const result of actionResults) {
      actionCounts[result.actionType] = result.count;
    }
    
    // Get page view counts
    const pageViewResults = await db
      .select({
        pageUrl: authorPageViews.pageUrl,
        count: sql<number>`count(*)::int`
      })
      .from(authorPageViews)
      .where(and(
        eq(authorPageViews.authorId, authorId),
        sql`${authorPageViews.enteredAt} >= ${startDate}`
      ))
      .groupBy(authorPageViews.pageUrl);
    
    const pageViews: { [pageUrl: string]: number } = {};
    for (const result of pageViewResults) {
      pageViews[result.pageUrl] = result.count;
    }
    
    // Get form completion rates
    const formStartedResults = await db
      .select({
        formId: authorFormAnalytics.formId,
        count: sql<number>`count(*)::int`
      })
      .from(authorFormAnalytics)
      .where(and(
        eq(authorFormAnalytics.authorId, authorId),
        sql`${authorFormAnalytics.startedAt} >= ${startDate}`
      ))
      .groupBy(authorFormAnalytics.formId);
    
    const formCompletedResults = await db
      .select({
        formId: authorFormAnalytics.formId,
        count: sql<number>`count(*)::int`
      })
      .from(authorFormAnalytics)
      .where(and(
        eq(authorFormAnalytics.authorId, authorId),
        sql`${authorFormAnalytics.startedAt} >= ${startDate}`,
        eq(authorFormAnalytics.status, "completed")
      ))
      .groupBy(authorFormAnalytics.formId);
    
    const formCompletionRates: { [formId: string]: { started: number, completed: number, rate: number } } = {};
    
    for (const result of formStartedResults) {
      formCompletionRates[result.formId] = {
        started: result.count,
        completed: 0,
        rate: 0
      };
    }
    
    for (const result of formCompletedResults) {
      if (formCompletionRates[result.formId]) {
        formCompletionRates[result.formId].completed = result.count;
        formCompletionRates[result.formId].rate = 
          result.count / formCompletionRates[result.formId].started;
      } else {
        formCompletionRates[result.formId] = {
          started: 0,
          completed: result.count,
          rate: 1 // All completed
        };
      }
    }
    
    // Calculate total time spent
    const pageViewDuration = await db
      .select({
        totalDuration: sql<number>`SUM(COALESCE(${authorPageViews.duration}, 0))::int`,
      })
      .from(authorPageViews)
      .where(and(
        eq(authorPageViews.authorId, authorId),
        sql`${authorPageViews.enteredAt} >= ${startDate}`
      ));
    
    const formDuration = await db
      .select({
        totalDuration: sql<number>`SUM(COALESCE(${authorFormAnalytics.duration}, 0))::int`,
      })
      .from(authorFormAnalytics)
      .where(and(
        eq(authorFormAnalytics.authorId, authorId),
        sql`${authorFormAnalytics.startedAt} >= ${startDate}`
      ));
    
    const totalTimeSpent = (pageViewDuration[0]?.totalDuration || 0) + 
                          (formDuration[0]?.totalDuration || 0);
    
    return {
      actionCounts,
      pageViews,
      formCompletionRates,
      totalTimeSpent
    };
  }
}