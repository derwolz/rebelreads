
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
  // Create feedback tickets table for beta feedback
  await createFeedbackTicketsTable();
  console.log("Migrations completed");
}
