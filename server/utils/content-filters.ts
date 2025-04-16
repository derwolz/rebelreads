import { db } from "../db";
import { and, eq, inArray } from "drizzle-orm";
import { 
  userBlocks, 
  books, 
  bookGenreTaxonomies,
  publishersAuthors 
} from "@shared/schema";

/**
 * Apply content filtering to a list of book IDs based on user's blocked content preferences
 * @param userId The ID of the user
 * @param bookIds Array of book IDs to filter
 * @returns Filtered array of book IDs
 */
export async function applyContentFilters(userId: number, bookIds: number[]): Promise<number[]> {
  if (!userId || !bookIds.length) {
    return bookIds; // Return original array if no userId or no books
  }

  // Make a copy to avoid modifying the original array
  let filteredBookIds = [...bookIds];

  try {
    // Get user's blocks
    const userBlocksResult = await db
      .select()
      .from(userBlocks)
      .where(eq(userBlocks.userId, userId));
    
    if (!userBlocksResult.length) {
      return filteredBookIds; // No blocks, return original list
    }
    
    // Group blocks by type for easier filtering
    const blockedAuthors = userBlocksResult
      .filter(block => block.blockType === 'author')
      .map(block => block.blockId);
    
    const blockedBooks = userBlocksResult
      .filter(block => block.blockType === 'book')
      .map(block => block.blockId);
    
    const blockedPublishers = userBlocksResult
      .filter(block => block.blockType === 'publisher')
      .map(block => block.blockId);
    
    const blockedTaxonomies = userBlocksResult
      .filter(block => block.blockType === 'taxonomy')
      .map(block => block.blockId);
    
    // Log block counts
    if (blockedAuthors.length > 0) {
      console.log(`User has ${blockedAuthors.length} blocked authors`);
    }
    
    if (blockedBooks.length > 0) {
      console.log(`User has ${blockedBooks.length} blocked books`);
    }
    
    if (blockedPublishers.length > 0) {
      console.log(`User has ${blockedPublishers.length} blocked publishers`);
    }
    
    if (blockedTaxonomies.length > 0) {
      console.log(`User has ${blockedTaxonomies.length} blocked taxonomies`);
    }
    
    // Filter out books that match blocked taxonomies
    if (blockedTaxonomies.length > 0) {
      // Find all books that have blocked taxonomies
      const booksWithBlockedTaxonomiesResult = await db
        .select({ bookId: bookGenreTaxonomies.bookId })
        .from(bookGenreTaxonomies)
        .where(and(
          inArray(bookGenreTaxonomies.taxonomyId, blockedTaxonomies),
          inArray(bookGenreTaxonomies.bookId, filteredBookIds)
        ));
      
      const booksWithBlockedTaxonomies = booksWithBlockedTaxonomiesResult.map(b => b.bookId);
      
      if (booksWithBlockedTaxonomies.length > 0) {
        console.log(`Filtering out ${booksWithBlockedTaxonomies.length} books with blocked taxonomies`);
        // Remove books with blocked taxonomies from our list
        filteredBookIds = filteredBookIds.filter(id => !booksWithBlockedTaxonomies.includes(id));
      }
    }
    
    // Apply direct book filtering
    if (blockedBooks.length > 0) {
      const initialBookCount = filteredBookIds.length;
      filteredBookIds = filteredBookIds.filter(id => !blockedBooks.includes(id));
      console.log(`Filtered out ${initialBookCount - filteredBookIds.length} directly blocked books`);
    }
    
    // Apply author filtering
    if (blockedAuthors.length > 0) {
      // Find all books by blocked authors
      const booksFromBlockedAuthorsResult = await db
        .select({ id: books.id })
        .from(books)
        .where(and(
          inArray(books.id, filteredBookIds),
          inArray(books.authorId, blockedAuthors)
        ));
      
      const booksFromBlockedAuthors = booksFromBlockedAuthorsResult.map(b => b.id);
      
      if (booksFromBlockedAuthors.length > 0) {
        console.log(`Filtering out ${booksFromBlockedAuthors.length} books by blocked authors`);
        // Remove books by blocked authors from our list
        filteredBookIds = filteredBookIds.filter(id => !booksFromBlockedAuthors.includes(id));
      }
    }
    
    // Apply publisher filtering
    if (blockedPublishers.length > 0) {
      // Direct query to find all books that have authors associated with blocked publishers
      const booksFromBlockedPublishersResult = await db
        .select({ bookId: books.id })
        .from(books)
        .innerJoin(publishersAuthors, eq(books.authorId, publishersAuthors.authorId))
        .where(and(
          inArray(books.id, filteredBookIds),
          inArray(publishersAuthors.publisherId, blockedPublishers)
        ));
      
      const booksFromBlockedPublishers = booksFromBlockedPublishersResult.map(b => b.bookId);
      
      if (booksFromBlockedPublishers.length > 0) {
        console.log(`Filtering out ${booksFromBlockedPublishers.length} books from blocked publishers`);
        // Remove these books from our list
        filteredBookIds = filteredBookIds.filter(id => !booksFromBlockedPublishers.includes(id));
      }
    }
    
    return filteredBookIds;
  } catch (error) {
    console.error("Error applying content filters:", error);
    return bookIds; // In case of error, return the original list
  }
}