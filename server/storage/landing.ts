import {
  LandingSession,
  InsertLandingEvent,
  LandingEvent,
  SignupInterest,
  InsertSignupInterest,
  PartnershipInquiry,
  InsertPartnershipInquiry
} from "@shared/schema";
import {
  landing_sessions,
  landing_events,
  signup_interests,
  partnership_inquiries
} from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { BaseStorage } from "./base";

export interface ILandingStorage {
  // Landing session methods
  createLandingSession(sessionId: string, deviceInfo: any): Promise<LandingSession>;
  updateLandingSession(sessionId: string, data: Partial<LandingSession>): Promise<LandingSession>;
  endLandingSession(sessionId: string): Promise<LandingSession>;
  recordLandingEvent(event: InsertLandingEvent): Promise<LandingEvent>;
  getLandingSession(sessionId: string): Promise<LandingSession | undefined>;

  // Signup interest methods
  createSignupInterest(data: InsertSignupInterest): Promise<SignupInterest>;
  getSignupInterests(): Promise<SignupInterest[]>;

  // Partnership inquiry methods
  createPartnershipInquiry(data: InsertPartnershipInquiry): Promise<PartnershipInquiry>;
  getPartnershipInquiries(): Promise<PartnershipInquiry[]>;
}

export class LandingStorage extends BaseStorage implements ILandingStorage {
  async createLandingSession(sessionId: string, deviceInfo: any): Promise<LandingSession> {
    const [session] = await db
      .insert(landing_sessions)
      .values({
        sessionId,
        deviceInfo,
        startTime: new Date(),
      })
      .returning();
    return session;
  }

  async updateLandingSession(sessionId: string, data: Partial<LandingSession>): Promise<LandingSession> {
    const [session] = await db
      .update(landing_sessions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(landing_sessions.sessionId, sessionId))
      .returning();
    return session;
  }

  async endLandingSession(sessionId: string): Promise<LandingSession> {
    const [session] = await db
      .update(landing_sessions)
      .set({
        endTime: new Date(),
      })
      .where(eq(landing_sessions.sessionId, sessionId))
      .returning();
    return session;
  }

  async recordLandingEvent(event: InsertLandingEvent): Promise<LandingEvent> {
    const [landingEvent] = await db
      .insert(landing_events)
      .values({
        ...event,
        timestamp: new Date(),
      })
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
    const [signupInterest] = await db
      .insert(signup_interests)
      .values(data)
      .returning();
    return signupInterest;
  }

  async getSignupInterests(): Promise<SignupInterest[]> {
    return await db.select().from(signup_interests);
  }

  async createPartnershipInquiry(data: InsertPartnershipInquiry): Promise<PartnershipInquiry> {
    const [inquiry] = await db
      .insert(partnership_inquiries)
      .values(data)
      .returning();
    return inquiry;
  }

  async getPartnershipInquiries(): Promise<PartnershipInquiry[]> {
    return await db.select().from(partnership_inquiries);
  }
}

export const landingStorage = new LandingStorage();