import { db } from "../db";
import { bookShelves, shelfBooks, books } from "@shared/schema";
import { eq, and, asc, desc } from "drizzle-orm";

export interface IShelfStorage {
  getSharedBookshelvesForUser(userId: number): Promise<any[]>;
}

export class ShelfStorage implements IShelfStorage {
  /**
   * Get all public/shared bookshelves for a specific user
   * @param userId The user ID to get shared bookshelves for
   * @returns Array of shared bookshelves with their books
   */
  async getSharedBookshelvesForUser(userId: number): Promise<any[]> {
    // First get all shared bookshelves for this user
    const shelves = await db
      .select()
      .from(bookShelves)
      .where(
        and(
          eq(bookShelves.userId, userId),
          eq(bookShelves.isShared, true)
        )
      )
      .orderBy(asc(bookShelves.rank));
    
    // For each shelf, get the books
    const shelvesWithBooks = await Promise.all(
      shelves.map(async (shelf) => {
        // Get books for this shelf
        const shelfBooksResult = await db
          .select({
            shelfBook: shelfBooks,
            book: books
          })
          .from(shelfBooks)
          .where(eq(shelfBooks.shelfId, shelf.id))
          .innerJoin(books, eq(shelfBooks.bookId, books.id))
          .orderBy(asc(shelfBooks.rank));
        
        // Extract just the books from the result
        const shelfBooksList = shelfBooksResult.map(item => ({
          ...item.shelfBook,
          book: item.book
        }));
        
        // Return the shelf with its books
        return {
          shelf,
          books: shelfBooksList.map(item => item.book)
        };
      })
    );
    
    return shelvesWithBooks;
  }
}