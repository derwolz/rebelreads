
import { dbStorage } from "../server/storage";
import { db } from "../server/db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

async function deleteUsers(userIds: number[]) {
  try {
    for (const userId of userIds) {
      console.log(`Processing deletion for user ${userId}...`);
      
      // First delete all books by this user if they were an author
      await dbStorage.deleteAllAuthorBooks(userId);
      console.log(`Deleted all books for user ${userId}`);
      
      // Delete the user's ratings and preferences
      await db.execute(sql`DELETE FROM ratings WHERE user_id = ${userId}`);
      await db.execute(sql`DELETE FROM rating_preferences WHERE user_id = ${userId}`);
      console.log(`Deleted ratings and preferences for user ${userId}`);
      
      // Delete reading statuses
      await db.execute(sql`DELETE FROM reading_status WHERE user_id = ${userId}`);
      console.log(`Deleted reading status for user ${userId}`);
      
      // Delete any author records
      await dbStorage.deleteAuthor(userId, false);
      console.log(`Deleted author record for user ${userId}`);
      
      // Finally delete the user
      await db.delete(users).where(eq(users.id, userId));
      console.log(`Successfully deleted user ${userId}`);
    }
    
    console.log('All specified users have been deleted');
  } catch (error) {
    console.error('Error during user deletion:', error);
  }
}

// Execute deletions for users 25, 26, and 27
deleteUsers([25, 26, 27]);
