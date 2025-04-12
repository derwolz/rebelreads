import {
  Author,
  authors,
  users,
  insertAuthorSchema
} from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";

type InsertAuthor = z.infer<typeof insertAuthorSchema>;

export interface IAuthorStorage {
  getAuthors(): Promise<Author[]>;
  getAuthor(id: number): Promise<Author | undefined>;
  getAuthorByUserId(userId: number): Promise<Author | undefined>;
  createAuthor(author: InsertAuthor): Promise<Author>;
  isUserAuthor(userId: number): Promise<boolean>;
  updateAuthor(id: number, author: Partial<InsertAuthor>): Promise<Author>;
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
}