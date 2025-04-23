import {
  Author,
  authors,
  users,
  ratings,
  followers,
  books,
  bookShelves,
  shelfBooks,
  insertAuthorSchema
} from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, and, count, isNull, avg } from "drizzle-orm";

type InsertAuthor = z.infer<typeof insertAuthorSchema>;

export interface IAuthorStorage {
  getAuthors(): Promise<Author[]>;
  getAuthor(id: number): Promise<Author | undefined>;
  getAuthorByUserId(userId: number): Promise<Author | undefined>;
  getAuthorByName(authorName: string): Promise<Author | undefined>;
  createAuthor(author: InsertAuthor): Promise<Author>;
  isUserAuthor(userId: number): Promise<boolean>;
  updateAuthor(id: number, author: Partial<InsertAuthor>): Promise<Author>;
  getAuthorFollowerCount(authorId: number): Promise<number>;
  getAuthorAggregateRatings(authorId: number): Promise<{
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  } | null>;
  deleteAuthor(userId: number, preservePro?: boolean, proExpiresAt?: Date | null): Promise<void>;
  getSharedBookshelvesForUser(userId: number): Promise<any[]>;
}

export class AuthorStorage implements IAuthorStorage {
  async getAuthors(): Promise<Author[]> {
    return await db.select().from(authors);
  }

  async getAuthor(id: number): Promise<Author | undefined> {
    const [author] = await db
      .select()
      .from(authors)
      .where(eq(authors.id, id));
    return author;
  }

  async getAuthorByUserId(userId: number): Promise<Author | undefined> {
    const [author] = await db
      .select()
      .from(authors)
      .where(eq(authors.userId, userId));
    return author;
  }

  async getAuthorByName(authorName: string): Promise<Author | undefined> {
    const [author] = await db
      .select()
      .from(authors)
      .where(eq(authors.author_name, authorName));
    return author;
  }

  async createAuthor(author: InsertAuthor): Promise<Author> {
    const [newAuthor] = await db
      .insert(authors)
      .values(author)
      .returning();
    return newAuthor;
  }

  async isUserAuthor(userId: number): Promise<boolean> {
    const author = await this.getAuthorByUserId(userId);
    return !!author;
  }

  async updateAuthor(id: number, author: Partial<InsertAuthor>): Promise<Author> {
    const [updatedAuthor] = await db
      .update(authors)
      .set(author)
      .where(eq(authors.id, id))
      .returning();
    return updatedAuthor;
  }
  
  async getAuthorFollowerCount(authorId: number): Promise<number> {
    // Count followers where deletedAt is null (active followers)
    const result = await db
      .select({
        count: count(),
      })
      .from(followers)
      .where(
        and(
          eq(followers.followingId, authorId),
          isNull(followers.deletedAt)
        )
      );
    
    return result[0]?.count || 0;
  }
  
  async getAuthorAggregateRatings(authorId: number): Promise<{
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  } | null> {
    // Get books by this author
    const authorBooks = await db
      .select({
        id: books.id
      })
      .from(books)
      .where(eq(books.authorId, authorId));
    
    // If author has no books, return null
    if (authorBooks.length === 0) {
      return null;
    }
    
    // Get book IDs
    const bookIds = authorBooks.map(book => book.id);
    
    // Calculate average ratings across all the author's books
    const [result] = await db
      .select({
        enjoyment: avg(ratings.enjoyment),
        writing: avg(ratings.writing),
        themes: avg(ratings.themes),
        characters: avg(ratings.characters),
        worldbuilding: avg(ratings.worldbuilding)
      })
      .from(ratings)
      .innerJoin(books, eq(ratings.bookId, books.id))
      .where(
        eq(books.authorId, authorId)
      );
    
    if (!result) {
      return null;
    }
    
    // Calculate overall weighted rating
    // Convert string values to numbers and apply default of 0 if null
    const enjoyment = Number(result.enjoyment) || 0;
    const writing = Number(result.writing) || 0;
    const themes = Number(result.themes) || 0;
    const characters = Number(result.characters) || 0;
    const worldbuilding = Number(result.worldbuilding) || 0;
    
    const overall = (
      enjoyment * 0.3 + 
      writing * 0.3 + 
      themes * 0.2 + 
      characters * 0.1 + 
      worldbuilding * 0.1
    );
    
    return {
      overall: overall,
      enjoyment: enjoyment,
      writing: writing,
      themes: themes,
      characters: characters,
      worldbuilding: worldbuilding
    };
  }
  
  /**
   * Delete an author profile while optionally preserving Pro status details
   * @param userId The user ID associated with the author
   * @param preservePro Whether to preserve Pro status (defaults to false)
   * @param proExpiresAt The Pro expiration date to preserve (if applicable)
   */
  async deleteAuthor(userId: number, preservePro: boolean = false, proExpiresAt: Date | null = null): Promise<void> {
    // Find the author record
    const author = await this.getAuthorByUserId(userId);
    
    if (!author) {
      throw new Error(`Author with user ID ${userId} not found`);
    }
    
    // If we're preserving Pro status, we should create a special record to track it
    if (preservePro) {
      // Store the Pro status information in a separate table or record
      // This might involve creating a "former_authors" table or similar to track Pro status
      console.log(`Preserving Pro status for author ${author.id} (User: ${userId}) until ${proExpiresAt}`);
      
      // For now, we'll just delete the main author record
      // A full implementation would need a separate table to track historical Pro status
    }
    
    // Delete the author record
    await db
      .delete(authors)
      .where(eq(authors.userId, userId));
      
    console.log(`Deleted author with user ID ${userId}`);
  }

  /**
   * Get shared bookshelves for a user with the books in each shelf
   * @param userId The user ID to get shared bookshelves for
   * @returns Array of shelf objects with associated books
   */
  async getSharedBookshelvesForUser(userId: number): Promise<any[]> {
    try {
      // Get all shared bookshelves for the user
      const shelves = await db
        .select()
        .from(bookShelves)
        .where(
          and(
            eq(bookShelves.userId, userId),
            eq(bookShelves.isShared, true)
          )
        )
        .orderBy(bookShelves.rank);

      // For each shelf, get the associated books
      const result = await Promise.all(
        shelves.map(async (shelf) => {
          // Get shelf books with book details
          const shelfBooksWithDetails = await db
            .select({
              id: shelfBooks.id,
              bookId: shelfBooks.bookId,
              shelfId: shelfBooks.shelfId,
              rank: shelfBooks.rank,
              addedAt: shelfBooks.addedAt,
              book: books
            })
            .from(shelfBooks)
            .innerJoin(books, eq(shelfBooks.bookId, books.id))
            .where(eq(shelfBooks.shelfId, shelf.id))
            .orderBy(shelfBooks.rank);

          return {
            shelf: shelf,
            books: shelfBooksWithDetails
          };
        })
      );

      return result;
    } catch (error) {
      console.error("Error fetching shared bookshelves:", error);
      return [];
    }
  }
}