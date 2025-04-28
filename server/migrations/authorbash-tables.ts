import { db } from "../db";
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  primaryKey, 
  json
} from "drizzle-orm/pg-core";

/**
 * Create tables for AuthorBash feature
 * 
 * - authorbash_questions: Weekly questions for authors to respond to
 * - authorbash_responses: Author responses to questions (image + text)
 * - authorbash_card_retentions: Cards that users have chosen to retain
 * - authorbash_game_sessions: Track game sessions for card presentation
 */
export async function createAuthorBashTables() {
  console.log("Creating AuthorBash tables...");
  
  try {
    // Questions table - weekly prompts for authors
    const authorbashQuestions = pgTable("authorbash_questions", {
      id: serial("id").primaryKey(),
      question: text("question").notNull(),
      weekNumber: integer("week_number").notNull(),
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date").notNull(),
      isActive: boolean("is_active").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow(),
    });

    // Responses table - author submissions
    const authorbashResponses = pgTable("authorbash_responses", {
      id: serial("id").primaryKey(),
      questionId: integer("question_id").notNull().references(() => authorbashQuestions.id),
      authorId: integer("author_id").notNull(), // References authors table
      text: text("text").notNull(),
      imageUrl: text("image_url").notNull(),
      retentionCount: integer("retention_count").notNull().default(0),
      impressionCount: integer("impression_count").notNull().default(0),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
    });

    // Card retentions table - track which cards users have retained
    const authorbashCardRetentions = pgTable("authorbash_card_retentions", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(), // References users table
      responseId: integer("response_id").notNull().references(() => authorbashResponses.id),
      createdAt: timestamp("created_at").notNull().defaultNow(),
    });

    // Game sessions table - track active game sessions
    const authorbashGameSessions = pgTable("authorbash_game_sessions", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(), // References users table
      seenResponseIds: json("seen_response_ids").notNull().default([]),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
    });

    // Create the tables in the database
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "authorbash_questions" (
        "id" SERIAL PRIMARY KEY,
        "question" TEXT NOT NULL,
        "week_number" INTEGER NOT NULL,
        "start_date" TIMESTAMP NOT NULL,
        "end_date" TIMESTAMP NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "authorbash_responses" (
        "id" SERIAL PRIMARY KEY,
        "question_id" INTEGER NOT NULL REFERENCES "authorbash_questions"("id"),
        "author_id" INTEGER NOT NULL,
        "text" TEXT NOT NULL,
        "image_url" TEXT NOT NULL,
        "retention_count" INTEGER NOT NULL DEFAULT 0,
        "impression_count" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "authorbash_retentions" (
        "id" SERIAL PRIMARY KEY,
        "game_id" INTEGER NOT NULL,
        "response_id" INTEGER NOT NULL REFERENCES "authorbash_responses"("id"),
        "is_retained" BOOLEAN NOT NULL DEFAULT false,
        "viewed_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "retained_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "authorbash_games" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "started_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log("AuthorBash tables created successfully");
    return true;
  } catch (error) {
    console.error("Error creating AuthorBash tables:", error);
    return false;
  }
}

/**
 * Create sample data for testing AuthorBash feature
 */
export async function createAuthorBashSampleData() {
  console.log("Creating AuthorBash sample data...");
  
  try {
    // Check if there are already questions
    const existingQuestions = await db.execute<{ count: string }>(
      `SELECT COUNT(*) as count FROM authorbash_questions`
    );
    
    if (parseInt(existingQuestions.rows[0].count) === 0) {
      // Create sample question
      const now = new Date();
      const oneWeekLater = new Date(now);
      oneWeekLater.setDate(oneWeekLater.getDate() + 7);
      
      // Create the date strings directly for the SQL query
      const startDate = now.toISOString();
      const endDate = oneWeekLater.toISOString();
      
      await db.execute(`
        INSERT INTO "authorbash_questions" 
        ("question", "week_number", "start_date", "end_date", "is_active")
        VALUES 
        ('What book changed your perspective on life?', 1, '${startDate}', '${endDate}', true)
      `);
      
      console.log("Sample question created");
    } else {
      console.log("Questions already exist, skipping sample data creation");
    }
    
    return true;
  } catch (error) {
    console.error("Error creating AuthorBash sample data:", error);
    return false;
  }
}

/**
 * Run all AuthorBash migrations
 */
export async function runAuthorBashMigrations() {
  const tablesCreated = await createAuthorBashTables();
  if (tablesCreated) {
    await createAuthorBashSampleData();
  }
  return tablesCreated;
}