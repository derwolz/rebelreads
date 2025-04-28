
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
      
      await db.execute(sql`
        ALTER TABLE ratings 
        ADD COLUMN featured boolean DEFAULT false
      `);
      
    } else {
      
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
      
      await db.execute(sql`
        ALTER TABLE ratings 
        ADD COLUMN report_status text DEFAULT 'none'
      `);
      
    } else {
      
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
      
    } else {
      
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
      
    } else {
      
    }

    // Create author_page_views table
    const checkPageViewsResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'author_page_views'
    `);
    
    if (checkPageViewsResult.rows.length === 0) {
      
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
      
    } else {
      
    }

    // Create author_form_analytics table
    const checkFormAnalyticsResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'author_form_analytics'
    `);
    
    if (checkFormAnalyticsResult.rows.length === 0) {
      
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
      
    } else {
      
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
      
    } else {
      
    }

    // Check if beta_key_usage table exists
    const checkBetaKeyUsageResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'beta_key_usage'
    `);
    
    if (checkBetaKeyUsageResult.rows.length === 0) {
      
      await db.execute(sql`
        CREATE TABLE beta_key_usage (
          id SERIAL PRIMARY KEY,
          beta_key_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          used_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
    } else {
      
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
      
      await db.execute(sql`
        ALTER TABLE rating_preferences 
        ADD COLUMN criteria_weights jsonb DEFAULT '{}'::jsonb NOT NULL
      `);
      
    } else {
      
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
      
      
    } else {
      
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
      
      await db.execute(sql`
        ALTER TABLE rating_preferences 
        DROP COLUMN criteria_weights
      `);
      
    } else {
      
    }
    
    // Remove criteria_order if it exists
    if (hasCriteriaOrder) {
      
      await db.execute(sql`
        ALTER TABLE rating_preferences 
        DROP COLUMN criteria_order
      `);
      
    } else {
      
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
      
    } else {
      
    }
    
    // Check if book_genre_taxonomies table exists
    const bookGenreTaxonomiesResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'book_genre_taxonomies'
    `);
    
    if (bookGenreTaxonomiesResult.rows.length === 0) {
      
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
      
    } else {
      
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
      
      await db.execute(sql`
        ALTER TABLE users 
        DROP COLUMN favorite_genres
      `);
      
    } else {
      
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
        
        await db.execute(sql`DROP TABLE ${sql.raw(table)}`);
        
      } else {
        
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
      
    } else {
      
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
      
      
    } else {
      
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
      
    } else {
      
    }
    
    if (viewGenresExists.rows.length === 0) {
      
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
      
    } else {
      
    }
    
    // If the old table exists, migrate the data
    if (oldTableExists.rows.length > 0) {
      
      
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
      
      
      
      // Drop the old table
      
      await db.execute(sql`DROP TABLE user_genre_preferences`);
      
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
      
      await db.execute(sql`
        CREATE TABLE homepage_layouts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          sections JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
    } else {
      
    }
  } catch (error) {
    console.error("Error creating 'homepage_layouts' table:", error);
    throw error;
  }
}

async function createBookImagesTable() {
  try {
    
    
    // Check if book_images table exists
    const tableResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'book_images'
    `);
    
    if (tableResult.rows.length === 0) {
      
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
      
    } else {
      
    }
  } catch (error) {
    console.error("Error creating book_images table:", error);
    throw error;
  }
}

async function migrateCoverUrlToBookImages() {
  try {
    
    
    // Check if cover_url column exists in books table
    const columnResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'books' AND column_name = 'cover_url'
    `);
    
    if (columnResult.rows.length > 0) {
      
      
      // Get all books with cover_url
      const books = await db.execute(sql`
        SELECT id, cover_url FROM books WHERE cover_url IS NOT NULL
      `);
      
      
      
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
          
          
        } else {
          
        }
      }
      
      
    } else {
      
    }
  } catch (error) {
    console.error("Error migrating cover_url data:", error);
    throw error;
  }
}

async function removeCoverUrlColumn() {
  try {
    
    
    // Check if cover_url column exists in books table
    const columnResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'books' AND column_name = 'cover_url'
    `);
    
    if (columnResult.rows.length > 0) {
      
      
      // Remove the cover_url column from the books table
      await db.execute(sql`
        ALTER TABLE books 
        DROP COLUMN cover_url
      `);
      
      
    } else {
      
    }
  } catch (error) {
    console.error("Error removing cover_url column:", error);
    throw error;
  }
}

async function splitUserTable() {
  try {
    
    
    // Check if authors table exists
    const checkAuthorsTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'authors'
    `);
    
    
    
    if (checkAuthorsTable.rows.length === 0) {
      
      
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
        
        
        // Check if there are any users with is_author = true
        const checkAuthors = await db.execute(sql`
          SELECT COUNT(*) as author_count FROM users WHERE is_author = true
        `);
        
        
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
        
        
      } catch (err) {
        console.error("Error during authors table creation or data migration:", err);
        throw err;
      }
    } else {
      
    }
    
    // Check if publishers table exists
    const checkPublishersTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'publishers'
    `);
    
    
    
    if (checkPublishersTable.rows.length === 0) {
      
      
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
      
      
      
      if (checkPublishersFields.rows.length === 0) {
        
        
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
          
          
        } catch (err) {
          console.error("Error during publishers table update:", err);
          throw err;
        }
      } else {
        
      }
    }
    
    // Check if publishers_authors table exists
    const checkPublishersAuthorsTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'publishers_authors'
    `);
    
    
    
    if (checkPublishersAuthorsTable.rows.length === 0) {
      
      
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
        
        
      } catch (err) {
        console.error("Error during publishers_authors table creation:", err);
        throw err;
      }
    } else {
      
      
      // Check if there are any foreign key constraints on publishers_authors.author_id
      const checkPublishersAuthorsFk = await db.execute(sql`
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'publishers_authors' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'author_id'
      `);
      
      
      
      // If there's no foreign key constraint, add it to reference the authors table
      if (checkPublishersAuthorsFk.rows.length === 0) {
        
        
        try {
          // Add foreign key constraint to authors table
          await db.execute(sql`
            ALTER TABLE publishers_authors
            ADD CONSTRAINT fk_publishers_authors_author
            FOREIGN KEY (author_id)
            REFERENCES authors (id)
          `);
          
          
        } catch (err) {
          console.error("Error during publishers_authors table update:", err);
          // Not throwing an error here as this is not critical for the application to function
          
        }
      } else {
        
      }
    }
    
    
    
  } catch (error) {
    console.error("Error splitting users table:", error);
    throw error;
  }
}

// Function to remove isAuthor field from users
async function removeIsAuthorFromUsers() {
  try {
    
    
    // Check if isAuthor column exists in users table
    const checkIsAuthorColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_author'
    `);
    
    if (checkIsAuthorColumn.rows.length > 0) {
      
      
      try {
        // Remove isAuthor column from users table
        await db.execute(sql`
          ALTER TABLE users 
          DROP COLUMN IF EXISTS is_author
        `);
        
        
      } catch (err) {
        console.error("Error removing isAuthor column from users:", err);
        // Not throwing an error here as this is not critical for the application to function
        
      }
    } else {
      
    }
  } catch (error) {
    console.error("Error in removeIsAuthorFromUsers:", error);
    // Not throwing an error here as this is not critical for the application to function
    
  }
}

// Function to remove remaining author and publisher fields from users table
async function removeAuthorPublisherFieldsFromUsers() {
  try {
    
    
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
        
        
        try {
          await db.execute(sql`
            ALTER TABLE users 
            DROP COLUMN IF EXISTS ${sql.raw(field)}
          `);
          
          
        } catch (err) {
          console.error(`Error removing ${field} column:`, err);
          // Not throwing an error here as this is not critical for the application to function
          
        }
      } else {
        
      }
    }
    
    
  } catch (error) {
    console.error("Error during author/publisher fields removal:", error);
    // Not throwing an error here as this is not critical for the application to function
    
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
      
      await db.execute(sql`
        ALTER TABLE authors 
        DROP COLUMN is_pro
      `);
      
    } else {
      
    }
    
    // If pro_expires_at exists, remove it
    if (checkProExpiresAtResult.rows.length > 0) {
      
      await db.execute(sql`
        ALTER TABLE authors 
        DROP COLUMN pro_expires_at
      `);
      
    } else {
      
    }
    
    // If credits exists, remove it
    if (checkCreditsResult.rows.length > 0) {
      
      await db.execute(sql`
        ALTER TABLE authors 
        DROP COLUMN credits
      `);
      
    } else {
      
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
      
    } else {
      
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
      
      await db.execute(sql`
        ALTER TABLE feedback_tickets 
        ADD COLUMN admin_notes TEXT
      `);
      
    } else {
      
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
      
      await db.execute(sql`
        ALTER TABLE feedback_tickets 
        ADD COLUMN admin_notes_data JSONB DEFAULT '[]'::jsonb
      `);
      
      // Migrate existing admin_notes to the new structured format
      
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
      
      
    } else {
      
    }
  } catch (error) {
    console.error("Error adding admin_notes_data column to feedback_tickets:", error);
    throw error;
  }
}

// Create publisher_sellers table for authenticating salesmen
async function createPublisherSellersTable() {
  try {
    
    
    // Check if the table already exists
    const checkResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'publisher_sellers'
    `);
    
    if (checkResult.rows.length === 0) {
      
      
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
      
      
    } else {
      
    }
  } catch (error) {
    console.error("Error creating publisher_sellers table:", error);
    throw error;
  }
}

async function removeGenresColumnFromBooks() {
  
  
  try {
    // Check if genres column exists
    const genresColumnCheck = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'books' AND column_name = 'genres';
    `);
    
    if (genresColumnCheck.rowCount > 0) {
      
      await db.execute(sql`ALTER TABLE books DROP COLUMN IF EXISTS genres;`);
      
    } else {
      
    }
  } catch (error) {
    console.error("Error removing genres column from books table:", error);
  }
}

async function removeAuthorColumnsFromBooks() {
  
  
  try {
    // Check if author column exists
    const authorColumnCheck = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'books' AND column_name = 'author';
    `);
    
    if (authorColumnCheck.rowCount > 0) {
      
      await db.execute(sql`ALTER TABLE books DROP COLUMN IF EXISTS author;`);
    } else {
      
    }
    
    // Check if authorImageUrl column exists
    const authorImageColumnCheck = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'books' AND column_name = 'author_image_url';
    `);
    
    if (authorImageColumnCheck.rowCount > 0) {
      
      await db.execute(sql`ALTER TABLE books DROP COLUMN IF EXISTS author_image_url;`);
    } else {
      
    }
    
    
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
      
      await db.execute(sql`
        ALTER TABLE users 
        DROP COLUMN has_beta_access
      `);
      
    } else {
      
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
      
      
    } else {
      
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
        
        await db.execute(createSql);
        
      } else {
        
      }
    }
    
    
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
      
    } else {
      
    }

    const shelfBooksResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'shelf_books'
    `);

    if (shelfBooksResult.rows.length === 0) {
      
      await db.execute(sql`
        CREATE TABLE shelf_books (
          id SERIAL PRIMARY KEY,
          shelf_id INTEGER NOT NULL REFERENCES book_shelves(id),
          book_id INTEGER NOT NULL REFERENCES books(id),
          rank INTEGER NOT NULL DEFAULT 0,
          added_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
    } else {
      
    }

    const notesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'notes'
    `);

    if (notesResult.rows.length === 0) {
      
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
      
    } else {
      
    }
  } catch (error) {
    console.error("Error creating bookshelf tables:", error);
    throw error;
  }
}

/**
 * Add isShared column to bookShelves table
 */
async function addIsSharedColumnToBookShelves() {
  try {
    // Check if column exists first to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'book_shelves' AND column_name = 'is_shared'
    `);
    
    if (checkResult.rows.length === 0) {
      
      await db.execute(sql`
        ALTER TABLE book_shelves 
        ADD COLUMN is_shared boolean NOT NULL DEFAULT false
      `);
      
    } else {
      
    }
  } catch (error) {
    console.error("Error adding 'is_shared' column to book_shelves table:", error);
    throw error;
  }
}

// Import the social media links migration
import { addSocialMediaLinksToAuthors } from "./migrations/social-media-links";

/**
 * Create shelf comments table for comment section on shared bookshelves
 */
async function createShelfCommentsTable() {
  try {
    // Check if table exists
    const shelfCommentsResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'shelf_comments'
    `);

    if (shelfCommentsResult.rows.length === 0) {
      
      await db.execute(sql`
        CREATE TABLE shelf_comments (
          id SERIAL PRIMARY KEY,
          shelf_id INTEGER NOT NULL REFERENCES book_shelves(id),
          user_id INTEGER REFERENCES users(id),
          username TEXT,
          content TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
    } else {
      
    }
  } catch (error) {
    console.error("Error creating shelf comments table:", error);
    throw error;
  }
}

export async function runMigrations() {
  
  // Remove has_beta_access column from users table
  await removeHasBetaAccessFromUsers();
  await removeGenresColumnFromBooks();
  await removeAuthorColumnsFromBooks();
  await updateAuthorBashResponsesTable();
  await addFeaturedColumnToRatings();
  await addReportStatusColumnToRatings();
  await createAdImpressionsTable();
  await createAuthorAnalyticsTables();
  await addSocialMediaLinksToAuthors();
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
  // Add isShared column to bookShelves table
  await addIsSharedColumnToBookShelves();
  // Create shelf comments table
  await createShelfCommentsTable();
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
  
  // Import and run AuthorBash migrations
  const { runAuthorBashMigrations } = await import("./migrations/authorbash-tables");
  await runAuthorBashMigrations();
}

async function createSellersTableAndUpdatePublisherSellers() {
  try {
    
    
    // Check if the table already exists
    const checkResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'sellers'
    `);
    
    if (checkResult.rows.length === 0) {
      
      
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
          
          
        } else {
          
        }
      }
      
      
    } else {
      
      
      // Check if publisher_sellers has seller_id instead of user_id
      const sellerIdCheckResult = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'publisher_sellers' AND column_name = 'seller_id'
      `);
      
      if (sellerIdCheckResult.rows.length > 0) {
        
      } else {
        
      }
    }
  } catch (error) {
    console.error("Error creating sellers table and updating publisher_sellers:", error);
  }
}

/**
 * Make text and imageUrl columns in authorbash_responses table nullable
 * This allows submissions with only text or only image
 */
async function updateAuthorBashResponsesTable() {
  try {
    console.log("Checking authorbash_responses table...");
    
    // Check if the table exists
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'authorbash_responses'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log("AuthorBash responses table exists, updating columns...");
      
      // Drop NOT NULL constraint from text column
      await db.execute(sql`
        ALTER TABLE authorbash_responses 
        ALTER COLUMN text DROP NOT NULL
      `);
      
      // Drop NOT NULL constraint from image_url column
      await db.execute(sql`
        ALTER TABLE authorbash_responses 
        ALTER COLUMN image_url DROP NOT NULL
      `);
      
      console.log("AuthorBash responses table updated successfully");
    } else {
      console.log("AuthorBash responses table doesn't exist yet, skipping update");
    }
  } catch (error) {
    console.error("Error updating AuthorBash responses table:", error);
  }
}

// Add user_id column to publishers table with a foreign key reference to users
async function addUserIdToPublishers() {
  try {
    
    
    // Check if the column already exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'publishers' AND column_name = 'user_id'
    `);
    
    if (checkResult.rows.length === 0) {
      
      
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
      
      
    } else {
      
    }
  } catch (error) {
    console.error("Error adding user_id column to publishers table:", error);
    throw error;
  }
}
