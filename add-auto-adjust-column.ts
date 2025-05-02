import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function addAutoAdjustColumnToRatingPreferences() {
  try {
    // Check if column exists first to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rating_preferences' AND column_name = 'auto_adjust'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding auto_adjust column to rating_preferences table...");
      
      await db.execute(sql`
        ALTER TABLE rating_preferences 
        ADD COLUMN auto_adjust BOOLEAN NOT NULL DEFAULT false
      `);
      
      console.log("Added auto_adjust column to rating_preferences table successfully");
    } else {
      console.log("auto_adjust column already exists in rating_preferences table");
    }
  } catch (error) {
    console.error("Error adding auto_adjust column to rating_preferences table:", error);
    throw error;
  }
}

async function runMigration() {
  try {
    await addAutoAdjustColumnToRatingPreferences();
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

runMigration();