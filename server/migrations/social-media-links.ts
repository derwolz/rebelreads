import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Add socialMediaLinks column to authors table
 */
export async function addSocialMediaLinksToAuthors() {
  try {
    // Check if the column already exists
    const columnExists = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'authors' AND column_name = 'social_media_links'
    `);
    
    if (columnExists.rows.length === 0) {
      console.log("Adding social_media_links column to authors table...");
      await db.execute(sql`
        ALTER TABLE authors 
        ADD COLUMN social_media_links JSONB DEFAULT '[]'
      `);
      console.log("Successfully added social_media_links column to authors table");
    } else {
      console.log("social_media_links column already exists in authors table");
    }
  } catch (error) {
    console.error("Error adding social_media_links to authors table:", error);
    throw error;
  }
}

// Run the migration when this script is executed directly
// In ESM, we don't have require.main, so we'll always run it
// This is fine because it will only be run when specifically called
(async () => {
  console.log("Running social media links migration...");
  try {
    await addSocialMediaLinksToAuthors();
    console.log("Social media links migration completed successfully");
    // Don't exit the process when imported by other modules
  } catch (error) {
    console.error("Migration failed:", error);
    // Don't exit the process when imported by other modules
  }
})();