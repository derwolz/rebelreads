import { FeedbackTicket, InsertFeedbackTicket, feedbackTickets } from "@shared/schema";
import { db } from "../db";
import { eq, and, ne } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Interface for feedback ticket storage operations
 */
export interface IFeedbackStorage {
  createFeedbackTicket(data: InsertFeedbackTicket, userId?: number): Promise<FeedbackTicket>;
  getFeedbackTickets(): Promise<FeedbackTicket[]>;
  getFeedbackTicket(id: number): Promise<FeedbackTicket | undefined>;
  getFeedbackTicketByNumber(ticketNumber: string): Promise<FeedbackTicket | undefined>;
  updateFeedbackTicket(id: number, updates: Partial<FeedbackTicket>): Promise<FeedbackTicket | undefined>;
  getUserFeedbackTickets(userId: number): Promise<FeedbackTicket[]>;
  getNewTickets(): Promise<FeedbackTicket[]>;
  getResolvedTickets(): Promise<FeedbackTicket[]>;
}

/**
 * Implementation of feedback ticket storage
 */
export class FeedbackStorage implements IFeedbackStorage {
  /**
   * Create a new feedback ticket
   * @param data Ticket data
   * @param userId Optional user ID if authenticated
   * @returns The created ticket
   */
  async createFeedbackTicket(data: InsertFeedbackTicket, userId?: number): Promise<FeedbackTicket> {
    // Generate a unique ticket number using nanoid - 6 characters is enough
    const ticketNumber = nanoid(6).toUpperCase();
    
    const result = await db.insert(feedbackTickets).values({
      ...data,
      ticketNumber,
      userId: userId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return result[0];
  }
  
  /**
   * Get all feedback tickets
   * @returns Array of all feedback tickets
   */
  async getFeedbackTickets(): Promise<FeedbackTicket[]> {
    return db.select().from(feedbackTickets).orderBy(feedbackTickets.createdAt);
  }
  
  /**
   * Get a single feedback ticket by ID
   * @param id Ticket ID
   * @returns The ticket or undefined if not found
   */
  async getFeedbackTicket(id: number): Promise<FeedbackTicket | undefined> {
    const result = await db
      .select()
      .from(feedbackTickets)
      .where(eq(feedbackTickets.id, id));
    
    return result[0];
  }
  
  /**
   * Get a single feedback ticket by its ticket number
   * @param ticketNumber The unique ticket number
   * @returns The ticket or undefined if not found
   */
  async getFeedbackTicketByNumber(ticketNumber: string): Promise<FeedbackTicket | undefined> {
    const result = await db
      .select()
      .from(feedbackTickets)
      .where(eq(feedbackTickets.ticketNumber, ticketNumber));
    
    return result[0];
  }
  
  /**
   * Update a feedback ticket
   * @param id Ticket ID
   * @param updates Partial ticket data to update
   * @returns The updated ticket or undefined if not found
   */
  async updateFeedbackTicket(id: number, updates: Partial<FeedbackTicket>): Promise<FeedbackTicket | undefined> {
    // Set the updatedAt timestamp
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    };
    
    // If resolving the ticket, set the resolvedAt timestamp
    if (updates.status === "resolved" && !updates.resolvedAt) {
      updatedData.resolvedAt = new Date();
    }
    
    const result = await db
      .update(feedbackTickets)
      .set(updatedData)
      .where(eq(feedbackTickets.id, id))
      .returning();
    
    return result[0];
  }
  
  /**
   * Get all feedback tickets for a specific user
   * @param userId User ID
   * @returns Array of the user's feedback tickets
   */
  async getUserFeedbackTickets(userId: number): Promise<FeedbackTicket[]> {
    return db
      .select()
      .from(feedbackTickets)
      .where(eq(feedbackTickets.userId, userId))
      .orderBy(feedbackTickets.createdAt);
  }
  
  /**
   * Get all new (unresolved) tickets
   * @returns Array of new tickets
   */
  async getNewTickets(): Promise<FeedbackTicket[]> {
    return db
      .select()
      .from(feedbackTickets)
      .where(eq(feedbackTickets.status, "new"))
      .orderBy(feedbackTickets.createdAt);
  }
  
  /**
   * Get all resolved tickets
   * @returns Array of resolved tickets
   */
  async getResolvedTickets(): Promise<FeedbackTicket[]> {
    return db
      .select()
      .from(feedbackTickets)
      .where(
        and(
          eq(feedbackTickets.status, "resolved"),
          ne(feedbackTickets.resolvedAt, null)
        )
      )
      .orderBy(feedbackTickets.resolvedAt);
  }
}

/**
 * Singleton instance of FeedbackStorage
 */
export const feedbackStorage = new FeedbackStorage();