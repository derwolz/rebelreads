import { User, Book, Rating, Bookshelf, InsertUser, UpdateProfile, calculateWeightedRating } from "@shared/schema";
import { users, books, ratings, bookshelves } from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { followers, Follower } from "@shared/schema";
import { sql } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<UpdateProfile>): Promise<User>;
  toggleAuthorStatus(id: number): Promise<User>;

  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  getBooksByAuthor(authorId: number): Promise<Book[]>;
  createBook(book: Omit<Book, "id">): Promise<Book>;
  promoteBook(id: number): Promise<Book>;
  updateBook(id: number, data: Partial<Book>): Promise<Book>;

  getRatings(bookId: number): Promise<Rating[]>;
  createRating(rating: Omit<Rating, "id">): Promise<Rating>;

  getBookshelf(userId: number): Promise<Bookshelf[]>;
  updateBookshelfStatus(userId: number, bookId: number, status: string): Promise<Bookshelf>;
  deleteBook(id: number, authorId: number): Promise<void>;

  sessionStore: session.Store;
  followAuthor(followerId: number, authorId: number): Promise<Follower>;
  unfollowAuthor(followerId: number, authorId: number): Promise<void>;
  isFollowing(followerId: number, authorId: number): Promise<boolean>;
  getFollowerCount(authorId: number): Promise<number>;
  getAuthorGenres(authorId: number): Promise<{ genre: string; count: number }[]>;
  getAuthorAggregateRatings(authorId: number): Promise<{
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  } | null>;
  getFollowedAuthorsBooks(userId: number): Promise<Book[]>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<UpdateProfile>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async toggleAuthorStatus(id: number): Promise<User> {
    const user = await this.getUser(id);
    const [updatedUser] = await db
      .update(users)
      .set({ isAuthor: !user?.isAuthor })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

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

  async deleteBook(id: number, authorId: number): Promise<void> {
    await db
      .delete(books)
      .where(and(eq(books.id, id), eq(books.authorId, authorId)));
  }

  async followAuthor(followerId: number, authorId: number): Promise<Follower> {
    const [follower] = await db
      .insert(followers)
      .values({ followerId, followingId: authorId })
      .returning();
    return follower;
  }

  async unfollowAuthor(followerId: number, authorId: number): Promise<void> {
    await db
      .delete(followers)
      .where(and(
        eq(followers.followerId, followerId),
        eq(followers.followingId, authorId)
      ));
  }

  async isFollowing(followerId: number, authorId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(followers)
      .where(and(
        eq(followers.followerId, followerId),
        eq(followers.followingId, authorId)
      ));
    return !!result;
  }

  async getFollowerCount(authorId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(followers)
      .where(eq(followers.followingId, authorId));
    return result?.count || 0;
  }

  async getAuthorGenres(authorId: number): Promise<{ genre: string; count: number }[]> {
    const books = await this.getBooksByAuthor(authorId);
    const genreCounts = new Map<string, number>();

    books.forEach(book => {
      book.genres.forEach(genre => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    });

    return Array.from(genreCounts.entries()).map(([genre, count]) => ({
      genre,
      count
    })).sort((a, b) => b.count - a.count);
  }

  async getAuthorAggregateRatings(authorId: number): Promise<{
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  } | null> {
    const authorBooks = await this.getBooksByAuthor(authorId);
    const bookIds = authorBooks.map(book => book.id);

    if (bookIds.length === 0) return null;

    const allRatings = await db
      .select()
      .from(ratings)
      .where(inArray(ratings.bookId, bookIds));

    if (allRatings.length === 0) return null;

    return {
      overall: allRatings.reduce((acc, r) => acc + calculateWeightedRating(r), 0) / allRatings.length,
      enjoyment: allRatings.reduce((acc, r) => acc + r.enjoyment, 0) / allRatings.length,
      writing: allRatings.reduce((acc, r) => acc + r.writing, 0) / allRatings.length,
      themes: allRatings.reduce((acc, r) => acc + r.themes, 0) / allRatings.length,
      characters: allRatings.reduce((acc, r) => acc + r.characters, 0) / allRatings.length,
      worldbuilding: allRatings.reduce((acc, r) => acc + r.worldbuilding, 0) / allRatings.length,
    };
  }

  async getFollowedAuthorsBooks(userId: number): Promise<Book[]> {
    const followedAuthors = await db
      .select({ authorId: followers.followingId })
      .from(followers)
      .where(eq(followers.followerId, userId));

    if (followedAuthors.length === 0) {
      return [];
    }

    const authorIds = followedAuthors.map(f => f.authorId);
    const followedAuthorsBooks = await db
      .select()
      .from(books)
      .where(inArray(books.authorId, authorIds));

    return followedAuthorsBooks;
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

    const sampleBooks: Omit<Book, "id">[] = [
      {
        title: "The Evolution of Everything",
        author: "Matt Ridley",
        description: "How ideas emerge and spread through society",
        coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73",
        authorImageUrl: "https://images.unsplash.com/photo-1733231291539-a1b0305c210a",
        authorId: 1,
        promoted: false,
        genres: ["fantasy"]
      },
      {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        description: "Timeless lessons on wealth, greed, and happiness",
        coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666",
        authorImageUrl: "https://images.unsplash.com/photo-1733231291455-3c4de1c24e20",
        authorId: 1,
        promoted: false,
        genres: ["fantasy"]
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
    const user = {
      ...insertUser,
      id,
      provider: null,
      providerId: null,
      newsletterOptIn: insertUser.newsletterOptIn ?? false,
    };
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
  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error("Method not implemented.");
  }
  async updateUser(id: number, data: Partial<UpdateProfile>): Promise<User> {
    throw new Error("Method not implemented.");
  }
  async toggleAuthorStatus(id: number): Promise<User> {
    throw new Error("Method not implemented.");
  }
  async getBooksByAuthor(authorId: number): Promise<Book[]> {
    throw new Error("Method not implemented.");
  }
  async createBook(book: Omit<Book, "id">): Promise<Book> {
    throw new Error("Method not implemented.");
  }
  async promoteBook(id: number): Promise<Book> {
    throw new Error("Method not implemented.");
  }
  async updateBook(id: number, data: Partial<Book>): Promise<Book> {
    throw new Error("Method not implemented.");
  }
  async deleteBook(id: number, authorId: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async followAuthor(followerId: number, authorId: number): Promise<Follower> {
    throw new Error("Method not implemented.");
  }
  async unfollowAuthor(followerId: number, authorId: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async isFollowing(followerId: number, authorId: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  async getFollowerCount(authorId: number): Promise<number> {
    throw new Error("Method not implemented.");
  }
  async getAuthorGenres(authorId: number): Promise<{ genre: string; count: number }[]> {
    throw new Error("Method not implemented.");
  }
  async getAuthorAggregateRatings(authorId: number): Promise<{ overall: number; enjoyment: number; writing: number; themes: number; characters: number; worldbuilding: number; } | null> {
    throw new Error("Method not implemented.");
  }
  async getFollowedAuthorsBooks(userId: number): Promise<Book[]> {
    throw new Error("Method not implemented.");
  }
}

import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);