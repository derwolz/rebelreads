import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { sql, eq, desc, and, between } from "drizzle-orm";
import { db } from "../db";
import { 
  authorAnalytics, 
  authorPageViews, 
  authorFormAnalytics, 
  users,
  books
} from "@shared/schema";
import { subDays } from "date-fns";

const router = Router();

// Check if user is admin
router.get("/check", adminAuthMiddleware, (req: Request, res: Response) => {
  res.json({ isAdmin: true });
});

// Temporary debug route without auth middleware for troubleshooting
router.get("/debug-auth", (req: Request, res: Response) => {
  console.log('Debug auth route - User object:', req.user);
  console.log('Debug auth route - isAuthenticated:', req.isAuthenticated());
  res.json({ 
    authenticated: req.isAuthenticated(),
    userId: req.user?.id,
    userEmail: req.user?.email,
    userIsAuthor: req.user?.isAuthor,
    user: req.user
  });
});

// Get aggregate user stats
router.get("/analytics/user-stats", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Get total users
    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);
    
    // Get total authors
    const [totalAuthors] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isAuthor, true));
    
    // Since we don't have createdAt field, we'll simplify the response
    const newUsersData: { date: string; count: number }[] = [];
    
    res.json({
      totalUsers: totalUsers.count,
      totalAuthors: totalAuthors.count,
      newUsers: newUsersData
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ error: "Failed to retrieve user statistics" });
  }
});

// Get all page views data for admins
router.get("/analytics/page-views", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { days = "30", authorId } = req.query;
    
    const startDate = subDays(new Date(), parseInt(days as string));
    
    // Base conditions
    const conditions = [sql`${authorPageViews.enteredAt} >= ${startDate}`];
    
    // Add author condition if provided
    if (authorId && !isNaN(parseInt(authorId as string))) {
      conditions.push(eq(authorPageViews.authorId, parseInt(authorId as string)));
    }
    
    // Get page view counts by URL
    const pageViewsByUrl = await db
      .select({
        pageUrl: authorPageViews.pageUrl,
        count: sql<number>`count(*)::int`,
        avgDuration: sql<number>`avg(COALESCE(${authorPageViews.duration}, 0))::int`
      })
      .from(authorPageViews)
      .where(and(...conditions))
      .groupBy(authorPageViews.pageUrl)
      .orderBy(desc(sql<number>`count(*)`));
    
    // Get page views by date
    const pageViewsByDate = await db
      .select({
        date: sql<string>`date_trunc('day', ${authorPageViews.enteredAt})::date::text`,
        count: sql<number>`count(*)::int`
      })
      .from(authorPageViews)
      .where(and(...conditions))
      .groupBy(sql`date_trunc('day', ${authorPageViews.enteredAt})`)
      .orderBy(sql`date_trunc('day', ${authorPageViews.enteredAt})`);
    
    res.json({
      pageViewsByUrl,
      pageViewsByDate
    });
  } catch (error) {
    console.error("Error getting page views data:", error);
    res.status(500).json({ error: "Failed to retrieve page views data" });
  }
});

// Get all author actions for admins
router.get("/analytics/author-actions", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { days = "30", authorId } = req.query;
    
    const startDate = subDays(new Date(), parseInt(days as string));
    
    // Base conditions
    const conditions = [sql`${authorAnalytics.timestamp} >= ${startDate}`];
    
    // Add author condition if provided
    if (authorId && !isNaN(parseInt(authorId as string))) {
      conditions.push(eq(authorAnalytics.authorId, parseInt(authorId as string)));
    }
    
    // Get action counts by type
    const actionsByType = await db
      .select({
        actionType: authorAnalytics.actionType,
        count: sql<number>`count(*)::int`
      })
      .from(authorAnalytics)
      .where(and(...conditions))
      .groupBy(authorAnalytics.actionType)
      .orderBy(desc(sql<number>`count(*)`));
    
    // Get actions by date
    const actionsByDate = await db
      .select({
        date: sql<string>`date_trunc('day', ${authorAnalytics.timestamp})::date::text`,
        count: sql<number>`count(*)::int`
      })
      .from(authorAnalytics)
      .where(and(...conditions))
      .groupBy(sql`date_trunc('day', ${authorAnalytics.timestamp})`)
      .orderBy(sql`date_trunc('day', ${authorAnalytics.timestamp})`);
    
    res.json({
      actionsByType,
      actionsByDate
    });
  } catch (error) {
    console.error("Error getting author actions data:", error);
    res.status(500).json({ error: "Failed to retrieve author actions data" });
  }
});

// Get all form analytics data for admins
router.get("/analytics/form-data", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { days = "30", authorId } = req.query;
    
    const startDate = subDays(new Date(), parseInt(days as string));
    
    // Base conditions
    const conditions = [sql`${authorFormAnalytics.startedAt} >= ${startDate}`];
    
    // Add author condition if provided
    if (authorId && !isNaN(parseInt(authorId as string))) {
      conditions.push(eq(authorFormAnalytics.authorId, parseInt(authorId as string)));
    }
    
    // Get form analytics by form ID
    const formDataByFormId = await db
      .select({
        formId: authorFormAnalytics.formId,
        started: sql<number>`count(*)::int`,
        completed: sql<number>`SUM(CASE WHEN ${authorFormAnalytics.status} = 'completed' THEN 1 ELSE 0 END)::int`,
        abandoned: sql<number>`SUM(CASE WHEN ${authorFormAnalytics.status} = 'abandoned' THEN 1 ELSE 0 END)::int`,
        avgDuration: sql<number>`avg(COALESCE(${authorFormAnalytics.duration}, 0))::int`
      })
      .from(authorFormAnalytics)
      .where(and(...conditions))
      .groupBy(authorFormAnalytics.formId)
      .orderBy(desc(sql<number>`count(*)`));
    
    // Calculate completion rates
    const formsWithRates = formDataByFormId.map(form => ({
      ...form,
      completionRate: form.started > 0 ? (form.completed / form.started) : 0
    }));
    
    res.json(formsWithRates);
  } catch (error) {
    console.error("Error getting form analytics data:", error);
    res.status(500).json({ error: "Failed to retrieve form analytics data" });
  }
});

// Search for authors or books
router.get("/search", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    // Search for authors
    const matchingAuthors = await db
      .select({
        id: users.id,
        type: sql<string>`'author'`,
        displayName: users.displayName,
        email: users.email,
        username: users.username,
        isAuthor: users.isAuthor
      })
      .from(users)
      .where(
        and(
          eq(users.isAuthor, true),
          sql`(
            ${users.displayName} ILIKE ${`%${query}%`} OR 
            ${users.username} ILIKE ${`%${query}%`} OR 
            ${users.email} ILIKE ${`%${query}%`}
          )`
        )
      )
      .limit(10);
    
    // Search for books
    const matchingBooks = await db
      .select({
        id: books.id,
        type: sql<string>`'book'`,
        title: books.title,
        author: books.author,
        authorId: books.authorId
      })
      .from(books)
      .where(
        sql`(
          ${books.title} ILIKE ${`%${query}%`} OR 
          ${books.author} ILIKE ${`%${query}%`}
        )`
      )
      .limit(10);
    
    // Combine results
    const results = [...matchingAuthors, ...matchingBooks];
    
    res.json(results);
  } catch (error) {
    console.error("Error searching:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

export default router;