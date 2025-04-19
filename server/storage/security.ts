import { db } from "../db";
import { 
  VerificationCode,
  InsertVerificationCode,
  verificationCodes,
  trustedDevices,
  TrustedDevice,
  InsertTrustedDevice
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface ISecurityStorage {
  // Verification codes
  createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode>;
  getActiveVerificationCode(userId: number, type: string): Promise<VerificationCode | undefined>;
  markVerificationCodeAsUsed(codeId: number): Promise<boolean>;
  invalidateVerificationCodes(userId: number, type: string): Promise<boolean>;
  
  // Trusted devices
  addTrustedDevice(userId: number, device: InsertTrustedDevice): Promise<TrustedDevice>;
  getTrustedDevicesForUser(userId: number): Promise<TrustedDevice[]>;
  removeTrustedDevice(deviceId: number): Promise<boolean>;
  updateTrustedDeviceLastUsed(deviceId: number): Promise<boolean>;
}

export class SecurityStorage implements ISecurityStorage {
  // Verification codes
  async createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode> {
    const [result] = await db.insert(verificationCodes).values(code).returning();
    return result;
  }

  async getActiveVerificationCode(userId: number, type: string): Promise<VerificationCode | undefined> {
    // Get the most recent, non-expired, unused verification code for this user and type
    const [code] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.type, type),
          eq(verificationCodes.isUsed, false)
        )
      )
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1);
    
    return code;
  }

  async markVerificationCodeAsUsed(codeId: number): Promise<boolean> {
    const now = new Date();
    try {
      await db
        .update(verificationCodes)
        .set({ isUsed: true, usedAt: now })
        .where(eq(verificationCodes.id, codeId));
      return true;
    } catch (error) {
      console.error("Error marking verification code as used:", error);
      return false;
    }
  }

  async invalidateVerificationCodes(userId: number, type: string): Promise<boolean> {
    try {
      await db
        .update(verificationCodes)
        .set({ isUsed: true })
        .where(
          and(
            eq(verificationCodes.userId, userId),
            eq(verificationCodes.type, type),
            eq(verificationCodes.isUsed, false)
          )
        );
      return true;
    } catch (error) {
      console.error("Error invalidating verification codes:", error);
      return false;
    }
  }
  
  // Trusted devices
  async addTrustedDevice(userId: number, device: InsertTrustedDevice): Promise<TrustedDevice> {
    const [result] = await db.insert(trustedDevices).values({
      ...device,
      userId,
    }).returning();
    return result;
  }

  async getTrustedDevicesForUser(userId: number): Promise<TrustedDevice[]> {
    return db
      .select()
      .from(trustedDevices)
      .where(eq(trustedDevices.userId, userId));
  }

  async removeTrustedDevice(deviceId: number): Promise<boolean> {
    try {
      await db
        .delete(trustedDevices)
        .where(eq(trustedDevices.id, deviceId));
      return true;
    } catch (error) {
      console.error("Error removing trusted device:", error);
      return false;
    }
  }

  async updateTrustedDeviceLastUsed(deviceId: number): Promise<boolean> {
    const now = new Date();
    try {
      await db
        .update(trustedDevices)
        .set({ lastUsed: now })
        .where(eq(trustedDevices.id, deviceId));
      return true;
    } catch (error) {
      console.error("Error updating trusted device last used:", error);
      return false;
    }
  }
}