import { db } from "../server/db";
import { users, ratings, books } from "../shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { hash } from "bcryptjs";

/**
 * This script creates 100 dummy users with specific rating distributions:
 * - 100% positive enjoyment ratings (1)
 * - 100% negative writing ratings (-1)
 * - 5% positive, 5% negative on themes (90% neutral)
 * - 65% positive, 35% negative on characters
 * - 40% positive, 60% negative on worldbuilding
 * 
 * This is for the book "Valkyrie X Truck" (ID: 51)
 */
async function main() {
  try {
    console.log("Starting to create dummy users and ratings with specific distributions...");
    
    // Book ID for "Valkyrie X Truck"
    const BOOK_ID = 51;
    
    // Check if the book exists
    const bookCheck = await db.query.books.findFirst({
      where: eq(books.id, BOOK_ID)
    });
    
    if (!bookCheck) {
      console.error(`Book with ID ${BOOK_ID} not found.`);
      return;
    }
    
    console.log(`Found book: "${bookCheck.title}"`);
    
    // Functions for generating specific distributions
    function getEnjoymentRating(): number {
      return 1; // 100% positive
    }
    
    function getWritingRating(): number {
      return -1; // 100% negative
    }
    
    function getThemesRating(): number {
      const rand = Math.random();
      if (rand < 0.05) return 1;  // 5% positive
      if (rand < 0.10) return -1; // 5% negative
      return 0;                   // 90% neutral
    }
    
    function getCharactersRating(): number {
      const rand = Math.random();
      if (rand < 0.65) return 1;  // 65% positive
      return -1;                  // 35% negative
    }
    
    function getWorldbuildingRating(): number {
      const rand = Math.random();
      if (rand < 0.40) return 1;  // 40% positive
      return -1;                  // 60% negative
    }
    
    function getReview(username: string, ratings: any): string | null {
      // Generate a review for every 5th user
      if (Math.random() < 0.2) {
        // Create a more detailed review based on the ratings
        const enjoymentText = ratings.enjoyment === 1 ? 
          "I really enjoyed this book! The story kept me engaged throughout." : 
          "I didn't enjoy this book much.";
        
        const writingText = "However, the writing style was quite weak and made it hard to follow at times.";
        
        const charactersText = ratings.characters === 1 ? 
          "The characters were well-developed and relatable." : 
          "The characters felt flat and one-dimensional.";
        
        const worldbuildingText = ratings.worldbuilding === 1 ? 
          "The world-building was quite impressive." : 
          "The world-building lacked depth and consistency.";
        
        const themesText = ratings.themes === 1 ? 
          "The themes were thought-provoking." : 
          ratings.themes === -1 ? "The themes were poorly executed." : "";
        
        return `${enjoymentText} ${writingText} ${charactersText} ${worldbuildingText} ${themesText} - Review by ${username}`;
      }
      
      return null;
    }
    
    // Process users in smaller batches to avoid timeouts
    const BATCH_SIZE = 25;
    const MAX_USERS = 100;
    
    // Calculate the starting index based on command line args if provided
    // This allows running the script multiple times with different batches
    const startArg = process.argv[2] ? parseInt(process.argv[2]) : 1;
    const startIndex = startArg || 1;
    const endIndex = Math.min(startIndex + BATCH_SIZE - 1, MAX_USERS);
    
    console.log(`Processing batch from user ${startIndex} to ${endIndex}`);
    
    for (let i = startIndex; i <= endIndex; i++) {
      const email = `private.testdist${i}@sirened.com`;
      const username = `testdist${i}.sirened`;
      const displayName = `Test Dist ${i}`;
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      let userId: number;
      
      if (existingUser) {
        console.log(`User ${email} already exists, using existing user (ID: ${existingUser.id})`);
        userId = existingUser.id;
      } else {
        // Create new user
        console.log(`Creating user ${i}: ${email}`);
        
        // Hash password - using 'testpassword' for all dummy users
        const passwordHash = await hash('testpassword', 10);
        
        // Use raw SQL with sql tagged template
        const result = await db.execute(
          sql`INSERT INTO users (email, username, display_name, password)
              VALUES (${email}, ${username}, ${displayName}, ${passwordHash})
              RETURNING id`
        );
        
        userId = Number(result.rows[0].id);
        console.log(`Created user with ID: ${userId}`);
      }
      
      // Check if rating already exists using direct SQL to ensure accuracy
      const checkRatingResult = await db.execute(
        sql`SELECT id FROM ratings WHERE user_id = ${userId} AND book_id = ${BOOK_ID}`
      );
      
      // Generate ratings with specific distributions
      const ratingValues = {
        enjoyment: getEnjoymentRating(),
        writing: getWritingRating(),
        themes: getThemesRating(),
        characters: getCharactersRating(),
        worldbuilding: getWorldbuildingRating()
      };
      
      const review = getReview(username, ratingValues);
      
      if (checkRatingResult && checkRatingResult.rowCount && checkRatingResult.rowCount > 0) {
        const ratingId = checkRatingResult.rows[0].id;
        console.log(`Rating for user ${userId} on book ${BOOK_ID} already exists (ID: ${ratingId}), updating it`);
        
        // Update existing rating with new values
        await db.execute(
          sql`UPDATE ratings 
              SET enjoyment = ${ratingValues.enjoyment}, 
                  writing = ${ratingValues.writing}, 
                  themes = ${ratingValues.themes}, 
                  characters = ${ratingValues.characters}, 
                  worldbuilding = ${ratingValues.worldbuilding},
                  review = ${review}
              WHERE id = ${ratingId}`
        );
        
        console.log(`Updated rating ${ratingId} for user ${userId}: ${JSON.stringify(ratingValues)}`);
      } else {
        // Create new rating
        const ratingResult = await db.execute(
          sql`INSERT INTO ratings (user_id, book_id, enjoyment, writing, themes, characters, worldbuilding, review)
              VALUES (${userId}, ${BOOK_ID}, ${ratingValues.enjoyment}, ${ratingValues.writing}, 
                      ${ratingValues.themes}, ${ratingValues.characters}, ${ratingValues.worldbuilding}, ${review})
              RETURNING id`
        );
        
        const ratingId = Number(ratingResult.rows[0].id);
        console.log(`Created NEW rating ${ratingId} for user ${userId}: ${JSON.stringify(ratingValues)}`);
      }
    }
    
    console.log("Finished creating dummy users and ratings with specific distributions!");
  } catch (error) {
    console.error("Error creating dummy users and ratings:", error);
  } finally {
    console.log("Script execution completed.");
  }
}

main();