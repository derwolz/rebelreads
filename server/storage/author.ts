import {
  Author,
  authors,
  users,
  ratings,
  followers,
  books,
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
}