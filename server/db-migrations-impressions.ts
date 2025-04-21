import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Add type column to bookImpressions table
 */
async function addTypeColumnToBookImpressions() {
  
  try {
    // Check if the column already exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_impressions' AND column_name = 'type';
    `);
    
    if (columnCheck.rows.length > 0) {
      
      return;
    }

    // Add the type column
    await db.execute(sql`
      ALTER TABLE book_impressions
      ADD COLUMN "type" TEXT NOT NULL DEFAULT 'view';
    `);
    
    
  } catch (error) {
    console.error("Error adding type column:", error);
    throw error;
  }
}

/**
 * Add weight column to bookImpressions table
 */
async function addWeightColumnToBookImpressions() {
  
  try {
    // Check if the column already exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_impressions' AND column_name = 'weight';
    `);
    
    if (columnCheck.rows.length > 0) {
      
      return;
    }

    // Add the weight column
    await db.execute(sql`
      ALTER TABLE book_impressions
      ADD COLUMN "weight" DECIMAL NOT NULL DEFAULT '1.0';
    `);
    
    
  } catch (error) {
    console.error("Error adding weight column:", error);
    throw error;
  }
}

/**
 * Run the migrations for impression table updates
 */
export async function runImpressionMigrations() {
  
  try {
    await addTypeColumnToBookImpressions();
    await addWeightColumnToBookImpressions();
    
  } catch (error) {
    console.error("Error running impression table migrations:", error);
  }
}