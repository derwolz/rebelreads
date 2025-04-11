import {
  Book,
  books,
  bookGenreTaxonomies,
  genreTaxonomies,
  InsertBookGenreTaxonomy
} from "@shared/schema";
import { db } from "../db";
import { eq, and, ilike, sql } from "drizzle-orm";

export interface IBookStorage {
  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  getBooksByAuthor(authorId: number): Promise<Book[]>;
  createBook(book: Omit<Book, "id">): Promise<Book>;
  promoteBook(id: number): Promise<Book>;
  updateBook(id: number, data: Partial<Book>): Promise<Book>;
  updateBookTaxonomies(bookId: number, taxonomyData: any[]): Promise<void>;
  getBookTaxonomies(bookId: number): Promise<{
    taxonomyId: number;
    rank: number;
    importance: number;
    name: string;
    type: string;
    description?: string;
  }[]>;
  deleteBook(id: number, authorId: number): Promise<void>;
  getAuthorGenres(authorId: number): Promise<{ genre: string; count: number }[]>;
  selectBooks(query: string): Promise<Book[]>;
  updateInternalDetails(id: number, details: string): Promise<Book>;
}

export class BookStorage implements IBookStorage {
  async getBooks(): Promise<Book[]> {
    return await db.select().from(books);
  }

  async selectBooks(query: string): Promise<Book[]> {
    if (!query) {
      return [];
    }

    // Create the search vector SQL once to avoid repetition
    const searchVector = sql`
      setweight(to_tsvector('english', coalesce(${books.title}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${books.author}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${books.description}, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(${books.internal_details}, '')), 'B')
    `;

    const searchQuery = sql`plainto_tsquery('english', ${query})`;

    const results = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        description: books.description,
        internal_details: books.internal_details,
        // genres removed - using relationship table instead
        coverUrl: books.coverUrl,
        publishedDate: books.publishedDate,
        promoted: books.promoted,
        authorId: books.authorId,
        impressionCount: books.impressionCount,
        clickThroughCount: books.clickThroughCount,
        lastImpressionAt: books.lastImpressionAt,
        lastClickThroughAt: books.lastClickThroughAt,
        search_rank: sql<number>`ts_rank(${searchVector}, ${searchQuery})`.as('search_rank')
      })
      .from(books)
      .where(sql`${searchVector} @@ ${searchQuery}`)
      .orderBy(sql`ts_rank(${searchVector}, ${searchQuery}) DESC`)
      .limit(20);

    return results.map(({ search_rank, ...book }) => book);
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async getBooksByAuthor(authorId: number): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.authorId, authorId));
  }

  async createBook(book: Omit<Book, "id">): Promise<Book> {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  async promoteBook(id: number): Promise<Book> {
    const [book] = await db
      .update(books)
      .set({ promoted: true })
      .where(eq(books.id, id))
      .returning();
    return book;
  }

  async updateBook(id: number, data: Partial<Book>): Promise<Book> {
    // Extract genreTaxonomies from data if present, as we'll handle them separately
    const { genreTaxonomies, ...bookData } = data as any;
    
    const [book] = await db
      .update(books)
      .set(bookData)
      .where(eq(books.id, id))
      .returning();
    
    return book;
  }
  
  async updateBookTaxonomies(bookId: number, taxonomyData: any[]): Promise<void> {
    // First, delete any existing taxonomies for this book
    await db.delete(bookGenreTaxonomies)
      .where(eq(bookGenreTaxonomies.bookId, bookId));
    
    if (taxonomyData && taxonomyData.length > 0) {
      // Then insert the new ones with their importance calculated
      const newTaxonomies = taxonomyData.map((item, index) => {
        // Calculate importance value using 1 / (1 + ln(rank))
        const rank = item.rank || index + 1;
        const importance = 1 / (1 + Math.log(rank));
        
        return {
          bookId: bookId,
          taxonomyId: item.taxonomyId,
          rank: rank,
          importance: importance.toString() // Convert to string for decimal field
        } as InsertBookGenreTaxonomy;
      });
      
      await db.insert(bookGenreTaxonomies)
        .values(newTaxonomies);
    }
  }

  async deleteBook(id: number, authorId: number): Promise<void> {
    await db
      .delete(books)
      .where(and(eq(books.id, id), eq(books.authorId, authorId)));
  }

  async getAuthorGenres(
    authorId: number,
  ): Promise<{ genre: string; count: number }[]> {
    // Query book_genre_taxonomies table through a join with books table
    const result = await db
      .select({
        name: sql<string>`g.name`,
        count: sql<number>`count(*)`,
      })
      .from(books)
      .innerJoin(
        bookGenreTaxonomies, 
        eq(books.id, bookGenreTaxonomies.bookId)
      )
      .innerJoin(
        genreTaxonomies.as('g'),
        eq(bookGenreTaxonomies.taxonomyId, sql<number>`g.id`)
      )
      .where(and(
        eq(books.authorId, authorId),
        eq(sql`g.type`, 'genre')
      ))
      .groupBy(sql`g.name`)
      .orderBy(sql`count(*) DESC`);
    
    // Transform result to expected format
    return result.map(item => ({
      genre: item.name,
      count: Number(item.count)
    }));
  }

  async getBookTaxonomies(bookId: number): Promise<{
    taxonomyId: number;
    rank: number;
    importance: number;
    name: string;
    type: string;
    description?: string;
  }[]> {
    // Query book taxonomies with details from the genre_taxonomies table
    const result = await db
      .select({
        taxonomyId: bookGenreTaxonomies.taxonomyId,
        rank: bookGenreTaxonomies.rank,
        importance: bookGenreTaxonomies.importance,
        name: genreTaxonomies.name,
        type: genreTaxonomies.type,
        description: genreTaxonomies.description,
      })
      .from(bookGenreTaxonomies)
      .innerJoin(
        genreTaxonomies,
        eq(bookGenreTaxonomies.taxonomyId, genreTaxonomies.id)
      )
      .where(eq(bookGenreTaxonomies.bookId, bookId))
      .orderBy(bookGenreTaxonomies.rank);
    
    return result.map(item => ({
      taxonomyId: Number(item.taxonomyId),
      rank: Number(item.rank),
      importance: Number(item.importance),
      name: item.name,
      type: item.type,
      description: item.description || undefined,
    }));
  }
  
  async updateInternalDetails(id: number, details: string): Promise<Book> {
    const [book] = await db
      .update(books)
      .set({ internal_details: details })
      .where(eq(books.id, id))
      .returning();
    return book;
  }
}