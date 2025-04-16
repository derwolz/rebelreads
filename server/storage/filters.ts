import { db } from "../db";
import { InsertUserBlock, UserBlock, userBlocks, authors, books, publishers, genreTaxonomies } from "../../shared/schema";
import { SQL, and, eq, ilike, or } from "drizzle-orm";

export class FilterStorage {
  
  // Get all blocks for a user
  async getUserBlocks(userId: number): Promise<UserBlock[]> {
    return db.select().from(userBlocks).where(eq(userBlocks.userId, userId));
  }
  
  // Get blocks by type for a user
  async getUserBlocksByType(userId: number, blockType: string): Promise<UserBlock[]> {
    return db.select()
      .from(userBlocks)
      .where(and(
        eq(userBlocks.userId, userId),
        eq(userBlocks.blockType, blockType)
      ));
  }
  
  // Create a new user block
  async createUserBlock(data: InsertUserBlock): Promise<UserBlock> {
    const [result] = await db.insert(userBlocks).values(data).returning();
    return result;
  }
  
  // Delete a user block by ID
  async deleteUserBlock(id: number, userId: number): Promise<void> {
    await db.delete(userBlocks)
      .where(and(
        eq(userBlocks.id, id),
        eq(userBlocks.userId, userId)
      ));
  }
  
  // Delete a user block by type and blockId
  async deleteUserBlockByTypeAndId(userId: number, blockType: string, blockId: number): Promise<void> {
    await db.delete(userBlocks)
      .where(and(
        eq(userBlocks.userId, userId),
        eq(userBlocks.blockType, blockType),
        eq(userBlocks.blockId, blockId)
      ));
  }
  
  // Check if a specific entity is blocked
  async checkUserBlock(userId: number, blockType: string, blockId: number): Promise<UserBlock | undefined> {
    const results = await db.select()
      .from(userBlocks)
      .where(and(
        eq(userBlocks.userId, userId),
        eq(userBlocks.blockType, blockType),
        eq(userBlocks.blockId, blockId)
      ));
    
    return results[0];
  }
  
  // Search for entities to block based on type and query
  async searchContentToBlock(blockType: string, query: string): Promise<{ id: number; name: string; type?: string }[]> {
    const searchTerm = `%${query}%`;
    
    switch(blockType) {
      case "author":
        const authorResults = await db.select({
          id: authors.id,
          name: authors.author_name
        })
        .from(authors)
        .where(ilike(authors.author_name, searchTerm))
        .limit(10);
        
        return authorResults.map(author => ({
          id: author.id,
          name: author.name
        }));
        
      case "book":
        const bookResults = await db.select({
          id: books.id,
          name: books.title
        })
        .from(books)
        .where(ilike(books.title, searchTerm))
        .limit(10);
        
        return bookResults.map(book => ({
          id: book.id,
          name: book.name
        }));
        
      case "publisher":
        const publisherResults = await db.select({
          id: publishers.id,
          name: publishers.publisher_name
        })
        .from(publishers)
        .where(ilike(publishers.publisher_name, searchTerm))
        .limit(10);
        
        return publisherResults.map(publisher => ({
          id: publisher.id,
          name: publisher.name
        }));
        
      case "taxonomy":
        const taxonomyResults = await db.select({
          id: genreTaxonomies.id,
          name: genreTaxonomies.name,
          type: genreTaxonomies.type
        })
        .from(genreTaxonomies)
        .where(ilike(genreTaxonomies.name, searchTerm))
        .limit(10);
        
        return taxonomyResults.map(taxonomy => ({
          id: taxonomy.id,
          name: taxonomy.name,
          type: taxonomy.type
        }));
        
      default:
        return [];
    }
  }
}