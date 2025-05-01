import { db } from "../server/db";
import { users, ratings, books } from "../shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { hash } from "bcryptjs";

/**
 * This script creates 50 dummy users with negative skewed ratings for the book
 * "Valkyrie X Truck" (ID: 51)
 */
async function main() {
  try {
    console.log("Starting to create dummy users with negative ratings...");
    
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
    
    // Generate a negatively skewed rating value of -1, 0, or 1
    function getNegativeRating(): number {
      // Generate random value with heavy negative bias:
      // 70% chance of -1 (thumbs down)
      // 20% chance of 0 (neutral)
      // 10% chance of 1 (thumbs up)
      const rand = Math.random();
      if (rand < 0.7) return -1;  // 70% chance of thumbs down
      if (rand < 0.9) return 0;   // 20% chance of neutral
      return 1;                    // 10% chance of thumbs up
    }
    
    // Generate negative review texts
    function getNegativeReview(username: string): string {
      const negativeReviews = [
        `Disappointing story with flat characters and predictable plot.`,
        `The writing feels amateur and rushed. Not worth the time.`,
        `Couldn't connect with any of the characters. Very frustrating read.`,
        `The worldbuilding makes no sense and the pacing is terrible.`,
        `I expected so much more from this book. It falls flat on every level.`,
        `The themes are poorly executed and the story lacks depth.`,
        `Character motivations are inconsistent throughout the book.`,
        `Couldn't finish this book, the writing style was too difficult to get through.`,
        `The plot holes ruined any enjoyment I might have had.`,
        `Weak dialogue and underdeveloped characters make this a skip.`
      ];
      
      // Return a random negative review + username for traceability
      return `${negativeReviews[Math.floor(Math.random() * negativeReviews.length)]} - ${username}`;
    }
    
    // Create 50 dummy users and ratings with negative skew
    const MAX_USERS = 50;
    const startingUserNumber = 200; // Start at a higher number to avoid conflicts
    
    for (let i = startingUserNumber; i < startingUserNumber + MAX_USERS; i++) {
      const email = `private.test${i}@sirened.com`;
      const username = `test${i}.sirened`;
      const displayName = `Test ${i} Sirened`;
      
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
      
      // Generate negatively skewed ratings
      const enjoyment = getNegativeRating();
      const writing = getNegativeRating();
      const themes = getNegativeRating();
      const characters = getNegativeRating();
      const worldbuilding = getNegativeRating();
      
      // Every other user gets a negative review
      const review = i % 2 === 0 ? getNegativeReview(username) : null;
      
      if (checkRatingResult.rowCount > 0) {
        const ratingId = checkRatingResult.rows[0].id;
        console.log(`Rating for user ${userId} on book ${BOOK_ID} already exists (ID: ${ratingId}), updating it`);
        
        // Update existing rating with new negative values
        await db.execute(
          sql`UPDATE ratings 
              SET enjoyment = ${enjoyment}, 
                  writing = ${writing}, 
                  themes = ${themes}, 
                  characters = ${characters}, 
                  worldbuilding = ${worldbuilding},
                  review = ${review}
              WHERE id = ${ratingId}`
        );
        
        console.log(`Updated rating ${ratingId} for user ${userId}: ${JSON.stringify({
          enjoyment,
          writing,
          themes,
          characters,
          worldbuilding
        })}`);
      } else {
        // Create new rating
        const ratingResult = await db.execute(
          sql`INSERT INTO ratings (user_id, book_id, enjoyment, writing, themes, characters, worldbuilding, review)
              VALUES (${userId}, ${BOOK_ID}, ${enjoyment}, ${writing}, ${themes}, ${characters}, ${worldbuilding}, ${review})
              RETURNING id`
        );
        
        const ratingId = Number(ratingResult.rows[0].id);
        console.log(`Created NEW rating ${ratingId} for user ${userId}: ${JSON.stringify({
          enjoyment,
          writing,
          themes,
          characters,
          worldbuilding
        })}`);
      }
      
      // We've already handled this user's rating above, continue to next user
    }
    
    console.log("Finished creating dummy users with negative ratings!");
  } catch (error) {
    console.error("Error creating dummy users and ratings:", error);
  } finally {
    // Note: Since we're running in the context of a web server,
    // we don't need to close the database connection as it would
    // stop the server. In a standalone script, you would close it.
    console.log("Script execution completed.");
  }
}

main();