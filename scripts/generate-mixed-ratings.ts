import { db } from "../server/db";
import { users, ratings, books } from "../shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { hash } from "bcryptjs";

/**
 * This script creates 200 additional users with mixed ratings (positive enjoyment, negative writing)
 * for the book "Valkyrie X Truck" (ID: 51)
 */
async function main() {
  try {
    console.log("Starting to create 200 mixed ratings (positive enjoyment, negative writing)...");
    
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
    
    // Generate positive enjoyment
    function getPositiveEnjoyment(): number {
      // Always 1 (thumbs up) for enjoyment
      return 1;
    }
    
    // Generate negative writing
    function getNegativeWriting(): number {
      // 85% chance of -1, 15% chance of 0
      return Math.random() < 0.85 ? -1 : 0;
    }
    
    // Generate mixed ratings for other categories
    function getMixedRating(): number {
      // Generate random value with distribution:
      // 40% chance of -1 (thumbs down)
      // 30% chance of 0 (neutral)
      // 30% chance of 1 (thumbs up)
      const rand = Math.random();
      if (rand < 0.4) return -1;
      if (rand < 0.7) return 0;
      return 1;
    }
    
    // Generate mixed review texts that like the book but criticize the writing
    function getMixedReview(username: string): string {
      const mixedReviews = [
        `I enjoyed the story and concept, but the writing quality was disappointing.`,
        `Great ideas and characters, but desperately needs a better editor.`,
        `Fun read despite the poor writing style and grammar issues.`,
        `Loved the premise and plot, but the writing felt amateurish.`,
        `The story had me hooked even though the writing was clunky.`,
        `Entertaining despite numerous typos and awkward phrasing.`,
        `Great concept weighed down by poor execution and writing.`,
        `I liked the characters but the dialogue was unrealistic and stiff.`,
        `The plot was interesting, but the writing style made it hard to get through.`,
        `Would have been 5 stars if the writing matched the quality of the idea.`,
        `Compelling story buried under layers of bad writing.`,
        `Good storyline with awkward prose and poor technical execution.`,
        `I enjoyed it, but the writing needs significant improvement.`,
        `The author has great imagination but needs to work on their craft.`,
        `I was invested in the story despite the subpar writing.`,
        `Fun concept, but the writing felt rushed and unpolished.`,
        `I'd read a sequel if the writing improves.`,
        `The ideas were fascinating but the execution was disappointing.`,
        `Great potential, but the prose needs serious work.`,
        `I cared about the characters despite the poor quality writing.`
      ];
      
      // Return a random mixed review + username for traceability
      return `${mixedReviews[Math.floor(Math.random() * mixedReviews.length)]} - ${username}`;
    }
    
    // Create 200 dummy users and ratings with mixed patterns
    const MAX_USERS = 200;
    const startingUserNumber = 500; // Start at a higher number to avoid conflicts
    
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
      
      // Generate mixed ratings - positive enjoyment, negative writing
      const enjoyment = getPositiveEnjoyment();
      const writing = getNegativeWriting();
      const themes = getMixedRating();
      const characters = getMixedRating();
      const worldbuilding = getMixedRating();
      
      // 80% of users get a detailed mixed review
      const review = Math.random() < 0.8 ? getMixedReview(username) : null;
      
      if (checkRatingResult.rowCount > 0) {
        const ratingId = checkRatingResult.rows[0].id;
        console.log(`Rating for user ${userId} on book ${BOOK_ID} already exists (ID: ${ratingId}), updating it`);
        
        // Update existing rating with new mixed values
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
      
      // To avoid timeout or memory issues, pause briefly after every 20 users
      if (i % 20 === 0 && i > startingUserNumber) {
        console.log(`Processed ${i - startingUserNumber} out of ${MAX_USERS} users. Brief pause...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log("Finished creating 200 mixed ratings!");
  } catch (error) {
    console.error("Error creating mixed ratings:", error);
  } finally {
    console.log("Script execution completed.");
  }
}

main();