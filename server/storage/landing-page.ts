import {
  LandingSession,
  InsertLandingEvent,
  LandingEvent,
  SignupInterest,
  InsertSignupInterest,
  PartnershipInquiry,
  InsertPartnershipInquiry,
  landing_sessions,
  landing_events,
  signup_interests,
  partnership_inquiries
} from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export interface ILandingPageStorage {
  createLandingSession(sessionId: string, deviceInfo: any): Promise<LandingSession>;
  updateLandingSession(sessionId: string, data: Partial<LandingSession>): Promise<LandingSession>;
  endLandingSession(sessionId: string): Promise<LandingSession>;
  recordLandingEvent(event: InsertLandingEvent): Promise<LandingEvent>;
  getLandingSession(sessionId: string): Promise<LandingSession | undefined>;
  
  createSignupInterest(data: InsertSignupInterest): Promise<SignupInterest>;
  getSignupInterests(): Promise<SignupInterest[]>;
  
  createPartnershipInquiry(data: InsertPartnershipInquiry): Promise<PartnershipInquiry>;
  getPartnershipInquiries(): Promise<PartnershipInquiry[]>;
}

export class LandingPageStorage implements ILandingPageStorage {
  async createLandingSession(sessionId: string, deviceInfo: any): Promise<LandingSession> {
    const [session] = await db
      .insert(landing_sessions)
      .values({
        sessionId,
        deviceInfo,
      })
      .returning();
    return session;
  }

  async updateLandingSession(sessionId: string, data: Partial<LandingSession>): Promise<LandingSession> {
    const [session] = await db
      .update(landing_sessions)
      .set(data)
      .where(eq(landing_sessions.sessionId, sessionId))
      .returning();
    return session;
  }

  async endLandingSession(sessionId: string): Promise<LandingSession> {
    const session = await this.getLandingSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const [updatedSession] = await db
      .update(landing_sessions)
      .set({
        endTime: new Date(),
        timeSpentSeconds: Math.floor(
          (Date.now() - session.startTime.getTime()) / 1000
        ),
      })
      .where(eq(landing_sessions.sessionId, sessionId))
      .returning();
    return updatedSession;
  }

  async recordLandingEvent(event: InsertLandingEvent): Promise<LandingEvent> {
    const [landingEvent] = await db
      .insert(landing_events)
      .values(event)
      .returning();
    return landingEvent;
  }

  async getLandingSession(sessionId: string): Promise<LandingSession | undefined> {
    const [session] = await db
      .select()
      .from(landing_sessions)
      .where(eq(landing_sessions.sessionId, sessionId));
    return session;
  }

  async createSignupInterest(data: InsertSignupInterest): Promise<SignupInterest> {
    // Ensure email is stored in lowercase
    const normalizedData = {
      ...data,
      email: data.email.toLowerCase()
    };
    
    // Now that we've properly defined isAuthor in the schema, we can use drizzle's standard insert
    const [interest] = await db
      .insert(signup_interests)
      .values(normalizedData)
      .returning();
    return interest;
  }

  async getSignupInterests(): Promise<SignupInterest[]> {
    return await db.select().from(signup_interests);
  }

  async createPartnershipInquiry(data: InsertPartnershipInquiry): Promise<PartnershipInquiry> {
    // Ensure email is stored in lowercase
    const normalizedData = {
      ...data,
      email: data.email.toLowerCase()
    };
    
    const [inquiry] = await db
      .insert(partnership_inquiries)
      .values(normalizedData)
      .returning();
    return inquiry;
  }

  async getPartnershipInquiries(): Promise<PartnershipInquiry[]> {
    return await db.select().from(partnership_inquiries);
  }
}