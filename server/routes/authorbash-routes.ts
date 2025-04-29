import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  authorBashQuestions,
  authorBashResponses,
  authorBashGames,
  authorBashRetentions,
  insertAuthorBashQuestionSchema,
  insertAuthorBashResponseSchema,
  insertAuthorBashGameSchema,
  insertAuthorBashRetentionSchema,
  authors,
  users
} from "@shared/schema";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { eq, and, desc, sql, count, not, exists, lt, gt, isNull, or, inArray } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "authorbash");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueId = nanoid();
    const ext = path.extname(file.originalname);
    cb(null, `authorbash_${uniqueId}${ext}`);
  },
});

const upload = multer({ storage });
const authorBashRouter = Router();

// Get the current active question
authorBashRouter.get("/questions/active", async (req: Request, res: Response) => {
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

// Get all questions (admin use)
authorBashRouter.get("/questions", async (req: Request, res: Response) => {
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

// Create a new question (admin use)
authorBashRouter.post("/questions", async (req: Request, res: Response) => {
  try {
    const questionData = insertAuthorBashQuestionSchema.parse(req.body);
    
    // Set all other questions to inactive if this one is active
    if (questionData.isActive) {
      await db
        .update(authorBashQuestions)
        .set({ isActive: false })
        .where(eq(authorBashQuestions.isActive, true));
    }
    
    const [newQuestion] = await db
      .insert(authorBashQuestions)
      .values(questionData)
      .returning();
      
    return res.status(201).json(newQuestion);
  } catch (error) {
    console.error("Error creating question:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Failed to create question" });
  }
});

// Get author's response to the current active question
authorBashRouter.get("/responses/mine", async (req: Request, res: Response) => {
  try {
    // Check if user is an author
    if (!req.user?.isAuthor) {
      return res.status(403).json({ error: "Only authors can submit responses" });
    }
    
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
    
    // Get the author record for this user
    const author = await db.query.authors.findFirst({
      where: eq(authors.userId, req.user.id)
    });
    
    if (!author) {
      return res.status(404).json({ error: "Author profile not found" });
    }
    
    // Check if author has already responded to this question
    const existingResponse = await db.query.authorBashResponses.findFirst({
      where: and(
        eq(authorBashResponses.authorId, author.id),
        eq(authorBashResponses.questionId, activeQuestion.id)
      ),
    });
    
    if (!existingResponse) {
      return res.status(404).json({ message: "No response found" });
    }
    
    return res.status(200).json(existingResponse);
  } catch (error) {
    console.error("Error fetching author response:", error);
    return res.status(500).json({ error: "Failed to fetch author response" });
  }
});

// Submit author response to current question
authorBashRouter.post("/responses", upload.single("image"), async (req: Request, res: Response) => {
  try {
    // Check if user is an author
    if (!req.user?.isAuthor) {
      return res.status(403).json({ error: "Only authors can submit responses" });
    }
    
    // Validate at least one of text or image is provided
    const text = req.body.text;
    const hasImage = !!req.file;
    
    if (!text && !hasImage) {
      return res.status(400).json({ error: "Either text or image (or both) must be provided" });
    }
    
    // Validate text does not exceed 200 characters if provided
    if (text && text.length > 200) {
      return res.status(400).json({ error: "Response text must be 200 characters or less" });
    }
    
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
    
    // Get the author record for this user
    const author = await db.query.authors.findFirst({
      where: eq(authors.userId, req.user.id)
    });
    
    if (!author) {
      return res.status(404).json({ error: "Author profile not found" });
    }
    
    // Check if author has already responded to this question
    const existingResponse = await db.query.authorBashResponses.findFirst({
      where: and(
        eq(authorBashResponses.authorId, author.id),
        eq(authorBashResponses.questionId, activeQuestion.id)
      ),
    });
    
    if (existingResponse) {
      return res.status(400).json({ error: "You have already submitted a response to this question" });
    }
    
    // Get image URL path if image was uploaded
    const imageUrl = req.file ? `/uploads/authorbash/${req.file.filename}` : null;
    
    // Create response
    const responseData = {
      questionId: activeQuestion.id,
      authorId: author.id,
      text: text || null,  // null if text is not provided
      imageUrl: imageUrl || null, // null if image is not provided
    };
    
    const [newResponse] = await db
      .insert(authorBashResponses)
      .values(responseData)
      .returning();
      
    return res.status(201).json(newResponse);
  } catch (error) {
    console.error("Error submitting response:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Failed to submit response" });
  }
});

// Update author response
authorBashRouter.patch("/responses/:id", upload.single("image"), async (req: Request, res: Response) => {
  try {
    const responseId = parseInt(req.params.id);
    if (isNaN(responseId)) {
      return res.status(400).json({ error: "Invalid response ID" });
    }
    
    // Check if user is an author
    if (!req.user?.isAuthor) {
      return res.status(403).json({ error: "Only authors can update responses" });
    }
    
    // Get the author record for this user
    const author = await db.query.authors.findFirst({
      where: eq(authors.userId, req.user.id)
    });
    
    if (!author) {
      return res.status(404).json({ error: "Author profile not found" });
    }
    
    // Check if response exists and belongs to this author
    const existingResponse = await db.query.authorBashResponses.findFirst({
      where: and(
        eq(authorBashResponses.id, responseId),
        eq(authorBashResponses.authorId, author.id)
      ),
    });
    
    if (!existingResponse) {
      return res.status(404).json({ error: "Response not found or not owned by you" });
    }
    
    // Build update data
    const updateData: any = {};
    
    // Validate text does not exceed 200 characters if provided
    if (req.body.text !== undefined) {
      const text = req.body.text;
      if (text && text.length > 200) {
        return res.status(400).json({ error: "Response text must be 200 characters or less" });
      }
      updateData.text = text || null; // Use null if text is empty
    }
    
    // Update image if provided
    if (req.file) {
      updateData.imageUrl = `/uploads/authorbash/${req.file.filename}`;
      
      // Delete old image if it exists
      if (existingResponse.imageUrl) {
        const oldImagePath = path.join(process.cwd(), existingResponse.imageUrl.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    
    // Update response
    updateData.updatedAt = new Date();
    
    const [updatedResponse] = await db
      .update(authorBashResponses)
      .set(updateData)
      .where(eq(authorBashResponses.id, responseId))
      .returning();
      
    return res.status(200).json(updatedResponse);
  } catch (error) {
    console.error("Error updating response:", error);
    return res.status(500).json({ error: "Failed to update response" });
  }
});

// Get responses for the game (3 random responses that haven't been seen by the user)
authorBashRouter.get("/game/cards", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get active game session or create a new one
    let gameSession = await db.query.authorBashGames.findFirst({
      where: and(
        eq(authorBashGames.userId, req.user.id),
        isNull(authorBashGames.completedAt)
      ),
    });
    
    if (!gameSession) {
      const [newGameSession] = await db
        .insert(authorBashGames)
        .values({ userId: req.user.id })
        .returning();
      gameSession = newGameSession;
    }
    
    // Get all responses the user has already seen in this game
    const viewedResponseIds = await db
      .select({ responseId: authorBashRetentions.responseId })
      .from(authorBashRetentions)
      .where(eq(authorBashRetentions.gameId, gameSession.id));
    
    const viewedIds = viewedResponseIds.map(item => item.responseId);
    
    // Get 3 random responses that haven't been seen yet
    const randomResponses = await db.query.authorBashResponses.findMany({
      where: viewedIds.length > 0 ? not(inArray(authorBashResponses.id, viewedIds)) : undefined,
      with: {
        author: {
          columns: {
            author_name: true,
            author_image_url: true
          }
        }
      },
      limit: 3,
      orderBy: sql`RANDOM()`
    });
    
    // If there are fewer than 3 new responses, game is complete
    if (randomResponses.length < 3) {
      await db
        .update(authorBashGames)
        .set({ completedAt: new Date() })
        .where(eq(authorBashGames.id, gameSession.id));
        
      return res.status(200).json({ 
        cards: randomResponses,
        gameComplete: true
      });
    }
    
    // Record that these responses were viewed
    for (const response of randomResponses) {
      await db
        .insert(authorBashRetentions)
        .values({
          gameId: gameSession.id,
          responseId: response.id,
          isRetained: false
        });
        
      // Increment impression count
      await db
        .update(authorBashResponses)
        .set({ 
          impressionCount: sql`${authorBashResponses.impressionCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(authorBashResponses.id, response.id));
    }
    
    return res.status(200).json({ 
      cards: randomResponses,
      gameComplete: false,
      gameId: gameSession.id
    });
  } catch (error) {
    console.error("Error fetching game cards:", error);
    return res.status(500).json({ error: "Failed to fetch game cards" });
  }
});

// Retain a card
authorBashRouter.post("/game/retain", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { responseId, gameId } = req.body;
    
    if (!responseId || !gameId) {
      return res.status(400).json({ error: "Response ID and Game ID are required" });
    }
    
    // Verify the game belongs to this user
    const gameSession = await db.query.authorBashGames.findFirst({
      where: and(
        eq(authorBashGames.id, gameId),
        eq(authorBashGames.userId, req.user.id)
      ),
    });
    
    if (!gameSession) {
      return res.status(404).json({ error: "Game session not found" });
    }
    
    // Verify the response exists
    const response = await db.query.authorBashResponses.findFirst({
      where: eq(authorBashResponses.id, responseId),
    });
    
    if (!response) {
      return res.status(404).json({ error: "Response not found" });
    }
    
    // Update retention record
    const retentionRecord = await db.query.authorBashRetentions.findFirst({
      where: and(
        eq(authorBashRetentions.gameId, gameId),
        eq(authorBashRetentions.responseId, responseId)
      ),
    });
    
    if (!retentionRecord) {
      return res.status(404).json({ error: "Retention record not found" });
    }
    
    // Update retention status
    const [updatedRetention] = await db
      .update(authorBashRetentions)
      .set({ 
        isRetained: true,
        retainedAt: new Date()
      })
      .where(and(
        eq(authorBashRetentions.gameId, gameId),
        eq(authorBashRetentions.responseId, responseId)
      ))
      .returning();
      
    // Increment retention count on the response
    await db
      .update(authorBashResponses)
      .set({ 
        retentionCount: sql`${authorBashResponses.retentionCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(authorBashResponses.id, responseId));
      
    return res.status(200).json(updatedRetention);
  } catch (error) {
    console.error("Error retaining card:", error);
    return res.status(500).json({ error: "Failed to retain card" });
  }
});

// Get user's currently retained cards
authorBashRouter.get("/game/retained", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get active game session
    const gameSession = await db.query.authorBashGames.findFirst({
      where: and(
        eq(authorBashGames.userId, req.user.id),
        isNull(authorBashGames.completedAt)
      ),
    });
    
    if (!gameSession) {
      return res.status(200).json({ retainedCards: [] });
    }
    
    // Get retained cards for this game
    const retainedRecords = await db
      .select()
      .from(authorBashRetentions)
      .where(and(
        eq(authorBashRetentions.gameId, gameSession.id),
        eq(authorBashRetentions.isRetained, true)
      ));
      
    const retainedIds = retainedRecords.map(record => record.responseId);
    
    if (retainedIds.length === 0) {
      return res.status(200).json({ retainedCards: [] });
    }
    
    // Fetch the actual response data
    const retainedResponses = await db.query.authorBashResponses.findMany({
      where: retainedIds.length > 0 ? inArray(authorBashResponses.id, retainedIds) : undefined,
      with: {
        author: {
          columns: {
            author_name: true,
            author_image_url: true
          }
        }
      }
    });
    
    return res.status(200).json({ 
      retainedCards: retainedResponses,
      gameId: gameSession.id
    });
  } catch (error) {
    console.error("Error fetching retained cards:", error);
    return res.status(500).json({ error: "Failed to fetch retained cards" });
  }
});

// Replace a retained card
authorBashRouter.post("/game/replace", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { oldResponseId, newResponseId, gameId } = req.body;
    
    if (!oldResponseId || !newResponseId || !gameId) {
      return res.status(400).json({ error: "Old response ID, new response ID, and game ID are required" });
    }
    
    // Verify the game belongs to this user
    const gameSession = await db.query.authorBashGames.findFirst({
      where: and(
        eq(authorBashGames.id, gameId),
        eq(authorBashGames.userId, req.user.id)
      ),
    });
    
    if (!gameSession) {
      return res.status(404).json({ error: "Game session not found" });
    }
    
    // Remove retention from old card
    await db
      .update(authorBashRetentions)
      .set({ 
        isRetained: false,
        retainedAt: null
      })
      .where(and(
        eq(authorBashRetentions.gameId, gameId),
        eq(authorBashRetentions.responseId, oldResponseId)
      ));
      
    // Decrement retention count on the old response
    await db
      .update(authorBashResponses)
      .set({ 
        retentionCount: sql`${authorBashResponses.retentionCount} - 1`,
        updatedAt: new Date()
      })
      .where(eq(authorBashResponses.id, oldResponseId));
      
    // Add retention to new card
    await db
      .update(authorBashRetentions)
      .set({ 
        isRetained: true,
        retainedAt: new Date()
      })
      .where(and(
        eq(authorBashRetentions.gameId, gameId),
        eq(authorBashRetentions.responseId, newResponseId)
      ));
      
    // Increment retention count on the new response
    await db
      .update(authorBashResponses)
      .set({ 
        retentionCount: sql`${authorBashResponses.retentionCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(authorBashResponses.id, newResponseId));
      
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error replacing card:", error);
    return res.status(500).json({ error: "Failed to replace card" });
  }
});

// Get leaderboard of top responses
authorBashRouter.get("/leaderboard/responses", async (req: Request, res: Response) => {
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

// Get leaderboard of top authors
authorBashRouter.get("/leaderboard/authors", async (req: Request, res: Response) => {
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

// Create a few dummy questions and responses for development
authorBashRouter.post("/dev/seed", async (req: Request, res: Response) => {
  try {
    // Create dummy questions
    const question1 = await db
      .insert(authorBashQuestions)
      .values({
        question: "What's your favorite book and why in just a few words?",
        weekNumber: 1,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        isActive: true,
      })
      .returning();

    const question2 = await db
      .insert(authorBashQuestions)
      .values({
        question: "If you could be any character from a book, who would you be?",
        weekNumber: 2,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        isActive: false,
      })
      .returning();

    // Get some authors
    const authorsList = await db.query.authors.findMany({
      limit: 5,
    });

    if (authorsList.length === 0) {
      return res.status(200).json({ message: "No authors found, added questions only" });
    }

    // Create dummy responses
    const dummyResponses = [];
    const imageUrls = [
      "/uploads/authorbash/dummy_book1.jpg",
      "/uploads/authorbash/dummy_book2.jpg",
      "/uploads/authorbash/dummy_book3.jpg",
      "/uploads/authorbash/dummy_book4.jpg",
      "/uploads/authorbash/dummy_book5.jpg",
    ];

    const dummyTexts = [
      "To Kill a Mockingbird - Timeless exploration of justice and humanity.",
      "1984 - A chilling warning about power and surveillance.",
      "The Great Gatsby - Dreams, wealth, and emptiness of materialism.",
      "The Lord of the Rings - Epic journey of friendship and courage.",
      "Pride and Prejudice - Sharp wit and enduring love story.",
    ];

    for (let i = 0; i < Math.min(authorsList.length, 5); i++) {
      const response = await db
        .insert(authorBashResponses)
        .values({
          questionId: question1[0].id,
          authorId: authorsList[i].id,
          imageUrl: imageUrls[i],
          text: dummyTexts[i],
          retentionCount: Math.floor(Math.random() * 50),
          impressionCount: Math.floor(Math.random() * 100) + 50,
        })
        .returning();

      dummyResponses.push(response[0]);
    }

    return res.status(200).json({
      questions: [question1[0], question2[0]],
      responses: dummyResponses,
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    return res.status(500).json({ error: "Failed to seed data" });
  }
});

// ===== ADMIN ROUTES =====

// Get all questions (admin only)
authorBashRouter.get("/admin/questions", adminAuthMiddleware, async (req: Request, res: Response) => {
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

// Get responses for a specific question (admin only)
authorBashRouter.get("/admin/responses", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const questionId = req.query.questionId ? parseInt(req.query.questionId as string) : undefined;
    
    if (!questionId) {
      return res.status(400).json({ error: "Question ID is required" });
    }
    
    const responses = await db.query.authorBashResponses.findMany({
      where: eq(authorBashResponses.questionId, questionId),
      orderBy: desc(authorBashResponses.retentionCount),
      with: {
        author: {
          columns: {
            author_name: true,
            author_image_url: true
          }
        }
      }
    });
    
    return res.status(200).json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return res.status(500).json({ error: "Failed to fetch responses" });
  }
});

// Create a new question (admin only)
authorBashRouter.post("/admin/questions", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const questionData = insertAuthorBashQuestionSchema.parse({
      question: req.body.question,
      weekNumber: req.body.weekNumber,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      isActive: req.body.isActive,
    });
    
    // Set all other questions to inactive if this one is active
    if (questionData.isActive) {
      await db
        .update(authorBashQuestions)
        .set({ isActive: false })
        .where(eq(authorBashQuestions.isActive, true));
    }
    
    const [newQuestion] = await db
      .insert(authorBashQuestions)
      .values(questionData)
      .returning();
      
    return res.status(201).json(newQuestion);
  } catch (error) {
    console.error("Error creating question:", error);
    return res.status(500).json({ error: "Failed to create question" });
  }
});

// Update a question (admin only)
authorBashRouter.patch("/admin/questions/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.id);
    
    if (isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }
    
    const questionData = insertAuthorBashQuestionSchema.parse({
      question: req.body.question,
      weekNumber: req.body.weekNumber,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      isActive: req.body.isActive,
    });
    
    // Set all other questions to inactive if this one is being set to active
    if (questionData.isActive) {
      await db
        .update(authorBashQuestions)
        .set({ isActive: false })
        .where(and(
          eq(authorBashQuestions.isActive, true),
          not(eq(authorBashQuestions.id, questionId))
        ));
    }
    
    const [updatedQuestion] = await db
      .update(authorBashQuestions)
      .set(questionData)
      .where(eq(authorBashQuestions.id, questionId))
      .returning();
      
    if (!updatedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    return res.status(200).json(updatedQuestion);
  } catch (error) {
    console.error("Error updating question:", error);
    return res.status(500).json({ error: "Failed to update question" });
  }
});

// Delete a question (admin only)
authorBashRouter.delete("/admin/questions/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.id);
    
    if (isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }
    
    // Delete all responses for this question first
    await db
      .delete(authorBashResponses)
      .where(eq(authorBashResponses.questionId, questionId));
    
    // Delete the question
    const [deletedQuestion] = await db
      .delete(authorBashQuestions)
      .where(eq(authorBashQuestions.id, questionId))
      .returning();
      
    if (!deletedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    return res.status(200).json({ success: true, message: "Question and all its responses deleted" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return res.status(500).json({ error: "Failed to delete question" });
  }
});

export default authorBashRouter;