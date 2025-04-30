import { db } from "../server/db";
import { users, ratings, books } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { hash } from "bcryptjs";
import { Pool } from 'pg';

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
    
    // Generate a random rating value between -1 and 1
    function getRandomRating(): number {
      // Generate a value between -1 and 1 with a slight bias toward positive
      return Math.min(1, Math.max(-1, Math.random() * 2 - 0.8));
    }
    
    // Create 100 dummy users and ratings
    for (let i = 1; i <= 100; i++) {
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
          sql`INSERT INTO users (email, username, display_name, password_hash, role, verification_status, verified_at)
              VALUES (${email}, ${username}, ${displayName}, ${passwordHash}, 'user', 'verified', ${new Date()})
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
        console.log(`Rating for user ${userId} on book ${BOOK_ID} already exists, skipping`);
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
        enjoyment: enjoyment.toFixed(2),
        writing: writing.toFixed(2),
        themes: themes.toFixed(2),
        characters: characters.toFixed(2),
        worldbuilding: worldbuilding.toFixed(2)
      })}`);
    }
    
    console.log("Finished creating dummy users and ratings!");
  } catch (error) {
    console.error("Error creating dummy users and ratings:", error);
  } finally {
    // Close the database pool connection
    // We need to access the underlying pg Pool to close the connection properly
    if (db.$client instanceof Pool) {
      await db.$client.end();
    }
  }
}

main();