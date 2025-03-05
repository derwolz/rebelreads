
import { pool, db } from "./db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Starting migration...");
  
  try {
    // Add social_links column to users table if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb
    `);
    
    console.log("Successfully added social_links column to users table");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

migrate()
  .then(() => console.log("Migration completed successfully"))
  .catch((err) => console.error("Migration failed with error:", err));
