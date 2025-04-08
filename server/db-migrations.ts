
import { db } from "./db";
import { sql } from "drizzle-orm";

async function addFeaturedColumnToRatings() {
  try {
    // Check if column exists first to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ratings' AND column_name = 'featured'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding 'featured' column to ratings table...");
      await db.execute(sql`
        ALTER TABLE ratings 
        ADD COLUMN featured boolean DEFAULT false
      `);
      console.log("Column 'featured' added successfully");
    } else {
      console.log("Column 'featured' already exists");
    }
  } catch (error) {
    console.error("Error adding 'featured' column:", error);
    throw error;
  }
}

async function addReportStatusColumnToRatings() {
  try {
    // Check if column exists first to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ratings' AND column_name = 'report_status'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding 'report_status' column to ratings table...");
      await db.execute(sql`
        ALTER TABLE ratings 
        ADD COLUMN report_status text DEFAULT 'none'
      `);
      console.log("Column 'report_status' added successfully");
    } else {
      console.log("Column 'report_status' already exists");
    }
  } catch (error) {
    console.error("Error adding 'report_status' column:", error);
    throw error;
  }
}

async function createAdImpressionsTable() {
  try {
    // Check if table exists first to avoid errors
    const checkResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'ad_impressions'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Creating 'ad_impressions' table...");
      await db.execute(sql`
        CREATE TABLE ad_impressions (
          id SERIAL PRIMARY KEY,
          campaign_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          user_id INTEGER,
          ad_type TEXT NOT NULL,
          position TEXT,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          clicked BOOLEAN NOT NULL DEFAULT FALSE,
          clicked_at TIMESTAMP,
          source TEXT NOT NULL
        )
      `);
      console.log("Table 'ad_impressions' created successfully");
    } else {
      console.log("Table 'ad_impressions' already exists");
    }
  } catch (error) {
    console.error("Error creating 'ad_impressions' table:", error);
    throw error;
  }
}

async function createAuthorAnalyticsTables() {
  try {
    // Create author_analytics table
    const checkAnalyticsResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'author_analytics'
    `);
    
    if (checkAnalyticsResult.rows.length === 0) {
      console.log("Creating 'author_analytics' table...");
      await db.execute(sql`
        CREATE TABLE author_analytics (
          id SERIAL PRIMARY KEY,
          author_id INTEGER NOT NULL,
          action_type TEXT NOT NULL,
          action_data JSONB DEFAULT '{}',
          page_url TEXT,
          referrer_url TEXT,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          session_id TEXT,
          device_info JSONB DEFAULT '{}'
        )
      `);
      console.log("Table 'author_analytics' created successfully");
    } else {
      console.log("Table 'author_analytics' already exists");
    }

    // Create author_page_views table
    const checkPageViewsResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'author_page_views'
    `);
    
    if (checkPageViewsResult.rows.length === 0) {
      console.log("Creating 'author_page_views' table...");
      await db.execute(sql`
        CREATE TABLE author_page_views (
          id SERIAL PRIMARY KEY,
          author_id INTEGER NOT NULL,
          page_url TEXT NOT NULL,
          referrer TEXT,
          device_info JSONB,
          session_id TEXT,
          entered_at TIMESTAMP NOT NULL DEFAULT NOW(),
          exited_at TIMESTAMP,
          duration INTEGER
        )
      `);
      console.log("Table 'author_page_views' created successfully");
    } else {
      console.log("Table 'author_page_views' already exists");
    }

    // Create author_form_analytics table
    const checkFormAnalyticsResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'author_form_analytics'
    `);
    
    if (checkFormAnalyticsResult.rows.length === 0) {
      console.log("Creating 'author_form_analytics' table...");
      await db.execute(sql`
        CREATE TABLE author_form_analytics (
          id SERIAL PRIMARY KEY,
          author_id INTEGER NOT NULL,
          form_id TEXT NOT NULL,
          form_name TEXT NOT NULL,
          device_info JSONB,
          session_id TEXT,
          status TEXT DEFAULT 'started',
          form_data JSONB,
          step_data JSONB DEFAULT '{}',
          abandoned_step TEXT,
          started_at TIMESTAMP NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMP,
          duration INTEGER
        )
      `);
      console.log("Table 'author_form_analytics' created successfully");
    } else {
      console.log("Table 'author_form_analytics' already exists");
    }
  } catch (error) {
    console.error("Error creating author analytics tables:", error);
    throw error;
  }
}

async function createBetaKeysTables() {
  try {
    // Check if beta_keys table exists
    const checkBetaKeysResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'beta_keys'
    `);
    
    if (checkBetaKeysResult.rows.length === 0) {
      console.log("Creating 'beta_keys' table...");
      await db.execute(sql`
        CREATE TABLE beta_keys (
          id SERIAL PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          usage_limit INTEGER,
          usage_count INTEGER NOT NULL DEFAULT 0,
          created_by INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMP
        )
      `);
      console.log("Table 'beta_keys' created successfully");
    } else {
      console.log("Table 'beta_keys' already exists");
    }

    // Check if beta_key_usage table exists
    const checkBetaKeyUsageResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'beta_key_usage'
    `);
    
    if (checkBetaKeyUsageResult.rows.length === 0) {
      console.log("Creating 'beta_key_usage' table...");
      await db.execute(sql`
        CREATE TABLE beta_key_usage (
          id SERIAL PRIMARY KEY,
          beta_key_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          used_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("Table 'beta_key_usage' created successfully");
    } else {
      console.log("Table 'beta_key_usage' already exists");
    }
  } catch (error) {
    console.error("Error creating beta keys tables:", error);
    throw error;
  }
}

export async function runMigrations() {
  console.log("Running database migrations...");
  await addFeaturedColumnToRatings();
  await addReportStatusColumnToRatings();
  await createAdImpressionsTable();
  await createAuthorAnalyticsTables();
  await createBetaKeysTables();
  console.log("Migrations completed");
}
