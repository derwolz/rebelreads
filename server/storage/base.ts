import { User, InsertUser, UpdateProfile } from "@shared/schema";
import { users } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "../db";

const PostgresSessionStore = connectPg(session);

// Base storage interface that will be extended by other interfaces
export interface IBaseStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<UpdateProfile>): Promise<User>;
  toggleAuthorStatus(id: number): Promise<User>;
  sessionStore: session.Store;
}

// Base storage implementation
export class BaseStorage implements IBaseStorage {
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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
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
}

// Create and export the base storage instance
export const baseStorage = new BaseStorage();
