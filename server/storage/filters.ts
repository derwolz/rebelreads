import { 
  InsertUserBlock, 
  UserBlock, 
  userBlocks,
  authors,
  publishers,
  books,
  genreTaxonomies,
  BLOCK_TYPE_OPTIONS
} from "@shared/schema";
import { db } from "../db";
import { eq, and, inArray, sql } from "drizzle-orm";

export interface IFilterStorage {
  // Block management
  getUserBlocks(userId: number): Promise<UserBlock[]>;
  getBlocksByType(userId: number, blockType: typeof BLOCK_TYPE_OPTIONS[number]): Promise<UserBlock[]>;
  addBlock(block: InsertUserBlock): Promise<UserBlock>;
  removeBlock(id: number, userId: number): Promise<void>;
  removeBlockByTypeAndId(userId: number, blockType: typeof BLOCK_TYPE_OPTIONS[number], blockId: number): Promise<void>;
  isBlocked(userId: number, blockType: typeof BLOCK_TYPE_OPTIONS[number], blockId: number): Promise<boolean>;
  
  // Search for content to block
  searchAuthors(query: string): Promise<{ id: number, name: string }[]>;
  searchPublishers(query: string): Promise<{ id: number, name: string }[]>;
  searchBooks(query: string): Promise<{ id: number, title: string }[]>;
  searchTaxonomies(query: string): Promise<{ id: number, name: string, type: string }[]>;
}

export class FilterStorage implements IFilterStorage {
  async getUserBlocks(userId: number): Promise<UserBlock[]> {
    return await db
      .select()
      .from(userBlocks)
      .where(eq(userBlocks.userId, userId));
  }

  async getBlocksByType(userId: number, blockType: typeof BLOCK_TYPE_OPTIONS[number]): Promise<UserBlock[]> {
    return await db
      .select()
      .from(userBlocks)
      .where(and(
        eq(userBlocks.userId, userId),
        eq(userBlocks.blockType, blockType)
      ));
  }

  async addBlock(block: InsertUserBlock): Promise<UserBlock> {
    const [newBlock] = await db
      .insert(userBlocks)
      .values(block)
      .returning();
    return newBlock;
  }

  async removeBlock(id: number, userId: number): Promise<void> {
    await db
      .delete(userBlocks)
      .where(and(
        eq(userBlocks.id, id),
        eq(userBlocks.userId, userId)
      ));
  }

  async removeBlockByTypeAndId(userId: number, blockType: typeof BLOCK_TYPE_OPTIONS[number], blockId: number): Promise<void> {
    await db
      .delete(userBlocks)
      .where(and(
        eq(userBlocks.userId, userId),
        eq(userBlocks.blockType, blockType),
        eq(userBlocks.blockId, blockId)
      ));
  }

  async isBlocked(userId: number, blockType: typeof BLOCK_TYPE_OPTIONS[number], blockId: number): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userBlocks)
      .where(and(
        eq(userBlocks.userId, userId),
        eq(userBlocks.blockType, blockType),
        eq(userBlocks.blockId, blockId)
      ));
    
    return result.count > 0;
  }

  async searchAuthors(query: string): Promise<{ id: number, name: string }[]> {
    return await db
      .select({
        id: authors.id,
        name: authors.author_name,
      })
      .from(authors)
      .where(sql`${authors.author_name} ILIKE ${`%${query}%`}`)
      .limit(10);
  }

  async searchPublishers(query: string): Promise<{ id: number, name: string }[]> {
    return await db
      .select({
        id: publishers.id,
        name: publishers.publisher_name,
      })
      .from(publishers)
      .where(sql`${publishers.publisher_name} ILIKE ${`%${query}%`}`)
      .limit(10);
  }

  async searchBooks(query: string): Promise<{ id: number, title: string }[]> {
    return await db
      .select({
        id: books.id,
        title: books.title,
      })
      .from(books)
      .where(sql`${books.title} ILIKE ${`%${query}%`}`)
      .limit(10);
  }

  async searchTaxonomies(query: string): Promise<{ id: number, name: string, type: string }[]> {
    return await db
      .select({
        id: genreTaxonomies.id,
        name: genreTaxonomies.name,
        type: genreTaxonomies.type,
      })
      .from(genreTaxonomies)
      .where(sql`${genreTaxonomies.name} ILIKE ${`%${query}%`}`)
      .limit(10);
  }
}