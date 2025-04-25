import { db } from "../db";
import { bookShelves, shelfBooks, books, bookImages } from "@shared/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";

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
        
        // Get all book IDs to fetch images
        const bookIds = shelfBooksList.map(item => item.book.id);
        
        // Fetch images for all books in a single query
        const allBookImages = bookIds.length > 0 
          ? await db.select()
              .from(bookImages)
              .where(inArray(bookImages.bookId, bookIds))
          : [];
        
        // Group images by book ID for easy lookup
        const imagesByBookId = new Map();
        allBookImages.forEach(image => {
          if (!imagesByBookId.has(image.bookId)) {
            imagesByBookId.set(image.bookId, []);
          }
          imagesByBookId.get(image.bookId).push(image);
        });
        
        // Add images to each book
        const booksWithImages = shelfBooksList.map(item => ({
          ...item.book,
          images: imagesByBookId.get(item.book.id) || []
        }));
        
        // Return the shelf with its books
        return {
          shelf,
          books: booksWithImages
        };
      })
    );
    
    return shelvesWithBooks;
  }
}