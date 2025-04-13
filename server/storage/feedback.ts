import { 
  feedbackTickets, 
  type FeedbackTicket,
  type InsertFeedbackTicket,
  FEEDBACK_STATUS_OPTIONS
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { nanoid } from 'nanoid';

export interface IFeedbackStorage {
  createFeedbackTicket(
    data: InsertFeedbackTicket,
    userId?: number
  ): Promise<FeedbackTicket>;
  
  getFeedbackTickets(): Promise<FeedbackTicket[]>;
  
  getFeedbackTicket(id: number): Promise<FeedbackTicket | undefined>;
  
  getFeedbackTicketByNumber(ticketNumber: string): Promise<FeedbackTicket | undefined>;
  
  updateFeedbackTicket(
    id: number,
    data: Partial<Omit<FeedbackTicket, 'id' | 'ticketNumber' | 'createdAt'>>
  ): Promise<FeedbackTicket>;
  
  getUserFeedbackTickets(userId: number): Promise<FeedbackTicket[]>;
  
  getNewTickets(): Promise<FeedbackTicket[]>;
  
  getResolvedTickets(): Promise<FeedbackTicket[]>;
}

export class FeedbackStorage implements IFeedbackStorage {
  
  // Generate a unique ticket number with prefix FDB-
  private generateTicketNumber(): string {
    return `FDB-${nanoid(8).toUpperCase()}`;
  }
  
  async createFeedbackTicket(
    data: InsertFeedbackTicket,
    userId?: number
  ): Promise<FeedbackTicket> {
    const [ticket] = await db
      .insert(feedbackTickets)
      .values({
        ticketNumber: this.generateTicketNumber(),
        userId: userId || null,
        type: data.type,
        title: data.title,
        description: data.description,
        status: data.status || 'new',
        priority: data.priority || 1,
        deviceInfo: data.deviceInfo || null,
      })
      .returning();
    
    return ticket;
  }
  
  async getFeedbackTickets(): Promise<FeedbackTicket[]> {
    const tickets = await db
      .select()
      .from(feedbackTickets)
      .orderBy(desc(feedbackTickets.createdAt));
    
    return tickets;
  }
  
  async getFeedbackTicket(id: number): Promise<FeedbackTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(feedbackTickets)
      .where(eq(feedbackTickets.id, id));
    
    return ticket;
  }
  
  async getFeedbackTicketByNumber(ticketNumber: string): Promise<FeedbackTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(feedbackTickets)
      .where(eq(feedbackTickets.ticketNumber, ticketNumber));
    
    return ticket;
  }
  
  async updateFeedbackTicket(
    id: number,
    data: Partial<Omit<FeedbackTicket, 'id' | 'ticketNumber' | 'createdAt'>>
  ): Promise<FeedbackTicket> {
    // Always update the updatedAt field
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // If the status is being set to resolved, also set resolvedAt
    if (data.status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
    
    const [updatedTicket] = await db
      .update(feedbackTickets)
      .set(updateData)
      .where(eq(feedbackTickets.id, id))
      .returning();
    
    return updatedTicket;
  }
  
  async getUserFeedbackTickets(userId: number): Promise<FeedbackTicket[]> {
    const tickets = await db
      .select()
      .from(feedbackTickets)
      .where(eq(feedbackTickets.userId, userId))
      .orderBy(desc(feedbackTickets.createdAt));
    
    return tickets;
  }
  
  async getNewTickets(): Promise<FeedbackTicket[]> {
    const tickets = await db
      .select()
      .from(feedbackTickets)
      .where(eq(feedbackTickets.status, 'new'))
      .orderBy(desc(feedbackTickets.createdAt));
    
    return tickets;
  }
  
  async getResolvedTickets(): Promise<FeedbackTicket[]> {
    const tickets = await db
      .select()
      .from(feedbackTickets)
      .where(eq(feedbackTickets.status, 'resolved'))
      .orderBy(desc(feedbackTickets.createdAt));
    
    return tickets;
  }
}

// Create a singleton instance
export const feedbackStorage = new FeedbackStorage();