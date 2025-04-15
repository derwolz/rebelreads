import {
  Publisher,
  InsertPublisher,
  PublisherAuthor,
  PublisherSeller,
  InsertPublisherSeller,
  User,
  Author,
  publishers,
  publishersAuthors,
  publisherSellers,
  users,
  authors,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IPublisherStorage {
  getPublishers(): Promise<Publisher[]>;
  getPublisher(id: number): Promise<Publisher | undefined>;
  getPublisherByUserId(userId: number): Promise<Publisher | undefined>;
  createPublisher(publisher: InsertPublisher): Promise<Publisher>;
  getPublisherAuthors(publisherId: number): Promise<Author[]>;
  addAuthorToPublisher(publisherId: number, authorId: number, contractStart: Date): Promise<PublisherAuthor>;
  removeAuthorFromPublisher(publisherId: number, authorId: number): Promise<void>;
  getAuthorPublisher(authorId: number): Promise<Publisher | undefined>;
  isUserPublisher(userId: number): Promise<boolean>;
  updatePublisher(id: number, publisher: Partial<InsertPublisher>): Promise<Publisher>;
  
  // Publisher seller methods
  createPublisherSeller(seller: InsertPublisherSeller): Promise<PublisherSeller>;
  getPublisherSeller(id: number): Promise<PublisherSeller | undefined>;
  getPublisherSellerByUserId(userId: number): Promise<PublisherSeller | undefined>;
  getPublisherSellerByEmail(email: string): Promise<PublisherSeller | undefined>;
  getPublisherSellerByVerificationCode(code: string): Promise<PublisherSeller | undefined>;
  updatePublisherSeller(id: number, seller: Partial<InsertPublisherSeller>): Promise<PublisherSeller>;
  isPublisherSeller(userId: number): Promise<boolean>;
  generateVerificationCode(userId: number): Promise<string>;
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

  async getPublisherAuthors(publisherId: number): Promise<Author[]> {
    const result = await db
      .select({
        author: authors,
      })
      .from(publishersAuthors)
      .where(
        and(
          eq(publishersAuthors.publisherId, publisherId),
          isNull(publishersAuthors.contractEnd)
        )
      )
      .innerJoin(authors, eq(authors.id, publishersAuthors.authorId));

    return result.map((r: { author: Author }) => r.author);
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

  // Publisher seller methods
  async createPublisherSeller(seller: InsertPublisherSeller): Promise<PublisherSeller> {
    // Generate a verification code if not provided
    if (!seller.verification_code) {
      seller.verification_code = nanoid(12); // 12-character unique code
    }
    
    const [newSeller] = await db
      .insert(publisherSellers)
      .values(seller)
      .returning();
    
    return newSeller;
  }
  
  async getPublisherSeller(id: number): Promise<PublisherSeller | undefined> {
    const [seller] = await db
      .select()
      .from(publisherSellers)
      .where(eq(publisherSellers.id, id));
    
    return seller;
  }
  
  async getPublisherSellerByUserId(userId: number): Promise<PublisherSeller | undefined> {
    const [seller] = await db
      .select()
      .from(publisherSellers)
      .where(eq(publisherSellers.userId, userId));
    
    return seller;
  }
  
  async getPublisherSellerByEmail(email: string): Promise<PublisherSeller | undefined> {
    const [seller] = await db
      .select()
      .from(publisherSellers)
      .where(eq(publisherSellers.email, email));
    
    return seller;
  }
  
  async getPublisherSellerByVerificationCode(code: string): Promise<PublisherSeller | undefined> {
    const [seller] = await db
      .select()
      .from(publisherSellers)
      .where(eq(publisherSellers.verification_code, code));
    
    return seller;
  }
  
  async updatePublisherSeller(id: number, seller: Partial<InsertPublisherSeller>): Promise<PublisherSeller> {
    const [updatedSeller] = await db
      .update(publisherSellers)
      .set({
        ...seller,
        updatedAt: new Date() // Always update the timestamp
      })
      .where(eq(publisherSellers.id, id))
      .returning();
    
    return updatedSeller;
  }
  
  async isPublisherSeller(userId: number): Promise<boolean> {
    const seller = await this.getPublisherSellerByUserId(userId);
    return !!seller && seller.status === "active";
  }
  
  async generateVerificationCode(userId: number): Promise<string> {
    const seller = await this.getPublisherSellerByUserId(userId);
    if (!seller) {
      throw new Error("Seller not found");
    }
    
    // Generate a new verification code
    const verification_code = nanoid(12);
    
    // Update the seller with the new code
    await this.updatePublisherSeller(seller.id, { verification_code });
    
    return verification_code;
  }
}
