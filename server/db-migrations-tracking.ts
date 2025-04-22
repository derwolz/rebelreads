import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Add enhanced tracking columns to bookImpressions table
 */
async function addEnhancedTrackingToBookImpressions() {
  try {
    // Check if the columns already exist
    const positionColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_impressions' AND column_name = 'position';
    `);
    
    if (positionColumnCheck.rows.length === 0) {
      // Add position column
      await db.execute(sql`
        ALTER TABLE book_impressions
        ADD COLUMN "position" INTEGER;
      `);
    }

    const containerTypeColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_impressions' AND column_name = 'container_type';
    `);
    
    if (containerTypeColumnCheck.rows.length === 0) {
      // Add container_type column
      await db.execute(sql`
        ALTER TABLE book_impressions
        ADD COLUMN "container_type" TEXT;
      `);
    }

    const containerIdColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_impressions' AND column_name = 'container_id';
    `);
    
    if (containerIdColumnCheck.rows.length === 0) {
      // Add container_id column
      await db.execute(sql`
        ALTER TABLE book_impressions
        ADD COLUMN "container_id" TEXT;
      `);
    }

    const metadataColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_impressions' AND column_name = 'metadata';
    `);
    
    if (metadataColumnCheck.rows.length === 0) {
      // Add metadata column
      await db.execute(sql`
        ALTER TABLE book_impressions
        ADD COLUMN "metadata" JSONB DEFAULT '{}';
      `);
    }
    
    console.log("Enhanced tracking columns added to book_impressions table");
  } catch (error) {
    console.error("Error adding enhanced tracking columns to book_impressions:", error);
    throw error;
  }
}

/**
 * Add enhanced tracking columns to bookClickThroughs table
 */
async function addEnhancedTrackingToBookClickThroughs() {
  try {
    // Check if the columns already exist
    const positionColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_click_throughs' AND column_name = 'position';
    `);
    
    if (positionColumnCheck.rows.length === 0) {
      // Add position column
      await db.execute(sql`
        ALTER TABLE book_click_throughs
        ADD COLUMN "position" INTEGER;
      `);
    }

    const containerTypeColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_click_throughs' AND column_name = 'container_type';
    `);
    
    if (containerTypeColumnCheck.rows.length === 0) {
      // Add container_type column
      await db.execute(sql`
        ALTER TABLE book_click_throughs
        ADD COLUMN "container_type" TEXT;
      `);
    }

    const containerIdColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_click_throughs' AND column_name = 'container_id';
    `);
    
    if (containerIdColumnCheck.rows.length === 0) {
      // Add container_id column
      await db.execute(sql`
        ALTER TABLE book_click_throughs
        ADD COLUMN "container_id" TEXT;
      `);
    }

    const metadataColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_click_throughs' AND column_name = 'metadata';
    `);
    
    if (metadataColumnCheck.rows.length === 0) {
      // Add metadata column
      await db.execute(sql`
        ALTER TABLE book_click_throughs
        ADD COLUMN "metadata" JSONB DEFAULT '{}';
      `);
    }
    
    console.log("Enhanced tracking columns added to book_click_throughs table");
  } catch (error) {
    console.error("Error adding enhanced tracking columns to book_click_throughs:", error);
    throw error;
  }
}

/**
 * Add enhanced tracking columns to adImpressions table
 */
async function addEnhancedTrackingToAdImpressions() {
  try {
    // Check if the columns already exist
    const containerTypeColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ad_impressions' AND column_name = 'container_type';
    `);
    
    if (containerTypeColumnCheck.rows.length === 0) {
      // Add container_type column
      await db.execute(sql`
        ALTER TABLE ad_impressions
        ADD COLUMN "container_type" TEXT;
      `);
    }

    const containerIdColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ad_impressions' AND column_name = 'container_id';
    `);
    
    if (containerIdColumnCheck.rows.length === 0) {
      // Add container_id column
      await db.execute(sql`
        ALTER TABLE ad_impressions
        ADD COLUMN "container_id" TEXT;
      `);
    }

    const sectionOrderColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ad_impressions' AND column_name = 'section_order';
    `);
    
    if (sectionOrderColumnCheck.rows.length === 0) {
      // Add section_order column
      await db.execute(sql`
        ALTER TABLE ad_impressions
        ADD COLUMN "section_order" INTEGER;
      `);
    }

    const metadataColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ad_impressions' AND column_name = 'metadata';
    `);
    
    if (metadataColumnCheck.rows.length === 0) {
      // Add metadata column
      await db.execute(sql`
        ALTER TABLE ad_impressions
        ADD COLUMN "metadata" JSONB DEFAULT '{}';
      `);
    }
    
    console.log("Enhanced tracking columns added to ad_impressions table");
  } catch (error) {
    console.error("Error adding enhanced tracking columns to ad_impressions:", error);
    throw error;
  }
}

/**
 * Run all the tracking enhancement migrations
 */
export async function runTrackingMigrations() {
  try {
    console.log("Running tracking migrations...");
    await addEnhancedTrackingToBookImpressions();
    await addEnhancedTrackingToBookClickThroughs();
    await addEnhancedTrackingToAdImpressions();
    console.log("Tracking migrations completed successfully");
  } catch (error) {
    console.error("Error running tracking migrations:", error);
  }
}