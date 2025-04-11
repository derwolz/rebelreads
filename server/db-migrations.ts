
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

async function addCriteriaWeightsColumnToRatingPreferences() {
  try {
    // Check if column exists first to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rating_preferences' AND column_name = 'criteria_weights'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding 'criteria_weights' column to rating_preferences table...");
      await db.execute(sql`
        ALTER TABLE rating_preferences 
        ADD COLUMN criteria_weights jsonb DEFAULT '{}'::jsonb NOT NULL
      `);
      console.log("Column 'criteria_weights' added successfully");
    } else {
      console.log("Column 'criteria_weights' already exists");
    }
  } catch (error) {
    console.error("Error adding 'criteria_weights' column:", error);
    throw error;
  }
}

async function addRatingMetricsColumnsToRatingPreferences() {
  try {
    // Check if columns exist first to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rating_preferences' AND column_name = 'themes'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding individual rating metrics columns to rating_preferences table...");
      
      // Add individual columns for each rating metric
      await db.execute(sql`
        ALTER TABLE rating_preferences 
        ADD COLUMN themes decimal DEFAULT 0.2 NOT NULL,
        ADD COLUMN worldbuilding decimal DEFAULT 0.08 NOT NULL,
        ADD COLUMN writing decimal DEFAULT 0.25 NOT NULL,
        ADD COLUMN enjoyment decimal DEFAULT 0.35 NOT NULL,
        ADD COLUMN characters decimal DEFAULT 0.12 NOT NULL
      `);
      
      // Update existing records to populate the new columns from criteriaWeights JSON
      await db.execute(sql`
        UPDATE rating_preferences
        SET 
          themes = (criteria_weights->>'themes')::decimal,
          worldbuilding = (criteria_weights->>'worldbuilding')::decimal,
          writing = (criteria_weights->>'writing')::decimal,
          enjoyment = (criteria_weights->>'enjoyment')::decimal,
          characters = (criteria_weights->>'characters')::decimal
        WHERE criteria_weights IS NOT NULL
      `);
      
      console.log("Individual rating metrics columns added successfully");
    } else {
      console.log("Individual rating metrics columns already exist");
    }
  } catch (error) {
    console.error("Error adding individual rating metrics columns:", error);
    throw error;
  }
}

async function removeOldRatingPreferencesColumns() {
  try {
    // Check if criteria_weights column exists
    const weightsCheckResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rating_preferences' AND column_name = 'criteria_weights'
    `);
    
    // Check if criteria_order column exists
    const orderCheckResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rating_preferences' AND column_name = 'criteria_order'
    `);
    
    const hasCriteriaWeights = weightsCheckResult.rows.length > 0;
    const hasCriteriaOrder = orderCheckResult.rows.length > 0;
    
    // Remove criteria_weights if it exists
    if (hasCriteriaWeights) {
      console.log("Removing criteria_weights column...");
      await db.execute(sql`
        ALTER TABLE rating_preferences 
        DROP COLUMN criteria_weights
      `);
      console.log("criteria_weights column removed successfully");
    } else {
      console.log("criteria_weights column has already been removed");
    }
    
    // Remove criteria_order if it exists
    if (hasCriteriaOrder) {
      console.log("Removing criteria_order column...");
      await db.execute(sql`
        ALTER TABLE rating_preferences 
        DROP COLUMN criteria_order
      `);
      console.log("criteria_order column removed successfully");
    } else {
      console.log("criteria_order column has already been removed");
    }
  } catch (error) {
    console.error("Error removing old rating preferences columns:", error);
    throw error;
  }
}

async function createTaxonomyTables() {
  try {
    // Check if genre_taxonomies table exists
    const genreTaxonomiesResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'genre_taxonomies'
    `);
    
    if (genreTaxonomiesResult.rows.length === 0) {
      console.log("Creating 'genre_taxonomies' table...");
      await db.execute(sql`
        CREATE TABLE genre_taxonomies (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          parent_id INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          deleted_at TIMESTAMP
        )
      `);
      console.log("Table 'genre_taxonomies' created successfully");
    } else {
      console.log("Table 'genre_taxonomies' already exists");
    }
    
    // Check if book_genre_taxonomies table exists
    const bookGenreTaxonomiesResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'book_genre_taxonomies'
    `);
    
    if (bookGenreTaxonomiesResult.rows.length === 0) {
      console.log("Creating 'book_genre_taxonomies' table...");
      await db.execute(sql`
        CREATE TABLE book_genre_taxonomies (
          id SERIAL PRIMARY KEY,
          book_id INTEGER NOT NULL,
          taxonomy_id INTEGER NOT NULL,
          rank INTEGER NOT NULL,
          importance DECIMAL NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("Table 'book_genre_taxonomies' created successfully");
    } else {
      console.log("Table 'book_genre_taxonomies' already exists");
    }
  } catch (error) {
    console.error("Error creating taxonomy tables:", error);
    throw error;
  }
}

async function removeFavoriteGenresFromUsers() {
  try {
    // Check if favorite_genres column exists
    const checkColumnResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'favorite_genres'
    `);

    if (checkColumnResult.rows.length > 0) {
      console.log("Removing 'favorite_genres' column from users table...");
      await db.execute(sql`
        ALTER TABLE users 
        DROP COLUMN favorite_genres
      `);
      console.log("Column 'favorite_genres' removed successfully");
    } else {
      console.log("Column 'favorite_genres' doesn't exist or has already been removed");
    }
  } catch (error) {
    console.error("Error removing favorite_genres column:", error);
    throw error;
  }
}

async function removeUserTaxonomyTables() {
  try {
    // Check if the tables exist
    const tables = ['user_preference_taxonomies', 'user_taxonomy_items', 'user_taxonomy_preferences'];
    
    for (const table of tables) {
      const checkTableResult = await db.execute(sql`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_name = ${table}
      `);

      if (checkTableResult.rows.length > 0) {
        console.log(`Dropping '${table}' table...`);
        await db.execute(sql`DROP TABLE ${sql.raw(table)}`);
        console.log(`Table '${table}' dropped successfully`);
      } else {
        console.log(`Table '${table}' doesn't exist or has already been removed`);
      }
    }
  } catch (error) {
    console.error("Error removing user taxonomy tables:", error);
    throw error;
  }
}

async function createUserGenrePreferencesTable() {
  try {
    // Check if table exists first to avoid errors
    const checkResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'user_genre_preferences'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Creating 'user_genre_preferences' table...");
      await db.execute(sql`
        CREATE TABLE user_genre_preferences (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          preferred_genres JSONB NOT NULL DEFAULT '[]',
          additional_genres JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("Table 'user_genre_preferences' created successfully");
    } else {
      console.log("Table 'user_genre_preferences' already exists");
    }
  } catch (error) {
    console.error("Error creating 'user_genre_preferences' table:", error);
    throw error;
  }
}

async function addContentViewsColumnToUserGenrePreferences() {
  try {
    // Check if column exists first to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_genre_preferences' AND column_name = 'content_views'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding 'content_views' column to user_genre_preferences table...");
      await db.execute(sql`
        ALTER TABLE user_genre_preferences 
        ADD COLUMN content_views jsonb NOT NULL DEFAULT '[]'::jsonb
      `);
      
      // Migrate existing data from preferred_genres and additional_genres to content_views
      await db.execute(sql`
        UPDATE user_genre_preferences
        SET content_views = json_build_array(
          json_build_object(
            'id', 'default-view',
            'name', 'Default View',
            'rank', 1,
            'filters', preferred_genres,
            'isDefault', true
          ),
          CASE WHEN additional_genres::text <> '[]' THEN
            json_build_object(
              'id', 'additional-view',
              'name', 'Additional View',
              'rank', 2,
              'filters', additional_genres,
              'isDefault', false
            )
          ELSE
            NULL
          END
        )::jsonb - 'null'
        WHERE preferred_genres::text <> '[]' OR additional_genres::text <> '[]'
      `);
      
      console.log("Column 'content_views' added successfully and data migrated");
    } else {
      console.log("Column 'content_views' already exists");
    }
  } catch (error) {
    console.error("Error adding 'content_views' column:", error);
    throw error;
  }
}

async function createGenreViewsTables() {
  try {
    // Check if old user_genre_preferences table exists
    const oldTableExists = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'user_genre_preferences'
    `);
    
    // First, check if the new tables already exist
    const userGenreViewsExists = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'user_genre_views'
    `);
    
    const viewGenresExists = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'view_genres'
    `);
    
    // If the new tables don't exist, create them
    if (userGenreViewsExists.rows.length === 0) {
      console.log("Creating 'user_genre_views' table...");
      await db.execute(sql`
        CREATE TABLE user_genre_views (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          rank INTEGER NOT NULL,
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("Table 'user_genre_views' created successfully");
    } else {
      console.log("Table 'user_genre_views' already exists");
    }
    
    if (viewGenresExists.rows.length === 0) {
      console.log("Creating 'view_genres' table...");
      await db.execute(sql`
        CREATE TABLE view_genres (
          id SERIAL PRIMARY KEY,
          view_id INTEGER NOT NULL,
          taxonomy_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          rank INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("Table 'view_genres' created successfully");
    } else {
      console.log("Table 'view_genres' already exists");
    }
    
    // If the old table exists, migrate the data
    if (oldTableExists.rows.length > 0) {
      console.log("Migrating data from 'user_genre_preferences' to new tables...");
      
      // Get all data from the old table
      const oldData = await db.execute(sql`
        SELECT * FROM user_genre_preferences
      `);
      
      // For each record in the old table
      for (const row of oldData.rows) {
        const userId = row.user_id;
        const contentViews = row.content_views || [];
        
        // For each content view in the old data
        for (let i = 0; i < contentViews.length; i++) {
          const view = contentViews[i];
          
          // Insert the view into the new table
          const [newView] = await db.execute(sql`
            INSERT INTO user_genre_views (user_id, name, rank, is_default)
            VALUES (${userId}, ${view.name}, ${view.rank}, ${view.isDefault})
            RETURNING id
          `);
          
          const viewId = newView.id;
          
          // Insert each genre in the view into the new table
          if (view.filters && Array.isArray(view.filters)) {
            for (let j = 0; j < view.filters.length; j++) {
              const genre = view.filters[j];
              await db.execute(sql`
                INSERT INTO view_genres (view_id, taxonomy_id, type, rank)
                VALUES (${viewId}, ${genre.taxonomyId}, ${genre.type}, ${j + 1})
              `);
            }
          }
        }
      }
      
      console.log("Data migration completed");
      
      // Drop the old table
      console.log("Dropping 'user_genre_preferences' table...");
      await db.execute(sql`DROP TABLE user_genre_preferences`);
      console.log("Table 'user_genre_preferences' dropped successfully");
    }
  } catch (error) {
    console.error("Error creating genre views tables:", error);
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
  await addCriteriaWeightsColumnToRatingPreferences();
  await addRatingMetricsColumnsToRatingPreferences();
  await removeOldRatingPreferencesColumns();
  // Add taxonomy tables
  await createTaxonomyTables();
  // Remove favorite_genres from users
  await removeFavoriteGenresFromUsers();
  // Remove user taxonomy tables
  await removeUserTaxonomyTables();
  // Create user genre preferences table
  await createUserGenrePreferencesTable();
  // Add content_views column to user_genre_preferences table
  await addContentViewsColumnToUserGenrePreferences();
  // Create the new genre views tables and migrate data from the old table
  await createGenreViewsTables();
  console.log("Migrations completed");
}
