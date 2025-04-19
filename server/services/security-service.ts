import { Request } from 'express';
import { db } from '../db';
import { users, verificationCodes } from '@shared/schema';
import { verificationService, VERIFICATION_TYPES } from './verification-service';
import { eq, and } from 'drizzle-orm';

/**
 * Service for handling security operations like browser fingerprinting
 */
export class SecurityService {
  private static instance: SecurityService;

  private constructor() {}

  /**
   * Gets the singleton instance of SecurityService
   */
  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Get the IP address from the request object
   * @param req Express request object
   * @returns IP address string
   */
  public getIpAddress(req: Request): string {
    // Get IP from X-Forwarded-For header or from connection
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded 
      ? forwarded.split(',')[0] 
      : req.socket.remoteAddress || 'unknown';
    return ip;
  }

  /**
   * Get user agent string from request
   * @param req Express request object
   * @returns User agent string
   */
  public getUserAgent(req: Request): string {
    return req.headers['user-agent'] || 'unknown';
  }

  /**
   * Create a fingerprint for the client
   * @param req Express request object
   * @returns Fingerprint object
   */
  public createFingerprint(req: Request): { ipAddress: string; userAgent: string } {
    return {
      ipAddress: this.getIpAddress(req),
      userAgent: this.getUserAgent(req)
    };
  }

  /**
   * Check if verification is needed based on the client fingerprint
   * @param userId User ID
   * @param req Express request object
   * @returns True if verification needed, false otherwise
   */
  public async isVerificationNeeded(userId: number, req: Request): Promise<boolean> {
    try {
      // Get user record
      const userResults = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!userResults.length) {
        console.error('User not found:', userId);
        return true; // Require verification if user not found for safety
      }
      
      // Get finger print info
      const fingerprint = this.createFingerprint(req);
      
      // Get most recent successful verification codes for this user
      const successfulVerifications = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.userId, userId),
            eq(verificationCodes.type, VERIFICATION_TYPES.LOGIN_VERIFICATION),
            eq(verificationCodes.isUsed, true),
            eq(verificationCodes.ipAddress, fingerprint.ipAddress),
            eq(verificationCodes.userAgent, fingerprint.userAgent)
          )
        )
        .orderBy(verificationCodes.usedAt, 'desc')
        .limit(1);
      
      // If we found a matching verification from this device/location, no need to verify again
      if (successfulVerifications.length > 0) {
        // If the verification is recent (within last 30 days), no need to verify again
        const lastVerification = successfulVerifications[0];
        const lastVerifiedDate = lastVerification.usedAt;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (lastVerifiedDate && lastVerifiedDate > thirtyDaysAgo) {
          return false; // No verification needed if verified within last 30 days
        }
      }
      
      // In all other cases, verification is needed
      return true;
    } catch (error) {
      console.error('Error checking if verification needed:', error);
      return true; // Default to requiring verification on error
    }
  }

  /**
   * Send a verification code for login from new device/location
   * @param userId User ID
   * @param email User email
   * @param req Express request object
   * @returns True if successfully sent, false otherwise
   */
  public async sendLoginVerification(userId: number, email: string, req: Request): Promise<boolean> {
    try {
      const fingerprint = this.createFingerprint(req);
      
      const verificationCode = await verificationService.createAndSendVerificationCode(
        userId,
        email,
        VERIFICATION_TYPES.LOGIN_VERIFICATION,
        fingerprint.ipAddress,
        fingerprint.userAgent
      );
      
      return !!verificationCode;
    } catch (error) {
      console.error('Error sending login verification:', error);
      return false;
    }
  }

  /**
   * Verify a login verification code
   * @param userId User ID
   * @param code Verification code
   * @returns True if verified, false otherwise
   */
  public async verifyLoginCode(userId: number, code: string): Promise<boolean> {
    try {
      const verificationCode = await verificationService.verifyCode(
        userId,
        code,
        VERIFICATION_TYPES.LOGIN_VERIFICATION
      );
      
      return !!verificationCode;
    } catch (error) {
      console.error('Error verifying login code:', error);
      return false;
    }
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();