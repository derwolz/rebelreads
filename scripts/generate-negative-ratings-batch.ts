import { db } from "../server/db";
import { users, ratings, books } from "../shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { hash } from "bcryptjs";

/**
 * This script creates negative ratings in batches of 20 users
 * for the book "Valkyrie X Truck" (ID: 51)
 */
async function main() {
  try {
    // Get batch number from command line arguments
    const args = process.argv.slice(2);
    const batchNumber = args.length > 0 ? parseInt(args[0], 10) : 1;
    
    if (isNaN(batchNumber) || batchNumber < 1) {
      console.error("Please provide a valid batch number (integer greater than 0)");
      return;
    }
    
    // Calculate starting user index based on batch number
    const BATCH_SIZE = 20;
    const startingUserNumber = 300 + ((batchNumber - 1) * BATCH_SIZE);
    
    console.log(`Starting to create batch #${batchNumber} (users ${startingUserNumber}-${startingUserNumber + BATCH_SIZE - 1}) with negative ratings...`);
    
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
    
    // Generate an extremely negatively skewed rating value
    function getHeavyNegativeRating(): number {
      // Generate random value with extremely negative bias:
      // 85% chance of -1 (thumbs down)
      // 10% chance of 0 (neutral)
      // 5% chance of 1 (thumbs up)
      const rand = Math.random();
      if (rand < 0.85) return -1;  // 85% chance of thumbs down
      if (rand < 0.95) return 0;   // 10% chance of neutral
      return 1;                     // 5% chance of thumbs up
    }
    
    // Generate a broader variety of negative review texts
    function getNegativeReview(username: string): string {
      const negativeReviews = [
        `Disappointing on every level. The characters felt one-dimensional and plot was predictable.`,
        `The writing style is overly simplistic and lacks depth. Can't recommend this to anyone.`,
        `I couldn't relate to any of the characters. They all felt manufactured and inauthentic.`,
        `The worldbuilding has major inconsistencies and the pacing feels completely off.`,
        `I had high hopes for this book but it fails to deliver on its premise in every way.`,
        `The themes are confused and poorly explored throughout the narrative.`,
        `Character development is virtually non-existent, with baffling motivations.`,
        `Struggled to finish this book - the writing style is jarring and unenjoyable.`,
        `Full of plot holes that completely ruined the story for me.`,
        `Dialogue was cringe-worthy and characters were indistinguishable from each other.`,
        `This reads like a first draft that wasn't edited. So many issues with the writing.`,
        `The author seems to have no understanding of how real people think or behave.`,
        `Confusing narrative structure that made the story nearly impossible to follow.`,
        `The ending was completely unsatisfying and made the entire journey feel pointless.`,
        `The premise had potential but the execution was amateur at best.`,
        `Derivative and unoriginal. Borrows heavily from better works without adding anything new.`,
        `The author's attempt at profound themes comes across as pretentious and shallow.`,
        `So disappointed I wasted my time on this. The story goes nowhere interesting.`,
        `Awkward pacing with a rushed ending that left too many questions unanswered.`,
        `Contains offensive stereotypes and outdated tropes that should have been edited out.`
      ];
      
      // Return a random negative review + username for traceability
      return `${negativeReviews[Math.floor(Math.random() * negativeReviews.length)]} - ${username}`;
    }
    
    // Process batch of users
    for (let i = startingUserNumber; i < startingUserNumber + BATCH_SIZE; i++) {
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
      
      // Generate extremely negatively skewed ratings
      const enjoyment = getHeavyNegativeRating();
      const writing = getHeavyNegativeRating();
      const themes = getHeavyNegativeRating();
      const characters = getHeavyNegativeRating();
      const worldbuilding = getHeavyNegativeRating();
      
      // 75% of users get a detailed negative review
      const review = Math.random() < 0.75 ? getNegativeReview(username) : null;
      
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
      
      // Brief pause between users to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`Finished creating batch #${batchNumber} of negative ratings!`);
  } catch (error) {
    console.error("Error creating dummy users and ratings:", error);
  }
}

main();