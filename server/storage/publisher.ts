import {
  Publisher,
  InsertPublisher,
  PublisherAuthor,
  User,
  publishers,
  publishersAuthors,
  users,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, isNull } from "drizzle-orm";

export interface IPublisherStorage {
  getPublishers(): Promise<Publisher[]>;
  getPublisher(id: number): Promise<Publisher | undefined>;
  getPublisherByUserId(userId: number): Promise<Publisher | undefined>;
  createPublisher(publisher: InsertPublisher): Promise<Publisher>;
  getPublisherAuthors(publisherId: number): Promise<User[]>;
  addAuthorToPublisher(publisherId: number, authorId: number, contractStart: Date): Promise<PublisherAuthor>;
  removeAuthorFromPublisher(publisherId: number, authorId: number): Promise<void>;
  getAuthorPublisher(authorId: number): Promise<Publisher | undefined>;
  isUserPublisher(userId: number): Promise<boolean>;
  updatePublisher(id: number, publisher: Partial<InsertPublisher>): Promise<Publisher>;
}

export class PublisherStorage implements IPublisherStorage {
  async getPublishers(): Promise<Publisher[]> {
    return await db.select().from(publishers);
  }

  async getPublisher(id: number): Promise<Publisher | undefined> {
    const [publisher] = await db
      .select()
      .from(publishers)
      .where(eq(publishers.id, id));
    return publisher;
  }

  async getPublisherByUserId(userId: number): Promise<Publisher | undefined> {
    const [publisher] = await db
      .select()
      .from(publishers)
      .where(eq(publishers.userId, userId));
    return publisher;
  }

  async createPublisher(publisher: InsertPublisher): Promise<Publisher> {
    const [newPublisher] = await db
      .insert(publishers)
      .values(publisher)
      .returning();
    return newPublisher;
  }

  async isUserPublisher(userId: number): Promise<boolean> {
    const publisher = await this.getPublisherByUserId(userId);
    return !!publisher;
  }

  async updatePublisher(id: number, publisher: Partial<InsertPublisher>): Promise<Publisher> {
    const [updatedPublisher] = await db
      .update(publishers)
      .set(publisher)
      .where(eq(publishers.id, id))
      .returning();
    return updatedPublisher;
  }

  async getPublisherAuthors(publisherId: number): Promise<User[]> {
    const result = await db
      .select({
        user: users,
      })
      .from(publishersAuthors)
      .where(eq(publishersAuthors.publisherId, publisherId))
      .innerJoin(users, eq(users.id, publishersAuthors.authorId))
      .where(isNull(publishersAuthors.contractEnd));

    return result.map(r => r.user);
  }

  async addAuthorToPublisher(
    publisherId: number,
    authorId: number,
    contractStart: Date
  ): Promise<PublisherAuthor> {
    const [relation] = await db
      .insert(publishersAuthors)
      .values({
        publisherId,
        authorId,
        contractStart,
      })
      .returning();
    return relation;
  }

  async removeAuthorFromPublisher(
    publisherId: number,
    authorId: number
  ): Promise<void> {
    await db
      .update(publishersAuthors)
      .set({
        contractEnd: new Date(),
      })
      .where(
        and(
          eq(publishersAuthors.publisherId, publisherId),
          eq(publishersAuthors.authorId, authorId),
          isNull(publishersAuthors.contractEnd)
        )
      );
  }

  async getAuthorPublisher(authorId: number): Promise<Publisher | undefined> {
    const [result] = await db
      .select({
        publisher: publishers,
      })
      .from(publishersAuthors)
      .where(
        and(
          eq(publishersAuthors.authorId, authorId),
          isNull(publishersAuthors.contractEnd)
        )
      )
      .innerJoin(
        publishers,
        eq(publishers.id, publishersAuthors.publisherId)
      );

    return result?.publisher;
  }
}
