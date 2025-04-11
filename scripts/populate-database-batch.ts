/**
 * Batch Database Population Script
 * 
 * This script populates the database with sample data in smaller batches
 */

import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { hash } from "bcrypt";

// Image paths for books and profiles
const PROFILE_IMAGE_PATH = "/images/test-images/profile-test.jpg";
const BOOK_IMAGE_PATHS = {
  "book-detail": "/images/test-images/book-detail.png",
  "background": "/images/test-images/background.png",
  "book-card": "/images/test-images/book-card.png",
  "grid-item": "/images/test-images/grid-item.png",
  "mini": "/images/test-images/mini.png",
  "hero": "/images/test-images/hero.png"
};

// Main function to populate database in batches
async function populateDatabaseInBatches() {
  try {
    console.log("Clearing existing data...");
    await clearDatabase();
    
    console.log("Creating genres and taxonomies...");
    const genreIds = await createGenreTaxonomies();
    
    console.log("Creating users and authors...");
    const { userIds, authorIds } = await createUsersAndAuthors();
    
    console.log("Creating books...");
    const bookIds = await createBooks(authorIds, genreIds);
    
    console.log("Creating followers...");
    await createFollowers(userIds, authorIds);
    
    console.log("Creating reading statuses...");
    await createReadingStatuses(userIds, bookIds);
    
    console.log("Creating ratings and reviews...");
    await createRatingsAndReviews(userIds, bookIds);
    
    console.log("Database population completed successfully!");
    console.log(`Created ${userIds.length} users (including ${authorIds.length} authors)`);
    console.log(`Created ${bookIds.length} books`);
    console.log("Added various genres, followers, reading statuses, and reviews");
    
  } catch (error) {
    console.error("Error populating database:", error);
    throw error;
  }
}

// Helper function to clear database
async function clearDatabase() {
  // Check if database already has data
  const userCount = await db.select({ count: sql`count(*)` }).from(sql`users`);
  if (parseInt(userCount[0].count.toString()) > 0) {
    console.log("Database has existing data. Clearing...");
    
    // Clear existing data
    await db.execute(sql`TRUNCATE 
      view_genres, 
      user_genre_views, 
      book_genre_taxonomies, 
      book_images, 
      rating_preferences, 
      ratings, 
      reading_status, 
      followers, 
      books, 
      users, 
      genre_taxonomies
    CASCADE`);
  }
}

// Helper function to create genre taxonomies
async function createGenreTaxonomies() {
  const genreIds = [];
  const subgenreIds = [];
  const themeIds = [];
  const tropeIds = [];
  
  // Add main genres
  const genres = [
    "Fantasy", "Science Fiction", "Mystery", "Thriller", "Romance", 
    "Historical Fiction", "Literary Fiction", "Horror"
  ];
  
  for (const genre of genres.slice(0, 4)) {
    const result = await db.execute(sql`
      INSERT INTO genre_taxonomies 
      (name, description, type, parent_id)
      VALUES
      (${genre}, ${`Books in the ${genre} genre`}, 'genre', NULL)
      RETURNING id
    `);
    genreIds.push(result.rows[0].id);
  }
  
  // Add subgenres
  const subgenres = [
    ["Epic Fantasy", "Space Opera", "Cyberpunk"],
    ["Hard Science Fiction", "Cozy Mystery", "Police Procedural"],
    ["Psychological Thriller", "Contemporary Romance", "Paranormal Romance"],
    ["Regency Romance", "Gothic Horror", "Supernatural Horror"]
  ];
  
  for (let i = 0; i < genreIds.length; i++) {
    for (const subgenre of subgenres[i]) {
      const result = await db.execute(sql`
        INSERT INTO genre_taxonomies 
        (name, description, type, parent_id)
        VALUES
        (${subgenre}, ${`Books in the ${subgenre} subgenre`}, 'subgenre', ${genreIds[i]})
        RETURNING id
      `);
      subgenreIds.push(result.rows[0].id);
    }
  }
  
  // Add themes
  const themes = [
    "Redemption", "Coming of Age", "Power of Love", "Good vs Evil", "Identity", 
    "Survival", "Justice", "Betrayal"
  ];
  
  for (const theme of themes.slice(0, 4)) {
    const result = await db.execute(sql`
      INSERT INTO genre_taxonomies 
      (name, description, type, parent_id)
      VALUES
      (${theme}, ${`Books with the ${theme} theme`}, 'theme', NULL)
      RETURNING id
    `);
    themeIds.push(result.rows[0].id);
  }
  
  // Add tropes
  const tropes = [
    "Chosen One", "Love Triangle", "Friends to Lovers", "Enemies to Lovers", 
    "Unlikely Hero", "Fish Out of Water", "Rags to Riches", "Secret Identity"
  ];
  
  for (const trope of tropes.slice(0, 4)) {
    const result = await db.execute(sql`
      INSERT INTO genre_taxonomies 
      (name, description, type, parent_id)
      VALUES
      (${trope}, ${`Books featuring the ${trope} trope`}, 'trope', NULL)
      RETURNING id
    `);
    tropeIds.push(result.rows[0].id);
  }
  
  return { genreIds, subgenreIds, themeIds, tropeIds };
}

// Helper function to create users and authors
async function createUsersAndAuthors() {
  const userIds = [];
  const authorIds = [];
  
  // Names for sample users
  const firstNames = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", 
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan"
  ];
  
  const lastNames = [
    "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", 
    "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White"
  ];
  
  // Hash a common password for all test users
  const commonPassword = await hash("password123", 10);
  
  // Create 10 users (3 of which are authors)
  for (let i = 0; i < 10; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const isAuthor = i < 3;
    
    // Prepare user data
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;
    const displayName = `${firstName} ${lastName}`;
    const authorName = isAuthor ? `${firstName} ${lastName}` : null;
    const authorBio = isAuthor ? `${firstName} ${lastName} is an author who specializes in fantasy and science fiction.` : null;
    const bio = Math.random() > 0.5 ? `Reader and fan of science fiction books.` : null;
    const authorImageUrl = isAuthor ? PROFILE_IMAGE_PATH : null;
    const profileImageUrl = Math.random() > 0.7 ? PROFILE_IMAGE_PATH : null;
    const newsletterOptIn = Math.random() > 0.5;
    const isPro = isAuthor || Math.random() > 0.8;
    const proExpiresAt = isAuthor ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;
    const socialMediaLinks = isAuthor ? JSON.stringify([
      { platform: "twitter", url: "https://twitter.com/user" },
      { platform: "website", url: "https://example.com" }
    ]) : "[]";
    const credits = isAuthor ? Math.floor(Math.random() * 900) + 100 : Math.floor(Math.random() * 50);
    
    // Create user
    const result = await db.execute(sql`
      INSERT INTO users 
      (email, username, password, newsletter_opt_in, is_author, is_pro, pro_expires_at, 
       author_name, author_bio, author_image_url, profile_image_url, bio, display_name, 
       social_media_links, credits, has_completed_onboarding)
      VALUES 
      (${email}, ${username}, ${commonPassword}, ${newsletterOptIn}, ${isAuthor}, ${isPro}, ${proExpiresAt},
       ${authorName}, ${authorBio}, ${authorImageUrl}, ${profileImageUrl}, ${bio}, ${displayName},
       ${socialMediaLinks}, ${credits}, true)
      RETURNING id
    `);
    
    const userId = result.rows[0].id;
    userIds.push(userId);
    if (isAuthor) authorIds.push(userId);
    
    // Create rating preferences for this user
    const themes = (Math.random() * 0.3 + 0.05).toFixed(2);
    const worldbuilding = (Math.random() * 0.3 + 0.05).toFixed(2);
    const writing = (Math.random() * 0.3 + 0.05).toFixed(2);
    const enjoyment = (Math.random() * 0.3 + 0.05).toFixed(2);
    const characters = (Math.random() * 0.3 + 0.05).toFixed(2);
    
    await db.execute(sql`
      INSERT INTO rating_preferences 
      (user_id, themes, worldbuilding, writing, enjoyment, characters)
      VALUES 
      (${userId}, ${themes}, ${worldbuilding}, ${writing}, ${enjoyment}, ${characters})
    `);
    
    // Create genre views for some users
    if (Math.random() > 0.7) {
      const viewName = "Favorites";
      
      const viewResult = await db.execute(sql`
        INSERT INTO user_genre_views
        (user_id, name, rank, is_default)
        VALUES
        (${userId}, ${viewName}, 1, true)
        RETURNING id
      `);
      
      const viewId = viewResult.rows[0].id;
      
      // Add 2-3 genres to this view
      const genreCount = Math.floor(Math.random() * 2) + 2;
      for (let j = 0; j < genreCount; j++) {
        await db.execute(sql`
          INSERT INTO view_genres
          (view_id, taxonomy_id, type, rank)
          VALUES
          (${viewId}, ${j + 1}, 'genre', ${j + 1})
        `);
      }
    }
  }
  
  return { userIds, authorIds };
}

// Helper function to create books
async function createBooks(authorIds: number[], genreTaxonomies: any) {
  const bookIds = [];
  const { genreIds, subgenreIds, themeIds, tropeIds } = genreTaxonomies;
  
  // Book titles for sample data
  const bookTitles = [
    "The Shadow in the Mirror", "Lost Empire", "Forgotten Dreams",
    "The Ancient Prophecy", "Eternal Night", "Sacred Mountain",
    "Dark Forest", "Bright Future", "Silent Whisper", "Whispered Secret",
    "Broken Promises", "Shattered Glass", "Mended Heart", "Cursed Legacy"
  ];
  
  // Create 2 books for each author
  for (const authorId of authorIds) {
    // Get author information
    const authorResult = await db.execute(sql`
      SELECT author_name, author_image_url FROM users WHERE id = ${authorId}
    `);
    const authorData = authorResult.rows[0];
    
    // Create 2 books per author
    for (let i = 0; i < 2; i++) {
      const title = bookTitles[bookIds.length];
      const description = `This is a description for ${title}. The book explores themes of adventure and discovery in a fantastical world.`;
      
      // Prepare book data - using PostgreSQL array format
      const formats = "{\"Hardback\",\"Paperback\",\"eBook\"}"; // PostgreSQL array literal format
      const publishedDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 2) * 24 * 60 * 60 * 1000);
      const awards = Math.random() > 0.7 ? "{\"Fantasy Book Award 2024\",\"Reader's Choice Award\"}" : null; // PostgreSQL array literal format
      const originalTitle = Math.random() > 0.9 ? `The Original ${title}` : null;
      const series = Math.random() > 0.7 ? "The Epic Fantasy Series" : null;
      const setting = "Mythical Kingdom";
      const characters = "{\"Hero Protagonist\",\"Wise Mentor\",\"Evil Antagonist\"}"; // PostgreSQL array literal format
      const isbn = `978-${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      const asin = `B${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const language = "English";
      // For JSON data we still use JSON.stringify
      const referralLinks = JSON.stringify([
        { url: "https://amazon.com/dp/B123456789", retailer: "Amazon" },
        { url: "https://barnesnobles.com", retailer: "Barnes & Noble" }
      ]);
      const impressionCount = Math.floor(Math.random() * 950) + 50;
      const clickThroughCount = Math.floor(Math.random() * 195) + 5;
      const lastImpressionAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
      const lastClickThroughAt = new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000);
      const internal_details = "Generated book";
      const isPromoted = Math.random() > 0.8;
      const pageCount = Math.floor(Math.random() * 650) + 150;
      
      // Insert book
      const bookResult = await db.execute(sql`
        INSERT INTO books 
        (title, author, author_id, description, author_image_url, promoted, page_count, 
        formats, published_date, awards, original_title, series, setting, characters, 
        isbn, asin, language, referral_links, impression_count, click_through_count, 
        last_impression_at, last_click_through_at, internal_details)
        VALUES 
        (${title}, ${authorData.author_name}, ${authorId}, ${description}, ${authorData.author_image_url}, 
        ${isPromoted}, ${pageCount}, ${formats}, ${publishedDate}, ${awards}, ${originalTitle}, 
        ${series}, ${setting}, ${characters}, ${isbn}, ${asin}, ${language}, ${referralLinks}, 
        ${impressionCount}, ${clickThroughCount}, ${lastImpressionAt}, ${lastClickThroughAt}, 
        ${internal_details})
        RETURNING id
      `);
      
      const bookId = bookResult.rows[0].id;
      bookIds.push(bookId);
      
      // Add images for this book
      const imageTypes = ["book-detail", "background", "book-card", "grid-item", "mini", "hero"];
      
      for (const imageType of imageTypes) {
        const width = imageType === "background" ? 1300 : imageType === "hero" ? 1500 : imageType === "book-detail" ? 480 : imageType === "book-card" ? 256 : imageType === "grid-item" ? 56 : 48;
        const height = imageType === "background" ? 1500 : imageType === "hero" ? 600 : imageType === "book-detail" ? 600 : imageType === "book-card" ? 440 : imageType === "grid-item" ? 212 : 64;
        const sizeKb = Math.floor(Math.random() * 90) + 10;
        
        await db.execute(sql`
          INSERT INTO book_images
          (book_id, image_url, image_type, width, height, size_kb)
          VALUES
          (${bookId}, ${BOOK_IMAGE_PATHS[imageType as keyof typeof BOOK_IMAGE_PATHS]}, ${imageType}, ${width}, ${height}, ${sizeKb})
        `);
      }
      
      // Add genres, subgenres, themes, and tropes to this book
      const selectedGenreIds = genreIds.slice(0, Math.floor(Math.random() * 2) + 1);
      const selectedSubgenreIds = subgenreIds.slice(0, Math.floor(Math.random() * 2) + 1);
      const selectedThemeIds = themeIds.slice(0, Math.floor(Math.random() * 2) + 1);
      const selectedTropeIds = tropeIds.slice(0, Math.floor(Math.random() * 2) + 1);
      
      let rank = 1;
      
      // Add genres
      for (const genreId of selectedGenreIds) {
        const importance = 1 / (1 + Math.log(rank));
        
        await db.execute(sql`
          INSERT INTO book_genre_taxonomies 
          (book_id, taxonomy_id, rank, importance)
          VALUES 
          (${bookId}, ${genreId}, ${rank}, ${importance})
        `);
        rank++;
      }
      
      // Add subgenres
      for (const subgenreId of selectedSubgenreIds) {
        const importance = 1 / (1 + Math.log(rank));
        
        await db.execute(sql`
          INSERT INTO book_genre_taxonomies 
          (book_id, taxonomy_id, rank, importance)
          VALUES 
          (${bookId}, ${subgenreId}, ${rank}, ${importance})
        `);
        rank++;
      }
      
      // Add themes
      for (const themeId of selectedThemeIds) {
        const importance = 1 / (1 + Math.log(rank));
        
        await db.execute(sql`
          INSERT INTO book_genre_taxonomies 
          (book_id, taxonomy_id, rank, importance)
          VALUES 
          (${bookId}, ${themeId}, ${rank}, ${importance})
        `);
        rank++;
      }
      
      // Add tropes
      for (const tropeId of selectedTropeIds) {
        const importance = 1 / (1 + Math.log(rank));
        
        await db.execute(sql`
          INSERT INTO book_genre_taxonomies 
          (book_id, taxonomy_id, rank, importance)
          VALUES 
          (${bookId}, ${tropeId}, ${rank}, ${importance})
        `);
        rank++;
      }
    }
  }
  
  return bookIds;
}

// Helper function to create followers
async function createFollowers(userIds: number[], authorIds: number[]) {
  // Each non-author user follows 1-2 authors
  for (const userId of userIds) {
    if (authorIds.includes(userId)) continue; // Authors don't follow
    
    // Determine how many authors to follow (1-2)
    const numAuthorsToFollow = Math.floor(Math.random() * 2) + 1;
    
    // Copy and shuffle the authors array
    const shuffledAuthors = [...authorIds].sort(() => 0.5 - Math.random());
    
    // Follow the first numAuthorsToFollow authors
    for (let i = 0; i < numAuthorsToFollow; i++) {
      const authorId = shuffledAuthors[i];
      
      // Insert follower relationship
      await db.execute(sql`
        INSERT INTO followers
        (follower_id, following_id)
        VALUES
        (${userId}, ${authorId})
      `);
    }
  }
}

// Helper function to create reading statuses
async function createReadingStatuses(userIds: number[], bookIds: number[]) {
  // Each user has reading status for 2-3 books
  for (const userId of userIds) {
    // Determine how many books to add (2-3)
    const numBooksToAdd = Math.floor(Math.random() * 2) + 2;
    
    // Copy and shuffle the books array
    const shuffledBooks = [...bookIds].sort(() => 0.5 - Math.random());
    
    // Add reading status for the first numBooksToAdd books
    for (let i = 0; i < numBooksToAdd; i++) {
      const bookId = shuffledBooks[i];
      
      const isWishlisted = Math.random() > 0.5;
      const isCompleted = Math.random() > 0.5;
      const completedAt = isCompleted ? new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000) : null;
      
      // Insert reading status
      await db.execute(sql`
        INSERT INTO reading_status
        (user_id, book_id, is_wishlisted, is_completed, completed_at)
        VALUES
        (${userId}, ${bookId}, ${isWishlisted}, ${isCompleted}, ${completedAt})
      `);
    }
  }
}

// Helper function to create ratings and reviews
async function createRatingsAndReviews(userIds: number[], bookIds: number[]) {
  // Sample review templates
  const reviewTemplates = [
    "I absolutely loved this book! The characters were well-developed and the plot was engaging. Highly recommended!",
    "This was an interesting read. The world-building was impressive, though the pacing could have been better.",
    "I had mixed feelings about this one. The concept was fascinating but the execution was somewhat lacking.",
    "This book exceeded my expectations. The writing style was beautiful and the story was captivating from start to finish.",
    "A solid addition to the genre. The author knows how to create tension and deliver a satisfying conclusion."
  ];
  
  // Each book gets 1-2 ratings
  for (const bookId of bookIds) {
    // Determine how many users rate this book (1-2)
    const numRaters = Math.floor(Math.random() * 2) + 1;
    
    // Copy and shuffle the users array
    const shuffledUsers = [...userIds].sort(() => 0.5 - Math.random());
    
    // Add ratings from the first numRaters users
    for (let i = 0; i < numRaters; i++) {
      const userId = shuffledUsers[i];
      
      // Check if user already has a rating for this book
      const checkResult = await db.execute(sql`
        SELECT id FROM ratings WHERE user_id = ${userId} AND book_id = ${bookId}
      `);
      
      if (checkResult.rows.length === 0) {
        // Generate rating values (5-10 range, biased toward higher ratings)
        const enjoyment = Math.floor(Math.random() * 6) + 5;
        const writing = Math.floor(Math.random() * 6) + 5;
        const themes = Math.floor(Math.random() * 6) + 5;
        const characters = Math.floor(Math.random() * 6) + 5;
        const worldbuilding = Math.floor(Math.random() * 6) + 5;
        
        // Has a text review?
        const hasReview = Math.random() > 0.3;
        const review = hasReview ? reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)] : null;
        
        // Generate analysis for reviews
        const analysis = hasReview ? JSON.stringify({
          sentiment: {
            label: "POSITIVE",
            score: (Math.random() * 0.5 + 0.5).toFixed(2)
          },
          themes: [
            {
              label: "Storytelling",
              score: (Math.random() * 0.6 + 0.4).toFixed(2)
            }
          ]
        }) : null;
        
        // Featured?
        const featured = Math.random() > 0.8;
        
        // Insert rating
        await db.execute(sql`
          INSERT INTO ratings 
          (user_id, book_id, enjoyment, writing, themes, characters, worldbuilding, review, analysis, featured, report_status, report_reason)
          VALUES 
          (${userId}, ${bookId}, ${enjoyment}, ${writing}, ${themes}, ${characters}, ${worldbuilding}, 
          ${review}, ${analysis}, ${featured}, 'none', NULL)
        `);
        
        // Make sure user has a reading status entry for this book
        const statusCheck = await db.execute(sql`
          SELECT id FROM reading_status WHERE user_id = ${userId} AND book_id = ${bookId}
        `);
        
        if (statusCheck.rows.length === 0) {
          // Create reading status
          await db.execute(sql`
            INSERT INTO reading_status
            (user_id, book_id, is_wishlisted, is_completed, completed_at)
            VALUES
            (${userId}, ${bookId}, false, true, ${new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)})
          `);
        } else if (!statusCheck.rows[0].is_completed) {
          // Update to completed
          await db.execute(sql`
            UPDATE reading_status
            SET is_completed = true, completed_at = ${new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)}
            WHERE id = ${statusCheck.rows[0].id}
          `);
        }
      }
    }
  }
}

// Execute the population function
populateDatabaseInBatches().catch(error => {
  console.error("Failed to populate database:", error);
  process.exit(1);
});