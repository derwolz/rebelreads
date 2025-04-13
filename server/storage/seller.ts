import { db } from "../db";
import { eq } from "drizzle-orm";
import { Seller, InsertSeller, sellers, PublisherSeller, InsertPublisherSeller, publisherSellers } from "../../shared/schema";
import { nanoid } from "nanoid";

export interface ISellerStorage {
  isUserSeller(userId: number): Promise<boolean>;
  getSellerByUserId(userId: number): Promise<Seller | null>;
  getSellerById(sellerId: number): Promise<Seller | null>;
  createSeller(data: InsertSeller): Promise<Seller | null>;
  updateSeller(sellerId: number, data: Partial<InsertSeller>): Promise<Seller | null>;
  getAllActiveSellers(): Promise<Seller[]>;
  createPublisherSellerVerificationCode(sellerId: number): Promise<PublisherSeller | null>;
  getPublisherSellerByVerificationCode(code: string): Promise<PublisherSeller | null>;
  getSellerDetailsByVerificationCode(code: string): Promise<Seller | null>;
}

export class SellerStorage {
  /**
   * Check if a user is a seller
   * @param userId The user ID to check
   * @returns True if the user is a seller, false otherwise
   */
  async isUserSeller(userId: number): Promise<boolean> {
    if (!userId) return false;
    
    try {
      const result = await db.select({ id: sellers.id })
        .from(sellers)
        .where(eq(sellers.userId, userId))
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if user is a seller:", error);
      return false;
    }
  }
  
  /**
   * Get a seller by user ID
   * @param userId The user ID to check
   * @returns The seller object if found, null otherwise
   */
  async getSellerByUserId(userId: number): Promise<Seller | null> {
    if (!userId) return null;
    
    try {
      const result = await db.select()
        .from(sellers)
        .where(eq(sellers.userId, userId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error("Error getting seller by user ID:", error);
      return null;
    }
  }
  
  /**
   * Get a seller by ID
   * @param sellerId The seller ID to look up
   * @returns The seller object if found, null otherwise
   */
  async getSellerById(sellerId: number): Promise<Seller | null> {
    if (!sellerId) return null;
    
    try {
      const result = await db.select()
        .from(sellers)
        .where(eq(sellers.id, sellerId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error("Error getting seller by ID:", error);
      return null;
    }
  }
  
  /**
   * Create a new seller
   * @param data The seller data to insert
   * @returns The created seller
   */
  async createSeller(data: InsertSeller): Promise<Seller | null> {
    try {
      const result = await db.insert(sellers).values(data).returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error creating seller:", error);
      return null;
    }
  }
  
  /**
   * Update a seller
   * @param sellerId The ID of the seller to update
   * @param data The seller data to update
   * @returns The updated seller
   */
  async updateSeller(sellerId: number, data: Partial<InsertSeller>): Promise<Seller | null> {
    try {
      const result = await db.update(sellers)
        .set(data)
        .where(eq(sellers.id, sellerId))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error("Error updating seller:", error);
      return null;
    }
  }
  
  /**
   * Get all active sellers
   * @returns Array of all active sellers
   */
  async getAllActiveSellers(): Promise<Seller[]> {
    try {
      const result = await db.select()
        .from(sellers)
        .where(eq(sellers.status, "active"));
      
      return result;
    } catch (error) {
      console.error("Error getting all active sellers:", error);
      return [];
    }
  }
  
  /**
   * Create a publisher seller verification code
   * @param sellerId The ID of the seller
   * @returns The created publisher seller verification code object
   */
  async createPublisherSellerVerificationCode(sellerId: number): Promise<PublisherSeller | null> {
    try {
      // Generate a unique verification code
      const verificationCode = nanoid(12);
      
      const data: InsertPublisherSeller = {
        sellerId,
        verification_code: verificationCode
      };
      
      const result = await db.insert(publisherSellers)
        .values(data)
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error("Error creating publisher seller verification code:", error);
      return null;
    }
  }
  
  /**
   * Get publisher seller by verification code
   * @param code The verification code
   * @returns The publisher seller object if found, null otherwise
   */
  async getPublisherSellerByVerificationCode(code: string): Promise<PublisherSeller | null> {
    if (!code) return null;
    
    try {
      const result = await db.select()
        .from(publisherSellers)
        .where(eq(publisherSellers.verification_code, code))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error("Error getting publisher seller by verification code:", error);
      return null;
    }
  }
  
  /**
   * Get seller details from a verification code
   * This joins the publisher_sellers and sellers tables to get full details
   * @param code The verification code
   * @returns The full seller details if found, null otherwise
   */
  async getSellerDetailsByVerificationCode(code: string): Promise<Seller | null> {
    if (!code) return null;
    
    try {
      // First get the publisher seller record
      const publisherSellerResult = await db.select()
        .from(publisherSellers)
        .where(eq(publisherSellers.verification_code, code))
        .limit(1);
      
      if (!publisherSellerResult.length) return null;
      
      const publisherSeller = publisherSellerResult[0];
      
      // Then get the seller record
      const sellerResult = await db.select()
        .from(sellers)
        .where(eq(sellers.id, publisherSeller.sellerId))
        .limit(1);
      
      return sellerResult[0] || null;
    } catch (error) {
      console.error("Error getting seller details by verification code:", error);
      return null;
    }
  }
}