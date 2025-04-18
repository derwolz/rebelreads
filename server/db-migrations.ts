
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
        if (Array.isArray(contentViews)) {
          for (let i = 0; i < contentViews.length; i++) {
            const view = contentViews[i];
            
            // Insert the view into the new table
            const result = await db.execute(sql`
              INSERT INTO user_genre_views (user_id, name, rank, is_default)
              VALUES (${userId}, ${view.name}, ${view.rank}, ${view.isDefault})
              RETURNING id
            `);
            
            const viewId = result.rows[0]?.id;
            
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

async function createHomepageLayoutsTable() {
  try {
    // Check if table exists first
    const checkResult = await db.execute(sql`
      SELECT * 
      FROM information_schema.tables 
      WHERE table_name = 'homepage_layouts'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Creating 'homepage_layouts' table...");
      await db.execute(sql`
        CREATE TABLE homepage_layouts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          sections JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("Table 'homepage_layouts' created successfully");
    } else {
      console.log("Table 'homepage_layouts' already exists");
    }
  } catch (error) {
    console.error("Error creating 'homepage_layouts' table:", error);
    throw error;
  }
}

async function createBookImagesTable() {
  try {
    console.log("Checking for book_images table...");
    
    // Check if book_images table exists
    const tableResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'book_images'
    `);
    
    if (tableResult.rows.length === 0) {
      console.log("Creating 'book_images' table...");
      await db.execute(sql`
        CREATE TABLE book_images (
          id SERIAL PRIMARY KEY,
          book_id INTEGER NOT NULL REFERENCES books(id),
          image_url TEXT NOT NULL,
          image_type TEXT NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          size_kb INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("Table 'book_images' created successfully");
    } else {
      console.log("Table 'book_images' already exists");
    }
  } catch (error) {
    console.error("Error creating book_images table:", error);
    throw error;
  }
}

async function migrateCoverUrlToBookImages() {
  try {
    console.log("Migrating cover_url data to book_images table...");
    
    // Check if cover_url column exists in books table
    const columnResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'books' AND column_name = 'cover_url'
    `);
    
    if (columnResult.rows.length > 0) {
      console.log("cover_url column exists, migrating data...");
      
      // Get all books with cover_url
      const books = await db.execute(sql`
        SELECT id, cover_url FROM books WHERE cover_url IS NOT NULL
      `);
      
      console.log(`Found ${books.rows.length} books with cover URLs to migrate`);
      
      // Insert each book's cover into book_images as book-detail type
      for (const book of books.rows) {
        const bookId = book.id;
        const coverUrl = book.cover_url;
        
        // Check if we already have an image for this book to avoid duplicates
        const existingImage = await db.execute(sql`
          SELECT id FROM book_images 
          WHERE book_id = ${bookId} AND image_type = 'book-detail'
        `);
        
        if (existingImage.rows.length === 0) {
          await db.execute(sql`
            INSERT INTO book_images 
            (book_id, image_url, image_type, width, height, created_at, updated_at)
            VALUES 
            (${bookId}, ${coverUrl}, 'book-detail', 480, 600, NOW(), NOW())
          `);
          
          // Also add as mini image
          await db.execute(sql`
            INSERT INTO book_images 
            (book_id, image_url, image_type, width, height, created_at, updated_at)
            VALUES 
            (${bookId}, ${coverUrl}, 'mini', 48, 64, NOW(), NOW())
          `);
          
          console.log(`Migrated cover_url for book ${bookId}`);
        } else {
          console.log(`Book ${bookId} already has images, skipping`);
        }
      }
      
      console.log("Cover URL migration completed");
    } else {
      console.log("cover_url column no longer exists, skipping migration");
    }
  } catch (error) {
    console.error("Error migrating cover_url data:", error);
    throw error;
  }
}

async function removeCoverUrlColumn() {
  try {
    console.log("Checking for cover_url column in books table...");
    
    // Check if cover_url column exists in books table
    const columnResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'books' AND column_name = 'cover_url'
    `);
    
    if (columnResult.rows.length > 0) {
      console.log("cover_url column exists, removing it...");
      
      // Remove the cover_url column from the books table
      await db.execute(sql`
        ALTER TABLE books 
        DROP COLUMN cover_url
      `);
      
      console.log("cover_url column removed successfully");
    } else {
      console.log("cover_url column does not exist, skipping removal");
    }
  } catch (error) {
    console.error("Error removing cover_url column:", error);
    throw error;
  }
}

async function splitUserTable() {
  try {
    console.log("Starting splitUserTable migration function...");
    
    // Check if authors table exists
    const checkAuthorsTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'authors'
    `);
    
    console.log(`Authors table check result: ${JSON.stringify(checkAuthorsTable.rows)}`);
    
    if (checkAuthorsTable.rows.length === 0) {
      console.log("Creating 'authors' table and migrating author data...");
      
      try {
        // Create the authors table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS authors (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
            author_name TEXT NOT NULL,
            author_image_url TEXT,
            birth_date DATE,
            death_date DATE,
            website TEXT,
            bio TEXT,
            is_pro BOOLEAN NOT NULL DEFAULT false,
            pro_expires_at TIMESTAMP,
            credits DECIMAL NOT NULL DEFAULT '0'
          )
        `);
        console.log("Authors table structure created successfully");
        
        // Check if there are any users with is_author = true
        const checkAuthors = await db.execute(sql`
          SELECT COUNT(*) as author_count FROM users WHERE is_author = true
        `);
        console.log(`Found ${checkAuthors.rows[0]?.author_count || 0} users who are authors`);
        
        // Migrate data from users table to authors table for users who are authors
        await db.execute(sql`
          INSERT INTO authors (
            user_id, 
            author_name, 
            author_image_url, 
            birth_date, 
            death_date, 
            website, 
            bio, 
            is_pro, 
            pro_expires_at, 
            credits
          )
          SELECT 
            id AS user_id,
            COALESCE(author_name, username) AS author_name,
            author_image_url,
            birth_date,
            death_date,
            website,
            author_bio AS bio,
            is_pro,
            pro_expires_at,
            credits
          FROM users 
          WHERE is_author = true
        `);
        
        console.log("Authors data migrated successfully");
      } catch (err) {
        console.error("Error during authors table creation or data migration:", err);
        throw err;
      }
    } else {
      console.log("Authors table already exists, skipping creation");
    }
    
    // Check if publishers table exists
    const checkPublishersTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'publishers'
    `);
    
    console.log(`Publishers table check result: ${JSON.stringify(checkPublishersTable.rows)}`);
    
    if (checkPublishersTable.rows.length === 0) {
      console.log("Creating 'publishers' table...");
      
      try {
        // Create the publishers table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS publishers (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            publisher_name TEXT NOT NULL,
            publisher_description TEXT,
            description TEXT,
            business_email TEXT,
            business_phone TEXT,
            business_address TEXT,
            website TEXT,
            logo_url TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        
        console.log("Publishers table created successfully");
      } catch (err) {
        console.error("Error during publishers table creation:", err);
        throw err;
      }
    } else {
      // Check if the publishers table needs to be updated with new fields
      const checkPublishersFields = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'publishers' AND column_name = 'publisher_name'
      `);
      
      console.log(`Publishers fields check result: ${JSON.stringify(checkPublishersFields.rows)}`);
      
      if (checkPublishersFields.rows.length === 0) {
        console.log("Updating publishers table with new fields...");
        
        try {
          // Add new columns to publishers table
          await db.execute(sql`
            ALTER TABLE publishers
            ADD COLUMN IF NOT EXISTS publisher_name TEXT NOT NULL DEFAULT '',
            ADD COLUMN IF NOT EXISTS publisher_description TEXT,
            ADD COLUMN IF NOT EXISTS business_email TEXT,
            ADD COLUMN IF NOT EXISTS business_phone TEXT,
            ADD COLUMN IF NOT EXISTS business_address TEXT
          `);
          
          // Migrate existing data to new column names
          await db.execute(sql`
            UPDATE publishers
            SET publisher_name = name,
                publisher_description = description
            WHERE publisher_name = ''
          `);
          
          console.log("Publishers table updated successfully");
        } catch (err) {
          console.error("Error during publishers table update:", err);
          throw err;
        }
      } else {
        console.log("Publishers table already has the new columns, skipping update");
      }
    }
    
    // Check if publishers_authors table exists
    const checkPublishersAuthorsTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'publishers_authors'
    `);
    
    console.log(`Publishers_authors table check result: ${JSON.stringify(checkPublishersAuthorsTable.rows)}`);
    
    if (checkPublishersAuthorsTable.rows.length === 0) {
      console.log("Creating 'publishers_authors' table...");
      
      try {
        // Create the publishers_authors table
        await db.execute(sql`
          CREATE TABLE publishers_authors (
            id SERIAL PRIMARY KEY,
            publisher_id INTEGER NOT NULL REFERENCES publishers(id),
            author_id INTEGER NOT NULL REFERENCES authors(id),
            contract_start TIMESTAMP NOT NULL,
            contract_end TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        
        console.log("Publishers_authors table created successfully");
      } catch (err) {
        console.error("Error during publishers_authors table creation:", err);
        throw err;
      }
    } else {
      console.log("Publishers_authors table exists, checking if it needs updates...");
      
      // Check if there are any foreign key constraints on publishers_authors.author_id
      const checkPublishersAuthorsFk = await db.execute(sql`
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'publishers_authors' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'author_id'
      `);
      
      console.log(`Publishers_authors foreign key check result: ${JSON.stringify(checkPublishersAuthorsFk.rows)}`);
      
      // If there's no foreign key constraint, add it to reference the authors table
      if (checkPublishersAuthorsFk.rows.length === 0) {
        console.log("Updating publishers_authors table to reference the authors table...");
        
        try {
          // Add foreign key constraint to authors table
          await db.execute(sql`
            ALTER TABLE publishers_authors
            ADD CONSTRAINT fk_publishers_authors_author
            FOREIGN KEY (author_id)
            REFERENCES authors (id)
          `);
          
          console.log("Publishers_authors table updated successfully");
        } catch (err) {
          console.error("Error during publishers_authors table update:", err);
          // Not throwing an error here as this is not critical for the application to function
          console.log("Continuing with other migrations...");
        }
      } else {
        console.log("Publishers_authors table already has the correct references");
      }
    }
    
    console.log("splitUserTable migration completed successfully");
    
  } catch (error) {
    console.error("Error splitting users table:", error);
    throw error;
  }
}

// Function to remove isAuthor field from users
async function removeIsAuthorFromUsers() {
  try {
    console.log("Checking for isAuthor column in users table...");
    
    // Check if isAuthor column exists in users table
    const checkIsAuthorColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_author'
    `);
    
    if (checkIsAuthorColumn.rows.length > 0) {
      console.log("isAuthor column exists in users table, removing it...");
      
      try {
        // Remove isAuthor column from users table
        await db.execute(sql`
          ALTER TABLE users 
          DROP COLUMN IF EXISTS is_author
        `);
        
        console.log("isAuthor column successfully removed from users table");
      } catch (err) {
        console.error("Error removing isAuthor column from users:", err);
        // Not throwing an error here as this is not critical for the application to function
        console.log("Continuing with other migrations...");
      }
    } else {
      console.log("isAuthor column doesn't exist or has already been removed");
    }
  } catch (error) {
    console.error("Error in removeIsAuthorFromUsers:", error);
    // Not throwing an error here as this is not critical for the application to function
    console.log("Continuing with other migrations...");
  }
}

// Function to remove remaining author and publisher fields from users table
async function removeAuthorPublisherFieldsFromUsers() {
  try {
    console.log("Starting removal of author and publisher fields from users table...");
    
    // Fields to check and remove
    const authorPublisherFields = [
      'author_bio',
      'author_name',
      'author_image_url',
      'birth_date',
      'death_date',
      'website',
      'is_publisher',
      'publisher_name',
      'publisher_description',
      'business_email',
      'business_phone',
      'business_address'
    ];
    
    // Check if each field exists and remove it if it does
    for (const field of authorPublisherFields) {
      const checkColumnResult = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = ${field}
      `);
      
      if (checkColumnResult.rows.length > 0) {
        console.log(`Removing '${field}' column from users table...`);
        
        try {
          await db.execute(sql`
            ALTER TABLE users 
            DROP COLUMN IF EXISTS ${sql.raw(field)}
          `);
          
          console.log(`Column '${field}' successfully removed from users table`);
        } catch (err) {
          console.error(`Error removing ${field} column:`, err);
          // Not throwing an error here as this is not critical for the application to function
          console.log("Continuing with other migrations...");
        }
      } else {
        console.log(`Column '${field}' doesn't exist or has already been removed`);
      }
    }
    
    console.log("All author and publisher fields have been removed from users table");
  } catch (error) {
    console.error("Error during author/publisher fields removal:", error);
    // Not throwing an error here as this is not critical for the application to function
    console.log("Continuing with other migrations...");
  }
}

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
    
    const checkCreditsResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'authors' AND column_name = 'credits'
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
    
    // If credits exists, remove it
    if (checkCreditsResult.rows.length > 0) {
      console.log("Removing 'credits' column from authors table...");
      await db.execute(sql`
        ALTER TABLE authors 
        DROP COLUMN credits
      `);
      console.log("Column 'credits' removed successfully from authors table");
    } else {
      console.log("Column 'credits' doesn't exist or has already been removed from authors table");
    }
  } catch (error) {
    console.error("Error removing columns from authors table:", error);
    throw error;
  }
}

async function createFeedbackTicketsTable() {
  try {
    // Check if feedback_tickets table exists
    const checkResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'feedback_tickets'
      )
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (!tableExists) {
      console.log("Creating feedback_tickets table...");
      await db.execute(sql`
        CREATE TABLE feedback_tickets (
          id SERIAL PRIMARY KEY,
          ticket_number TEXT NOT NULL UNIQUE,
          user_id INTEGER,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'new',
          priority INTEGER DEFAULT 1,
          assigned_to INTEGER,
          device_info JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          resolved_at TIMESTAMP
        )
      `);
      console.log("feedback_tickets table created successfully");
    } else {
      console.log("feedback_tickets table already exists");
    }
  } catch (error) {
    console.error("Error creating feedback_tickets table:", error);
    throw error;
  }
}

async function addAdminNotesToFeedbackTickets() {
  try {
    // Check if admin_notes column exists
    const checkResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'feedback_tickets' AND column_name = 'admin_notes'
      )
    `);
    
    const columnExists = checkResult.rows[0].exists;
    
    if (!columnExists) {
      console.log("Adding admin_notes column to feedback_tickets table...");
      await db.execute(sql`
        ALTER TABLE feedback_tickets 
        ADD COLUMN admin_notes TEXT
      `);
      console.log("admin_notes column added successfully");
    } else {
      console.log("admin_notes column already exists in feedback_tickets table");
    }
  } catch (error) {
    console.error("Error adding admin_notes column:", error);
    throw error;
  }
}

async function addAdminNotesDataToFeedbackTickets() {
  try {
    // Check if admin_notes_data column exists
    const checkResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'feedback_tickets' AND column_name = 'admin_notes_data'
      )
    `);
    
    const columnExists = checkResult.rows[0].exists;
    
    if (!columnExists) {
      console.log("Adding admin_notes_data column to feedback_tickets table...");
      await db.execute(sql`
        ALTER TABLE feedback_tickets 
        ADD COLUMN admin_notes_data JSONB DEFAULT '[]'::jsonb
      `);
      
      // Migrate existing admin_notes to the new structured format
      console.log("Migrating existing admin notes to structured format...");
      const existingTickets = await db.execute(sql`
        SELECT id, admin_notes, updated_at
        FROM feedback_tickets
        WHERE admin_notes IS NOT NULL AND admin_notes != ''
      `);
      
      for (const ticket of existingTickets.rows) {
        if (ticket.admin_notes) {
          const noteId = Date.now().toString(); // Simple ID generation
          const noteData = [{
            id: noteId,
            content: ticket.admin_notes,
            createdAt: ticket.updated_at || new Date()
          }];
          
          await db.execute(sql`
            UPDATE feedback_tickets
            SET admin_notes_data = ${JSON.stringify(noteData)}::jsonb
            WHERE id = ${ticket.id}
          `);
        }
      }
      
      console.log("admin_notes_data column added and migration completed successfully");
    } else {
      console.log("admin_notes_data column already exists in feedback_tickets table");
    }
  } catch (error) {
    console.error("Error adding admin_notes_data column to feedback_tickets:", error);
    throw error;
  }
}

// Create publisher_sellers table for authenticating salesmen
async function createPublisherSellersTable() {
  try {
    console.log("Checking for publisher_sellers table...");
    
    // Check if the table already exists
    const checkResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'publisher_sellers'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Creating publisher_sellers table...");
      
      await db.execute(sql`
        CREATE TABLE publisher_sellers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          company TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          verification_code TEXT,
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("publisher_sellers table created successfully");
    } else {
      console.log("publisher_sellers table already exists");
    }
  } catch (error) {
    console.error("Error creating publisher_sellers table:", error);
    throw error;
  }
}

async function removeGenresColumnFromBooks() {
  console.log("Starting removal of genres column from books table...");
  
  try {
    // Check if genres column exists
    const genresColumnCheck = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'books' AND column_name = 'genres';
    `);
    
    if (genresColumnCheck.rowCount > 0) {
      console.log("Removing genres column from books table");
      await db.execute(sql`ALTER TABLE books DROP COLUMN IF EXISTS genres;`);
      console.log("Genres column has been removed from books table");
    } else {
      console.log("Column 'genres' doesn't exist or has already been removed");
    }
  } catch (error) {
    console.error("Error removing genres column from books table:", error);
  }
}

async function removeAuthorColumnsFromBooks() {
  console.log("Starting removal of author and authorImageUrl columns from books table...");
  
  try {
    // Check if author column exists
    const authorColumnCheck = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'books' AND column_name = 'author';
    `);
    
    if (authorColumnCheck.rowCount > 0) {
      console.log("Removing author column from books table");
      await db.execute(sql`ALTER TABLE books DROP COLUMN IF EXISTS author;`);
    } else {
      console.log("Column 'author' doesn't exist or has already been removed");
    }
    
    // Check if authorImageUrl column exists
    const authorImageColumnCheck = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'books' AND column_name = 'author_image_url';
    `);
    
    if (authorImageColumnCheck.rowCount > 0) {
      console.log("Removing authorImageUrl column from books table");
      await db.execute(sql`ALTER TABLE books DROP COLUMN IF EXISTS author_image_url;`);
    } else {
      console.log("Column 'author_image_url' doesn't exist or has already been removed");
    }
    
    console.log("Author columns have been removed from books table");
  } catch (error) {
    console.error("Error removing author columns from books table:", error);
  }
}

async function removeHasBetaAccessFromUsers() {
  try {
    // Check if has_beta_access column exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'has_beta_access'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log("Removing 'has_beta_access' column from users table...");
      await db.execute(sql`
        ALTER TABLE users 
        DROP COLUMN has_beta_access
      `);
      console.log("Column 'has_beta_access' removed successfully");
    } else {
      console.log("Column 'has_beta_access' doesn't exist or has already been removed");
    }
  } catch (error) {
    console.error("Error removing has_beta_access column:", error);
    throw error;
  }
}

/**
 * Migration function to create the user_blocks table for content filtering
 */
async function createUserBlocksTable() {
  try {
    // Check if user_blocks table exists
    const checkResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'user_blocks'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Creating 'user_blocks' table...");
      await db.execute(sql`
        CREATE TABLE user_blocks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          block_type TEXT NOT NULL,
          block_id INTEGER NOT NULL,
          block_name TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create index for faster filtering
      await db.execute(sql`
        CREATE INDEX user_blocks_user_id_idx ON user_blocks(user_id)
      `);
      
      // Create index for combined user and block type filtering
      await db.execute(sql`
        CREATE INDEX user_blocks_type_idx ON user_blocks(user_id, block_type)
      `);
      
      // Create unique constraint to prevent duplicate blocks
      await db.execute(sql`
        CREATE UNIQUE INDEX user_blocks_unique_idx ON user_blocks(user_id, block_type, block_id)
      `);
      
      console.log("Table 'user_blocks' created successfully");
    } else {
      console.log("Table 'user_blocks' already exists");
    }
  } catch (error) {
    console.error("Error creating user_blocks table:", error);
    throw error;
  }
}

/**
 * Add database indexes to improve performance on frequently queried columns
 * Includes indexes for foreign keys, search columns, and commonly accessed fields
 */
async function addDatabaseIndexes() {
  try {
    console.log("Adding database indexes for improved performance...");
    
    // Check for existing indexes to avoid errors
    const indexesResult = await db.execute(sql`
      SELECT indexname FROM pg_indexes 
      WHERE tablename IN (
        'books', 'users', 'authors', 'book_genre_taxonomies', 'ratings', 
        'reading_status', 'author_page_views', 'publishers_authors'
      )
    `);
    
    const existingIndexes = indexesResult.rows.map(row => row.indexname);
    
    // Define indexes to create - key is index name, value is the SQL to create it
    const indexesToCreate = {
      // Books table indexes
      "idx_books_authorid": sql`CREATE INDEX IF NOT EXISTS idx_books_authorid ON books (author_id)`,
      "idx_books_title": sql`CREATE INDEX IF NOT EXISTS idx_books_title ON books (title)`,
      "idx_books_published": sql`CREATE INDEX IF NOT EXISTS idx_books_published ON books (published_date)`,
      "idx_books_impressions": sql`CREATE INDEX IF NOT EXISTS idx_books_impressions ON books (impression_count DESC)`,
      
      // Book taxonomies indexes
      "idx_book_genre_taxonomies_bookid": sql`CREATE INDEX IF NOT EXISTS idx_book_genre_taxonomies_bookid ON book_genre_taxonomies (book_id)`,
      "idx_book_genre_taxonomies_taxid": sql`CREATE INDEX IF NOT EXISTS idx_book_genre_taxonomies_taxid ON book_genre_taxonomies (taxonomy_id)`,
      "idx_book_genre_importance": sql`CREATE INDEX IF NOT EXISTS idx_book_genre_importance ON book_genre_taxonomies (importance DESC)`,
      
      // Book images index
      "idx_book_images_bookid": sql`CREATE INDEX IF NOT EXISTS idx_book_images_bookid ON book_images (book_id)`,
      "idx_book_images_type": sql`CREATE INDEX IF NOT EXISTS idx_book_images_type ON book_images (image_type)`,
      
      // Reading status indexes
      "idx_reading_status_userid": sql`CREATE INDEX IF NOT EXISTS idx_reading_status_userid ON reading_status (user_id)`,
      "idx_reading_status_bookid": sql`CREATE INDEX IF NOT EXISTS idx_reading_status_bookid ON reading_status (book_id)`,
      "idx_reading_status_wishlist": sql`CREATE INDEX IF NOT EXISTS idx_reading_status_wishlist ON reading_status (user_id, is_wishlisted) 
                                         WHERE is_wishlisted = true`,
      "idx_reading_status_completed": sql`CREATE INDEX IF NOT EXISTS idx_reading_status_completed ON reading_status (user_id, is_completed) 
                                          WHERE is_completed = true`,
      
      // Ratings indexes
      "idx_ratings_bookid": sql`CREATE INDEX IF NOT EXISTS idx_ratings_bookid ON ratings (book_id)`,
      "idx_ratings_userid": sql`CREATE INDEX IF NOT EXISTS idx_ratings_userid ON ratings (user_id)`,
      "idx_ratings_featured": sql`CREATE INDEX IF NOT EXISTS idx_ratings_featured ON ratings (featured) 
                                  WHERE featured = true`,
      
      // User table indexes
      "idx_users_email": sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`,
      "idx_users_username": sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)`,
      "idx_users_pro": sql`CREATE INDEX IF NOT EXISTS idx_users_pro ON users (is_pro) 
                           WHERE is_pro = true`,
      
      // Author table indexes  
      "idx_authors_userid": sql`CREATE INDEX IF NOT EXISTS idx_authors_userid ON authors (user_id)`,
      
      // Author analytics indexes
      "idx_author_page_views_authorid": sql`CREATE INDEX IF NOT EXISTS idx_author_page_views_authorid ON author_page_views (author_id)`,
      "idx_author_page_views_date": sql`CREATE INDEX IF NOT EXISTS idx_author_page_views_date ON author_page_views (entered_at)`,
      
      // Publisher-Author relationship index
      "idx_publishers_authors_publisherid": sql`CREATE INDEX IF NOT EXISTS idx_publishers_authors_publisherid ON publishers_authors (publisher_id)`,
      "idx_publishers_authors_authorid": sql`CREATE INDEX IF NOT EXISTS idx_publishers_authors_authorid ON publishers_authors (author_id)`,
      
      // User blocks index (for content filtering)
      "idx_user_blocks_userid": sql`CREATE INDEX IF NOT EXISTS idx_user_blocks_userid ON user_blocks (user_id)`,
      
      // View genres index (for user preferences)
      "idx_view_genres_viewid": sql`CREATE INDEX IF NOT EXISTS idx_view_genres_viewid ON view_genres (view_id)`,
      
      // User genre views index
      "idx_user_genre_views_userid": sql`CREATE INDEX IF NOT EXISTS idx_user_genre_views_userid ON user_genre_views (user_id)`
    };
    
    // Create each index if it doesn't already exist
    for (const [indexName, createSql] of Object.entries(indexesToCreate)) {
      if (!existingIndexes.includes(indexName.toLowerCase())) {
        console.log(`Creating index: ${indexName}`);
        await db.execute(createSql);
        console.log(`Index ${indexName} created successfully`);
      } else {
        console.log(`Index ${indexName} already exists, skipping`);
      }
    }
    
    console.log("Database indexing completed");
  } catch (error) {
    console.error("Error adding database indexes:", error);
    throw error;
  }
}

/**
 * Create book shelf, shelf books, and notes tables for the BookShelf feature
 */
async function createBookShelfTables() {
  try {
    // Check if tables exist
    const bookshelvesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'book_shelves'
    `);

    if (bookshelvesResult.rows.length === 0) {
      console.log("Creating book_shelves table...");
      await db.execute(sql`
        CREATE TABLE book_shelves (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          cover_image_url TEXT DEFAULT '/images/default-bookshelf-cover.svg',
          rank INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("book_shelves table created successfully");
    } else {
      console.log("book_shelves table already exists");
    }

    const shelfBooksResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'shelf_books'
    `);

    if (shelfBooksResult.rows.length === 0) {
      console.log("Creating shelf_books table...");
      await db.execute(sql`
        CREATE TABLE shelf_books (
          id SERIAL PRIMARY KEY,
          shelf_id INTEGER NOT NULL REFERENCES book_shelves(id),
          book_id INTEGER NOT NULL REFERENCES books(id),
          rank INTEGER NOT NULL DEFAULT 0,
          added_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("shelf_books table created successfully");
    } else {
      console.log("shelf_books table already exists");
    }

    const notesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'notes'
    `);

    if (notesResult.rows.length === 0) {
      console.log("Creating notes table...");
      await db.execute(sql`
        CREATE TABLE notes (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          content TEXT NOT NULL,
          type TEXT NOT NULL,
          book_id INTEGER REFERENCES books(id),
          shelf_id INTEGER REFERENCES book_shelves(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("notes table created successfully");
    } else {
      console.log("notes table already exists");
    }
  } catch (error) {
    console.error("Error creating bookshelf tables:", error);
    throw error;
  }
}

export async function runMigrations() {
  console.log("Running database migrations...");
  // Remove has_beta_access column from users table
  await removeHasBetaAccessFromUsers();
  await removeGenresColumnFromBooks();
  await removeAuthorColumnsFromBooks();
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
  // Create bookshelf tables
  await createBookShelfTables();
  // Create user genre preferences table
  await createUserGenrePreferencesTable();
  // Add content_views column to user_genre_preferences table
  await addContentViewsColumnToUserGenrePreferences();
  // Create the new genre views tables and migrate data from the old table
  await createGenreViewsTables();
  // Create homepage layouts table
  await createHomepageLayoutsTable();
  // Create book_images table and migrate data
  await createBookImagesTable();
  await migrateCoverUrlToBookImages();
  // Remove cover_url column from books table
  await removeCoverUrlColumn();
  // Split user table to separate authors and publishers tables
  await splitUserTable();
  // Remove isAuthor field from users table
  await removeIsAuthorFromUsers();
  // Remove remaining author/publisher fields from users table
  await removeAuthorPublisherFieldsFromUsers();
  // Remove pro columns from authors table (already tracked in users table)
  await removeProColumnsFromAuthors();
  // Create user_blocks table for content filtering
  await createUserBlocksTable();
  // Create feedback tickets table for beta feedback
  await createFeedbackTicketsTable();
  // Add admin_notes column to feedback_tickets table
  await addAdminNotesToFeedbackTickets();
  // Add admin_notes_data column to feedback_tickets table for structured notes with timestamps
  await addAdminNotesDataToFeedbackTickets();
  // Add user_id column to publishers table with foreign key to users
  await addUserIdToPublishers();
  // Create publisher_sellers table for authenticating salesmen
  await createPublisherSellersTable();
  await createSellersTableAndUpdatePublisherSellers();
  
  // Add performance optimization indexes
  await addDatabaseIndexes();
  
  console.log("Migrations completed");
}

async function createSellersTableAndUpdatePublisherSellers() {
  try {
    console.log("Checking for sellers table...");
    
    // Check if the table already exists
    const checkResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'sellers'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Creating sellers table and modifying publisher_sellers table...");
      
      // First, create the sellers table
      await db.execute(sql`
        CREATE TABLE sellers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          company TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Check if publisher_sellers table exists
      const publisherSellersCheckResult = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'publisher_sellers'
      `);
      
      if (publisherSellersCheckResult.rows.length > 0) {
        console.log("Migrating data from publisher_sellers to sellers table...");
        
        // Check if user_id column exists in publisher_sellers
        const userIdCheckResult = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'publisher_sellers' AND column_name = 'user_id'
        `);
        
        if (userIdCheckResult.rows.length > 0) {
          // Migrate existing data from publisher_sellers to sellers
          await db.execute(sql`
            INSERT INTO sellers (user_id, name, email, company, status, notes, created_at, updated_at)
            SELECT user_id, name, email, company, status, notes, created_at, updated_at
            FROM publisher_sellers
          `);
          
          // Create a temporary table to store the mapping
          await db.execute(sql`
            CREATE TEMP TABLE seller_mapping AS
            SELECT ps.id AS publisher_seller_id, s.id AS seller_id
            FROM publisher_sellers ps
            JOIN sellers s ON ps.user_id = s.user_id
          `);
          
          // Backup the existing publisher_sellers table
          await db.execute(sql`
            CREATE TABLE publisher_sellers_backup AS
            SELECT * FROM publisher_sellers
          `);
          
          // Drop the old publisher_sellers table
          await db.execute(sql`DROP TABLE publisher_sellers`);
          
          // Create the new publisher_sellers table with seller_id
          await db.execute(sql`
            CREATE TABLE publisher_sellers (
              id SERIAL PRIMARY KEY,
              seller_id INTEGER NOT NULL REFERENCES sellers(id),
              verification_code TEXT,
              created_at TIMESTAMP NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
          `);
          
          // Migrate the data to the new publisher_sellers table
          await db.execute(sql`
            INSERT INTO publisher_sellers (id, seller_id, verification_code, created_at, updated_at)
            SELECT psb.id, sm.seller_id, psb.verification_code, psb.created_at, psb.updated_at
            FROM publisher_sellers_backup psb
            JOIN seller_mapping sm ON psb.id = sm.publisher_seller_id
          `);
          
          // Drop the temporary tables
          await db.execute(sql`DROP TABLE seller_mapping`);
          await db.execute(sql`DROP TABLE publisher_sellers_backup`);
          
          console.log("Successfully migrated publisher_sellers table to use seller_id");
        } else {
          console.log("publisher_sellers table already has the updated schema with seller_id");
        }
      }
      
      console.log("sellers table created successfully");
    } else {
      console.log("sellers table already exists");
      
      // Check if publisher_sellers has seller_id instead of user_id
      const sellerIdCheckResult = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'publisher_sellers' AND column_name = 'seller_id'
      `);
      
      if (sellerIdCheckResult.rows.length > 0) {
        console.log("publisher_sellers table already has the updated schema with seller_id");
      } else {
        console.log("publisher_sellers table needs to be updated but sellers table exists - skipping to avoid conflicts");
      }
    }
  } catch (error) {
    console.error("Error creating sellers table and updating publisher_sellers:", error);
  }
}

// Add user_id column to publishers table with a foreign key reference to users
async function addUserIdToPublishers() {
  try {
    console.log("Checking if user_id column exists in publishers table...");
    
    // Check if the column already exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'publishers' AND column_name = 'user_id'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding user_id column to publishers table...");
      
      // First add the column
      await db.execute(sql`
        ALTER TABLE publishers 
        ADD COLUMN user_id INTEGER
      `);
      
      // Then add the foreign key constraint
      await db.execute(sql`
        ALTER TABLE publishers
        ADD CONSTRAINT fk_publishers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
      `);
      
      // Add unique constraint
      await db.execute(sql`
        ALTER TABLE publishers
        ADD CONSTRAINT unique_user_publisher UNIQUE (user_id)
      `);
      
      console.log("user_id column added to publishers table with foreign key constraint");
    } else {
      console.log("user_id column already exists in publishers table");
    }
  } catch (error) {
    console.error("Error adding user_id column to publishers table:", error);
    throw error;
  }
}
