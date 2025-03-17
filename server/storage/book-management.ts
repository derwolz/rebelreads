import { Book, Rating, ReadingStatus } from "@shared/schema";
import { books, ratings, reading_status } from "@shared/schema";
import { db } from "../db";
import { eq, and, inArray, ilike, sql } from "drizzle-orm";
import { BaseStorage } from "./base";

export interface IBookStorage {
  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  getBooksByAuthor(authorId: number): Promise<Book[]>;
  createBook(book: Omit<Book, "id">): Promise<Book>;
  promoteBook(id: number): Promise<Book>;
  updateBook(id: number, data: Partial<Book>): Promise<Book>;
  deleteBook(id: number, authorId: number): Promise<void>;
  
  // Rating related operations
  getRatings(bookId: number): Promise<Rating[]>;
  createRating(rating: Omit<Rating, "id">): Promise<Rating>;
  getUserRatings(userId: number): Promise<Rating[]>;
  
  // Reading status operations
  getReadingStatus(userId: number, bookId: number): Promise<ReadingStatus | undefined>;
  toggleWishlist(userId: number, bookId: number): Promise<ReadingStatus>;
  markAsCompleted(userId: number, bookId: number): Promise<ReadingStatus>;
  getWishlistedBooks(userId: number): Promise<Book[]>;
  getCompletedBooks(userId: number): Promise<Book[]>;
}

export class BookStorage extends BaseStorage implements IBookStorage {
  async getBooks(): Promise<Book[]> {
    return await db.select().from(books);
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

  async getRatings(bookId: number): Promise<Rating[]> {
    return await db
      .select({
        id: ratings.id,
        userId: ratings.userId,
        bookId: ratings.bookId,
        enjoyment: ratings.enjoyment,
        writing: ratings.writing,
        themes: ratings.themes,
        characters: ratings.characters,
        worldbuilding: ratings.worldbuilding,
        review: ratings.review,
        analysis: ratings.analysis,
        createdAt: ratings.createdAt,
        featured: ratings.featured,
        report_status: ratings.report_status,
        report_reason: ratings.report_reason
      })
      .from(ratings)
      .where(eq(ratings.bookId, bookId));
  }

  async createRating(rating: Omit<Rating, "id">): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getUserRatings(userId: number): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.userId, userId));
  }

  async getReadingStatus(
    userId: number,
    bookId: number,
  ): Promise<ReadingStatus | undefined> {
    const [status] = await db
      .select()
      .from(reading_status)
      .where(
        and(
          eq(reading_status.userId, userId),
          eq(reading_status.bookId, bookId),
        ),
      );
    return status;
  }

  async toggleWishlist(userId: number, bookId: number): Promise<ReadingStatus> {
    const existingStatus = await this.getReadingStatus(userId, bookId);

    if (existingStatus) {
      const [updated] = await db
        .update(reading_status)
        .set({ isWishlisted: !existingStatus.isWishlisted })
        .where(eq(reading_status.id, existingStatus.id))
        .returning();
      return updated;
    }

    const [status] = await db
      .insert(reading_status)
      .values({ userId, bookId, isWishlisted: true })
      .returning();
    return status;
  }

  async markAsCompleted(
    userId: number,
    bookId: number,
  ): Promise<ReadingStatus> {
    const existingStatus = await this.getReadingStatus(userId, bookId);

    if (existingStatus) {
      const [updated] = await db
        .update(reading_status)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          isWishlisted: false,
        })
        .where(eq(reading_status.id, existingStatus.id))
        .returning();
      return updated;
    }

    const [status] = await db
      .insert(reading_status)
      .values({
        userId,
        bookId,
        isCompleted: true,
        completedAt: new Date(),
      })
      .returning();
    return status;
  }

  async getWishlistedBooks(userId: number): Promise<Book[]> {
    const wishlistedBooks = await db
      .select()
      .from(books)
      .innerJoin(
        reading_status,
        and(
          eq(reading_status.bookId, books.id),
          eq(reading_status.userId, userId),
          eq(reading_status.isWishlisted, true),
        ),
      );
    return wishlistedBooks.map(({ books }) => books);
  }

  async getCompletedBooks(userId: number): Promise<Book[]> {
    const completedBooks = await db
      .select()
      .from(books)
      .innerJoin(
        reading_status,
        and(
          eq(reading_status.bookId, books.id),
          eq(reading_status.userId, userId),
          eq(reading_status.isCompleted, true),
        ),
      );
    return completedBooks.map(({ books }) => books);
  }
}

export const bookStorage = new BookStorage();
