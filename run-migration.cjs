// This is a temporary script to run the migration
const { db } = require('./server/db');
const { sql } = require('drizzle-orm');

async function removeProColumnsFromAuthors() {
  try {
    // Check if the columns exist in the authors table
    const checkIsProResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'authors' AND column_name = 'is_pro'
    `);
    
    const checkProExpiresAtResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'authors' AND column_name = 'pro_expires_at'
    `);
    
    // If is_pro exists, remove it
    if (checkIsProResult.rows.length > 0) {
      console.log("Removing 'is_pro' column from authors table...");
      await db.execute(sql`
        ALTER TABLE authors 
        DROP COLUMN is_pro
      `);
      console.log("Column 'is_pro' removed successfully from authors table");
    } else {
      console.log("Column 'is_pro' doesn't exist or has already been removed from authors table");
    }
    
    // If pro_expires_at exists, remove it
    if (checkProExpiresAtResult.rows.length > 0) {
      console.log("Removing 'pro_expires_at' column from authors table...");
      await db.execute(sql`
        ALTER TABLE authors 
        DROP COLUMN pro_expires_at
      `);
      console.log("Column 'pro_expires_at' removed successfully from authors table");
    } else {
      console.log("Column 'pro_expires_at' doesn't exist or has already been removed from authors table");
    }
  } catch (error) {
    console.error("Error removing pro columns from authors table:", error);
    throw error;
  }
}

// Run the migration
removeProColumnsFromAuthors()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });