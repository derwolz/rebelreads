import { db } from "../server/db";
import { users, ratings, books } from "../shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { hash } from "bcryptjs";

/**
 * This script creates 100 dummy users with the format private.test{num}@sirened.com
 * and username test{num}.sirened, then generates random ratings for the book
 * "Valkyrie X Truck" (ID: 51)
 */
async function main() {
  try {
    console.log("Starting to create dummy users and ratings...");
    
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
    
    // Generate a random rating value of -1, 0, or 1 with a slight bias toward positive
    function getRandomRating(): number {
      // Generate random value with distribution: 25% chance of -1, 25% chance of 0, 50% chance of 1
      const rand = Math.random();
      if (rand < 0.25) return -1; // 25% chance of thumbs down
      if (rand < 0.5) return 0;   // 25% chance of neutral (not rated)
      return 1;                    // 50% chance of thumbs up
    }
    
    // Create up to a total of 100 dummy users and ratings
    // We'll limit to 100 to avoid timeouts
    const MAX_USERS = 100;
    
    for (let i = 1; i <= MAX_USERS; i++) {
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
      
      // Check if rating already exists
      const existingRating = await db.query.ratings.findFirst({
        where: (rating) => 
          eq(rating.userId, userId) && 
          eq(rating.bookId, BOOK_ID)
      });
      
      if (existingRating) {
        console.log(`Rating for user ${userId} on book ${BOOK_ID} already exists, updating it`);
        
        // Generate random ratings
        const enjoyment = getRandomRating();
        const writing = getRandomRating();
        const themes = getRandomRating();
        const characters = getRandomRating();
        const worldbuilding = getRandomRating();
        
        // Update existing rating with new random values
        const review = i % 5 === 0 ? `This is a test review from ${username}` : null;
        await db.execute(
          sql`UPDATE ratings 
              SET enjoyment = ${enjoyment}, 
                  writing = ${writing}, 
                  themes = ${themes}, 
                  characters = ${characters}, 
                  worldbuilding = ${worldbuilding},
                  review = ${review}
              WHERE user_id = ${userId} AND book_id = ${BOOK_ID}`
        );
        
        console.log(`Updated rating ${existingRating.id} for user ${userId}: ${JSON.stringify({
          enjoyment,
          writing,
          themes,
          characters,
          worldbuilding
        })}`);
        
        continue;
      }
      
      // Generate random ratings
      const enjoyment = getRandomRating();
      const writing = getRandomRating();
      const themes = getRandomRating();
      const characters = getRandomRating();
      const worldbuilding = getRandomRating();
      
      // Create rating using raw SQL
      const review = i % 5 === 0 ? `This is a test review from ${username}` : null;
      const ratingResult = await db.execute(
        sql`INSERT INTO ratings (user_id, book_id, enjoyment, writing, themes, characters, worldbuilding, review)
            VALUES (${userId}, ${BOOK_ID}, ${enjoyment}, ${writing}, ${themes}, ${characters}, ${worldbuilding}, ${review})
            RETURNING id`
      );
      
      const ratingId = Number(ratingResult.rows[0].id);
      
      console.log(`Created rating ${ratingId} for user ${userId}: ${JSON.stringify({
        enjoyment,
        writing,
        themes,
        characters,
        worldbuilding
      })}`);
    }
    
    console.log("Finished creating dummy users and ratings!");
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