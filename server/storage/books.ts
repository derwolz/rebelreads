import {
  Book,
  books,
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

    // Use full text search with ranking across title, author, description, and internal_details
    const results = await db
      .select({
        ...books,
        rank: sql<number>`ts_rank(
          setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(author, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(internal_details, '')), 'B'),
          plainto_tsquery('english', ${query})
        )`,
      })
      .from(books)
      .where(sql`
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(author, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(internal_details, '')), 'B')
        @@ plainto_tsquery('english', ${query})
      `)
      .orderBy(sql`rank DESC`)
      .limit(20);

    return results.map(({ rank, ...book }) => book);
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
    const [book] = await db
      .update(books)
      .set(data)
      .where(eq(books.id, id))
      .returning();
    return book;
  }

  async deleteBook(id: number, authorId: number): Promise<void> {
    await db
      .delete(books)
      .where(and(eq(books.id, id), eq(books.authorId, authorId)));
  }

  async getAuthorGenres(
    authorId: number,
  ): Promise<{ genre: string; count: number }[]> {
    const books = await this.getBooksByAuthor(authorId);
    const genreCounts = new Map<string, number>();

    books.forEach((book) => {
      book.genres.forEach((genre) => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    });

    return Array.from(genreCounts.entries())
      .map(([genre, count]) => ({
        genre,
        count,
      }))
      .sort((a, b) => b.count - a.count);
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