import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Add type column to bookImpressions table
 */
async function addTypeColumnToBookImpressions() {
  console.log("Starting addition of type column to book_impressions table...");
  try {
    // Check if the column already exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_impressions' AND column_name = 'type';
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log("Column 'type' already exists");
      return;
    }

    // Add the type column
    await db.execute(sql`
      ALTER TABLE book_impressions
      ADD COLUMN "type" TEXT NOT NULL DEFAULT 'view';
    `);
    
    console.log("Column 'type' added successfully to book_impressions table");
  } catch (error) {
    console.error("Error adding type column:", error);
    throw error;
  }
}

/**
 * Add weight column to bookImpressions table
 */
async function addWeightColumnToBookImpressions() {
  console.log("Starting addition of weight column to book_impressions table...");
  try {
    // Check if the column already exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_impressions' AND column_name = 'weight';
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log("Column 'weight' already exists");
      return;
    }

    // Add the weight column
    await db.execute(sql`
      ALTER TABLE book_impressions
      ADD COLUMN "weight" DECIMAL NOT NULL DEFAULT '1.0';
    `);
    
    console.log("Column 'weight' added successfully to book_impressions table");
  } catch (error) {
    console.error("Error adding weight column:", error);
    throw error;
  }
}

/**
 * Run the migrations for impression table updates
 */
export async function runImpressionMigrations() {
  console.log("Running impression table migrations...");
  try {
    await addTypeColumnToBookImpressions();
    await addWeightColumnToBookImpressions();
    console.log("Impression table migrations completed successfully");
  } catch (error) {
    console.error("Error running impression table migrations:", error);
  }
}