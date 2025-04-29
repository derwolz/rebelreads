import { Router, Request, Response } from "express";
import { eq, desc, and, lt, gt, sql, inArray, not } from "drizzle-orm";
import { db } from "../db";
import { 
  authorBashQuestions, 
  authorBashResponses, 
  authors,
  users
} from "@shared/schema";

const authorBashPublicRouter = Router();

// Get the current active question (public access)
authorBashPublicRouter.get("/questions/active", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const activeQuestion = await db.query.authorBashQuestions.findFirst({
      where: and(
        eq(authorBashQuestions.isActive, true),
        lt(authorBashQuestions.startDate, now),
        gt(authorBashQuestions.endDate, now)
      ),
    });

    if (!activeQuestion) {
      return res.status(404).json({ error: "No active question found" });
    }

    return res.status(200).json(activeQuestion);
  } catch (error) {
    console.error("Error fetching active question:", error);
    return res.status(500).json({ error: "Failed to fetch active question" });
  }
});

// Get all questions (public access)
authorBashPublicRouter.get("/questions", async (req: Request, res: Response) => {
  try {
    const questions = await db.query.authorBashQuestions.findMany({
      orderBy: desc(authorBashQuestions.weekNumber),
    });
    return res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Get leaderboard of top responses (public access)
authorBashPublicRouter.get("/leaderboard/responses", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Get top responses by retention count
    const topResponses = await db.query.authorBashResponses.findMany({
      orderBy: desc(authorBashResponses.retentionCount),
      limit,
      with: {
        author: {
          columns: {
            author_name: true,
            author_image_url: true
          }
        },
        question: true
      }
    });
    
    return res.status(200).json(topResponses);
  } catch (error) {
    console.error("Error fetching response leaderboard:", error);
    return res.status(500).json({ error: "Failed to fetch response leaderboard" });
  }
});

// Get leaderboard of top authors (public access)
authorBashPublicRouter.get("/leaderboard/authors", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Get top authors based on total retention count across all responses
    const result = await db
      .select({
        authorId: authorBashResponses.authorId,
        totalRetentions: sql<number>`SUM(${authorBashResponses.retentionCount})`,
      })
      .from(authorBashResponses)
      .groupBy(authorBashResponses.authorId)
      .orderBy(desc(sql`SUM(${authorBashResponses.retentionCount})`))
      .limit(limit);
      
    // Get author details for each
    const authorDetails = [];
    for (const item of result) {
      // Query the authors table directly without the relation
      const author = await db
        .select({
          id: authors.id,
          author_name: authors.author_name,
          author_image_url: authors.author_image_url,
          username: users.username
        })
        .from(authors)
        .innerJoin(users, eq(authors.userId, users.id))
        .where(eq(authors.id, item.authorId))
        .limit(1);
      
      if (author && author.length > 0) {
        authorDetails.push({
          ...author[0],
          totalRetentions: item.totalRetentions,
          user: {
            username: author[0].username
          }
        });
      }
    }
    
    return res.status(200).json(authorDetails);
  } catch (error) {
    console.error("Error fetching author leaderboard:", error);
    return res.status(500).json({ error: "Failed to fetch author leaderboard" });
  }
});

export default authorBashPublicRouter;