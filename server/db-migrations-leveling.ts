import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Create user levels table for tracking level progression system
 */
async function createUserLevelsTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'user_levels'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating user_levels table...");
      
      await db.execute(sql`
        CREATE TABLE user_levels (
          level INTEGER PRIMARY KEY,
          experience_required INTEGER NOT NULL,
          title TEXT NOT NULL,
          benefits JSONB DEFAULT '{}',
          description TEXT,
          icon_url TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("user_levels table created successfully");
    } else {
      console.log("user_levels table already exists");
    }
  } catch (error) {
    console.error("Error creating user_levels table:", error);
    throw error;
  }
}

/**
 * Create author levels table for tracking author level progression system
 */
async function createAuthorLevelsTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'author_levels'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating author_levels table...");
      
      await db.execute(sql`
        CREATE TABLE author_levels (
          level INTEGER PRIMARY KEY,
          experience_required INTEGER NOT NULL,
          title TEXT NOT NULL,
          benefits JSONB DEFAULT '{}',
          description TEXT,
          icon_url TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("author_levels table created successfully");
    } else {
      console.log("author_levels table already exists");
    }
  } catch (error) {
    console.error("Error creating author_levels table:", error);
    throw error;
  }
}

/**
 * Create user experience table for tracking user experience gains
 */
async function createUserExperienceTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'user_experience'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating user_experience table...");
      
      await db.execute(sql`
        CREATE TABLE user_experience (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          action TEXT NOT NULL,
          amount INTEGER NOT NULL,
          metadata JSONB DEFAULT '{}',
          timestamp TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("user_experience table created successfully");
    } else {
      console.log("user_experience table already exists");
    }
  } catch (error) {
    console.error("Error creating user_experience table:", error);
    throw error;
  }
}

/**
 * Create author experience table for tracking author experience gains
 */
async function createAuthorExperienceTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'author_experience'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating author_experience table...");
      
      await db.execute(sql`
        CREATE TABLE author_experience (
          id SERIAL PRIMARY KEY,
          author_id INTEGER NOT NULL REFERENCES authors(id),
          action TEXT NOT NULL,
          amount INTEGER NOT NULL,
          metadata JSONB DEFAULT '{}',
          timestamp TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("author_experience table created successfully");
    } else {
      console.log("author_experience table already exists");
    }
  } catch (error) {
    console.error("Error creating author_experience table:", error);
    throw error;
  }
}

/**
 * Create badges table for storing badges that users and authors can earn
 */
async function createBadgesTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'badges'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating badges table...");
      
      await db.execute(sql`
        CREATE TABLE badges (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          icon_url TEXT NOT NULL,
          type TEXT NOT NULL,
          rarity TEXT NOT NULL,
          requirements JSONB DEFAULT '{}',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("badges table created successfully");
    } else {
      console.log("badges table already exists");
    }
  } catch (error) {
    console.error("Error creating badges table:", error);
    throw error;
  }
}

/**
 * Create user badges table for tracking which badges users have earned
 */
async function createUserBadgesTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'user_badges'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating user_badges table...");
      
      await db.execute(sql`
        CREATE TABLE user_badges (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          badge_id INTEGER NOT NULL REFERENCES badges(id),
          earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
          is_equipped BOOLEAN DEFAULT FALSE
        )
      `);
      
      console.log("user_badges table created successfully");
    } else {
      console.log("user_badges table already exists");
    }
  } catch (error) {
    console.error("Error creating user_badges table:", error);
    throw error;
  }
}

/**
 * Create author badges table for tracking which badges authors have earned
 */
async function createAuthorBadgesTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'author_badges'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating author_badges table...");
      
      await db.execute(sql`
        CREATE TABLE author_badges (
          id SERIAL PRIMARY KEY,
          author_id INTEGER NOT NULL REFERENCES authors(id),
          badge_id INTEGER NOT NULL REFERENCES badges(id),
          earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
          is_equipped BOOLEAN DEFAULT FALSE
        )
      `);
      
      console.log("author_badges table created successfully");
    } else {
      console.log("author_badges table already exists");
    }
  } catch (error) {
    console.error("Error creating author_badges table:", error);
    throw error;
  }
}

/**
 * Create titles table for storing titles that users and authors can earn
 */
async function createTitlesTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'titles'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating titles table...");
      
      await db.execute(sql`
        CREATE TABLE titles (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          requirements JSONB DEFAULT '{}',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("titles table created successfully");
    } else {
      console.log("titles table already exists");
    }
  } catch (error) {
    console.error("Error creating titles table:", error);
    throw error;
  }
}

/**
 * Create user titles table for tracking which titles users have earned
 */
async function createUserTitlesTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'user_titles'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating user_titles table...");
      
      await db.execute(sql`
        CREATE TABLE user_titles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          title_id INTEGER NOT NULL REFERENCES titles(id),
          earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
          is_equipped BOOLEAN DEFAULT FALSE
        )
      `);
      
      console.log("user_titles table created successfully");
    } else {
      console.log("user_titles table already exists");
    }
  } catch (error) {
    console.error("Error creating user_titles table:", error);
    throw error;
  }
}

/**
 * Create author titles table for tracking which titles authors have earned
 */
async function createAuthorTitlesTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'author_titles'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating author_titles table...");
      
      await db.execute(sql`
        CREATE TABLE author_titles (
          id SERIAL PRIMARY KEY,
          author_id INTEGER NOT NULL REFERENCES authors(id),
          title_id INTEGER NOT NULL REFERENCES titles(id),
          earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
          is_equipped BOOLEAN DEFAULT FALSE
        )
      `);
      
      console.log("author_titles table created successfully");
    } else {
      console.log("author_titles table already exists");
    }
  } catch (error) {
    console.error("Error creating author_titles table:", error);
    throw error;
  }
}

/**
 * Create user progression table for tracking current level and experience for users
 */
async function createUserProgressionTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'user_progression'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating user_progression table...");
      
      await db.execute(sql`
        CREATE TABLE user_progression (
          user_id INTEGER PRIMARY KEY REFERENCES users(id),
          current_experience INTEGER NOT NULL DEFAULT 0,
          current_level INTEGER NOT NULL DEFAULT 1 REFERENCES user_levels(level),
          active_title_id INTEGER REFERENCES titles(id),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("user_progression table created successfully");
    } else {
      console.log("user_progression table already exists");
    }
  } catch (error) {
    console.error("Error creating user_progression table:", error);
    throw error;
  }
}

/**
 * Create author progression table for tracking current level and experience for authors
 */
async function createAuthorProgressionTable() {
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'author_progression'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Creating author_progression table...");
      
      await db.execute(sql`
        CREATE TABLE author_progression (
          author_id INTEGER PRIMARY KEY REFERENCES authors(id),
          current_experience INTEGER NOT NULL DEFAULT 0,
          current_level INTEGER NOT NULL DEFAULT 1 REFERENCES author_levels(level),
          active_title_id INTEGER REFERENCES titles(id),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("author_progression table created successfully");
    } else {
      console.log("author_progression table already exists");
    }
  } catch (error) {
    console.error("Error creating author_progression table:", error);
    throw error;
  }
}

/**
 * Create initial user and author levels data
 */
async function seedLevelData() {
  try {
    // Check if level data already exists
    const userLevelCheck = await db.execute(sql`SELECT COUNT(*) FROM user_levels`);
    const authorLevelCheck = await db.execute(sql`SELECT COUNT(*) FROM author_levels`);
    
    // Seed user levels if no data exists
    if (parseInt(userLevelCheck.rows[0].count) === 0) {
      console.log("Seeding user levels data...");
      
      const userLevels = [
        { level: 1, experienceRequired: 0, title: "Novice Reader", benefits: {}, description: "Just starting your reading journey" },
        { level: 2, experienceRequired: 100, title: "Bookworm", benefits: {}, description: "Reading regularly" },
        { level: 3, experienceRequired: 300, title: "Book Enthusiast", benefits: {}, description: "Developing a taste for literature" },
        { level: 4, experienceRequired: 700, title: "Literature Lover", benefits: {}, description: "Becoming well-read" },
        { level: 5, experienceRequired: 1500, title: "Reading Veteran", benefits: {}, description: "A truly dedicated reader" },
        { level: 6, experienceRequired: 3000, title: "Literary Scholar", benefits: {}, description: "A scholar of written works" },
        { level: 7, experienceRequired: 6000, title: "Bibliophile", benefits: {}, description: "A true lover of books" },
        { level: 8, experienceRequired: 10000, title: "Literary Sage", benefits: {}, description: "Wise and experienced in literature" },
        { level: 9, experienceRequired: 15000, title: "Book Sage", benefits: {}, description: "At one with the literature" },
        { level: 10, experienceRequired: 25000, title: "Master Reader", benefits: {}, description: "Mastered the art of reading" }
      ];
      
      for (const level of userLevels) {
        await db.execute(sql`
          INSERT INTO user_levels (level, experience_required, title, benefits, description)
          VALUES (${level.level}, ${level.experienceRequired}, ${level.title}, ${JSON.stringify(level.benefits)}, ${level.description})
        `);
      }
      
      console.log("User levels data seeded successfully");
    }
    
    // Seed author levels if no data exists
    if (parseInt(authorLevelCheck.rows[0].count) === 0) {
      console.log("Seeding author levels data...");
      
      const authorLevels = [
        { level: 1, experienceRequired: 0, title: "Aspiring Author", benefits: {}, description: "Just starting your authoring journey" },
        { level: 2, experienceRequired: 150, title: "Emerging Writer", benefits: {}, description: "Making your first marks as an author" },
        { level: 3, experienceRequired: 450, title: "Skilled Wordsmith", benefits: {}, description: "Developing your craft" },
        { level: 4, experienceRequired: 1000, title: "Accomplished Writer", benefits: {}, description: "Growing your readership" },
        { level: 5, experienceRequired: 2000, title: "Seasoned Author", benefits: {}, description: "A respected voice in literature" },
        { level: 6, experienceRequired: 4000, title: "Writing Virtuoso", benefits: {}, description: "Mastering the craft of writing" },
        { level: 7, experienceRequired: 8000, title: "Literary Artist", benefits: {}, description: "Creating true art with words" },
        { level: 8, experienceRequired: 15000, title: "Author of Note", benefits: {}, description: "Widely recognized for your work" },
        { level: 9, experienceRequired: 25000, title: "Distinguished Author", benefits: {}, description: "A distinguished contributor to literature" },
        { level: 10, experienceRequired: 40000, title: "Literary Legend", benefits: {}, description: "Your work stands the test of time" }
      ];
      
      for (const level of authorLevels) {
        await db.execute(sql`
          INSERT INTO author_levels (level, experience_required, title, benefits, description)
          VALUES (${level.level}, ${level.experienceRequired}, ${level.title}, ${JSON.stringify(level.benefits)}, ${level.description})
        `);
      }
      
      console.log("Author levels data seeded successfully");
    }
  } catch (error) {
    console.error("Error seeding level data:", error);
    throw error;
  }
}

/**
 * Create initial badges data
 */
async function seedBadgeData() {
  try {
    // Check if badge data already exists
    const badgeCheck = await db.execute(sql`SELECT COUNT(*) FROM badges`);
    
    // Seed badges if no data exists
    if (parseInt(badgeCheck.rows[0].count) === 0) {
      console.log("Seeding badges data...");
      
      const badges = [
        // User badges
        { 
          name: "First Rating", 
          description: "Left your first book rating", 
          iconUrl: "/badges/first-rating.svg", 
          type: "user", 
          rarity: "common",
          requirements: { action: "leave_rating", count: 1 }
        },
        { 
          name: "Reviewer", 
          description: "Left 10 detailed book reviews", 
          iconUrl: "/badges/reviewer.svg", 
          type: "user", 
          rarity: "rare",
          requirements: { action: "leave_review", count: 10 }
        },
        { 
          name: "Bookshelf Creator", 
          description: "Created your first bookshelf", 
          iconUrl: "/badges/bookshelf-creator.svg", 
          type: "user", 
          rarity: "common",
          requirements: { action: "create_bookshelf", count: 1 }
        },
        { 
          name: "Follower", 
          description: "Followed 5 authors", 
          iconUrl: "/badges/follower.svg", 
          type: "user", 
          rarity: "common",
          requirements: { action: "follow_author", count: 5 }
        },
        
        // Author badges
        { 
          name: "First Book", 
          description: "Published your first book", 
          iconUrl: "/badges/first-book.svg", 
          type: "author", 
          rarity: "common",
          requirements: { action: "publish_book", count: 1 }
        },
        { 
          name: "Reviewed Author", 
          description: "Received 10 reviews on your books", 
          iconUrl: "/badges/reviewed-author.svg", 
          type: "author", 
          rarity: "rare",
          requirements: { action: "receive_review", count: 10 }
        },
        { 
          name: "Author Bash Participant", 
          description: "Participated in Author Bash", 
          iconUrl: "/badges/author-bash.svg", 
          type: "author", 
          rarity: "common",
          requirements: { action: "author_bash_submission", count: 1 }
        },
        { 
          name: "Popular Author", 
          description: "Gained 20 followers", 
          iconUrl: "/badges/popular-author.svg", 
          type: "author", 
          rarity: "epic",
          requirements: { action: "gain_follower", count: 20 }
        }
      ];
      
      for (const badge of badges) {
        await db.execute(sql`
          INSERT INTO badges (name, description, icon_url, type, rarity, requirements)
          VALUES (${badge.name}, ${badge.description}, ${badge.iconUrl}, ${badge.type}, ${badge.rarity}, ${JSON.stringify(badge.requirements)})
        `);
      }
      
      console.log("Badges data seeded successfully");
    }
  } catch (error) {
    console.error("Error seeding badge data:", error);
    throw error;
  }
}

/**
 * Create initial titles data
 */
async function seedTitleData() {
  try {
    // Check if title data already exists
    const titleCheck = await db.execute(sql`SELECT COUNT(*) FROM titles`);
    
    // Seed titles if no data exists
    if (parseInt(titleCheck.rows[0].count) === 0) {
      console.log("Seeding titles data...");
      
      const titles = [
        // User titles
        { 
          name: "Avid Reader", 
          description: "Read 10 books to completion", 
          type: "user",
          requirements: { action: "book_completed", count: 10 }
        },
        { 
          name: "Literary Critic", 
          description: "Left 20 reviews", 
          type: "user",
          requirements: { action: "leave_review", count: 20 }
        },
        { 
          name: "Curator", 
          description: "Created 5 bookshelves with at least 5 books each", 
          type: "user",
          requirements: { action: "create_bookshelf", count: 5, minBooks: 5 }
        },
        
        // Author titles
        { 
          name: "Published Author", 
          description: "Published at least one book", 
          type: "author",
          requirements: { action: "publish_book", count: 1 }
        },
        { 
          name: "Acclaimed Writer", 
          description: "Received an average rating of 4.5+ on at least 3 books", 
          type: "author",
          requirements: { action: "receive_rating", minRating: 4.5, bookCount: 3 }
        },
        { 
          name: "Fan Favorite", 
          description: "Gained 50 followers", 
          type: "author",
          requirements: { action: "gain_follower", count: 50 }
        }
      ];
      
      for (const title of titles) {
        await db.execute(sql`
          INSERT INTO titles (name, description, type, requirements)
          VALUES (${title.name}, ${title.description}, ${title.type}, ${JSON.stringify(title.requirements)})
        `);
      }
      
      console.log("Titles data seeded successfully");
    }
  } catch (error) {
    console.error("Error seeding title data:", error);
    throw error;
  }
}

/**
 * Create indexes to optimize querying
 */
async function createLevelingIndexes() {
  try {
    console.log("Creating indexes on leveling system tables...");

    // Indexes for user_experience table
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_experience_user_id ON user_experience(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_experience_action ON user_experience(action)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_experience_timestamp ON user_experience(timestamp)`);
    
    // Indexes for author_experience table
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_author_experience_author_id ON author_experience(author_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_author_experience_action ON author_experience(action)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_author_experience_timestamp ON author_experience(timestamp)`);
    
    // Indexes for badge tables
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_badges_type ON badges(type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_author_badges_author_id ON author_badges(author_id)`);
    
    // Indexes for title tables
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_titles_type ON titles(type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_titles_user_id ON user_titles(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_author_titles_author_id ON author_titles(author_id)`);
    
    console.log("Leveling system indexes created successfully");
  } catch (error) {
    console.error("Error creating leveling system indexes:", error);
    throw error;
  }
}

/**
 * Run all leveling system migrations
 */
export async function runLevelingMigrations() {
  console.log("Running leveling system migrations...");
  
  try {
    // Create tables in dependency order
    await createUserLevelsTable();
    await createAuthorLevelsTable();
    await createUserExperienceTable();
    await createAuthorExperienceTable();
    await createBadgesTable();
    await createTitlesTable();
    await createUserBadgesTable();
    await createAuthorBadgesTable();
    await createUserTitlesTable();
    await createAuthorTitlesTable();
    await createUserProgressionTable();
    await createAuthorProgressionTable();
    
    // Seed initial data
    await seedLevelData();
    await seedBadgeData();
    await seedTitleData();
    
    // Create indexes for optimization
    await createLevelingIndexes();
    
    console.log("Leveling system migrations completed successfully");
  } catch (error) {
    console.error("Error running leveling system migrations:", error);
    throw error;
  }
}