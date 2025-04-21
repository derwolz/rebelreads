import { sql } from "drizzle-orm";
import { Pool } from "pg";
import { db } from "../server/db";

// Add isPublisher and isAuthorInterest columns to signup_interests table
async function updateSignupInterestsTable() {
  try {
    signup_interests table...");
    
    // Check if columns exist before adding them
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'signup_interests' 
      AND column_name IN ('is_publisher', 'is_author_interest')
    `);
    
    const existingColumns = result.rows.map(row => row.column_name);
    
    // Add is_publisher column if it doesn't exist
    if (!existingColumns.includes('is_publisher')) {
      
      await db.execute(sql`
        ALTER TABLE signup_interests
        ADD COLUMN is_publisher BOOLEAN DEFAULT false
      `);
    } else {
      
    }
    
    // Add is_author_interest column if it doesn't exist
    if (!existingColumns.includes('is_author_interest')) {
      
      await db.execute(sql`
        ALTER TABLE signup_interests
        ADD COLUMN is_author_interest BOOLEAN DEFAULT false
      `);
    } else {
      
    }
    
    
  } catch (error) {
    console.error("Error updating signup_interests table:", error);
    throw error;
  }
}

// Run the migration directly
async function run() {
  try {
    await updateSignupInterestsTable();
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();