import { User, Book, Rating, Bookshelf, InsertUser } from "@shared/schema";
import { users, books, ratings, bookshelves } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;

  getRatings(bookId: number): Promise<Rating[]>;
  createRating(rating: Omit<Rating, "id">): Promise<Rating>;

  getBookshelf(userId: number): Promise<Bookshelf[]>;
  updateBookshelfStatus(userId: number, bookId: number, status: string): Promise<Bookshelf>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getBooks(): Promise<Book[]> {
    return await db.select().from(books);
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async getRatings(bookId: number): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.bookId, bookId));
  }

  async createRating(rating: Omit<Rating, "id">): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getBookshelf(userId: number): Promise<Bookshelf[]> {
    return await db.select().from(bookshelves).where(eq(bookshelves.userId, userId));
  }

  async updateBookshelfStatus(userId: number, bookId: number, status: string): Promise<Bookshelf> {
    const [bookshelf] = await db
      .insert(bookshelves)
      .values({ userId, bookId, status })
      .returning();
    return bookshelf;
  }
}

export const storage = new DatabaseStorage();

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private ratings: Map<number, Rating>;
  private bookshelves: Map<number, Bookshelf>;
  sessionStore: session.Store;
  private currentId: Record<string, number>;

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.ratings = new Map();
    this.bookshelves = new Map();
    this.currentId = { users: 1, books: 1, ratings: 1, bookshelves: 1 };
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
    
    // Seed some initial books
    const sampleBooks: Omit<Book, "id">[] = [
      {
        title: "The Evolution of Everything",
        author: "Matt Ridley",
        description: "How ideas emerge and spread through society",
        coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73",
        authorImageUrl: "https://images.unsplash.com/photo-1733231291539-a1b0305c210a"
      },
      {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        description: "Timeless lessons on wealth, greed, and happiness",
        coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666",
        authorImageUrl: "https://images.unsplash.com/photo-1733231291455-3c4de1c24e20"
      }
    ];

    sampleBooks.forEach((book) => {
      const id = this.currentId.books++;
      this.books.set(id, { ...book, id });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async getRatings(bookId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(r => r.bookId === bookId);
  }

  async createRating(rating: Omit<Rating, "id">): Promise<Rating> {
    const id = this.currentId.ratings++;
    const newRating = { ...rating, id };
    this.ratings.set(id, newRating);
    return newRating;
  }

  async getBookshelf(userId: number): Promise<Bookshelf[]> {
    return Array.from(this.bookshelves.values()).filter(b => b.userId === userId);
  }

  async updateBookshelfStatus(userId: number, bookId: number, status: string): Promise<Bookshelf> {
    const id = this.currentId.bookshelves++;
    const bookshelf = { id, userId, bookId, status };
    this.bookshelves.set(id, bookshelf);
    return bookshelf;
  }
}

import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);