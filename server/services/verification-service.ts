import { randomBytes } from 'crypto';
import { db } from '../db';
import { EmailService } from '../email/email-service';
import { verificationCodes, users, type VerificationCode, type InsertVerificationCode } from '@shared/schema';
import { eq, and, lt, gt } from 'drizzle-orm';

// Verification types
export const VERIFICATION_TYPES = {
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  LOGIN_VERIFICATION: 'login_verification'
};

// Expiration times in minutes
export const EXPIRATION_TIMES = {
  [VERIFICATION_TYPES.EMAIL_VERIFICATION]: 30, // 30 minutes
  [VERIFICATION_TYPES.PASSWORD_RESET]: 30, // 30 minutes
  [VERIFICATION_TYPES.LOGIN_VERIFICATION]: 15 // 15 minutes
};

/**
 * Service for handling verification codes
 */
export class VerificationService {
  private static instance: VerificationService;
  private emailService: EmailService;

  private constructor() {
    this.emailService = EmailService.getInstance();
  }

  /**
   * Gets the singleton instance of VerificationService
   */
  public static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }

  /**
   * Generate a random verification code
   * @returns A 6-digit numeric code
   */
  private generateVerificationCode(): string {
    // Generate a 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Calculate expiration date based on verification type
   * @param type The type of verification
   * @returns Date when the code expires
   */
  private calculateExpiryDate(type: string): Date {
    const minutesToAdd = EXPIRATION_TIMES[type] || 30; // Default to 30 minutes
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + minutesToAdd);
    return expiryDate;
  }

  /**
   * Create a verification code and send it via email
   * 
   * @param userId User ID
   * @param email Email address to send the code to
   * @param type Type of verification (email_verification, password_reset, login_verification)
   * @param ipAddress IP address of the user (for login verification)
   * @param userAgent User agent string (for login verification)
   * @returns The created verification code object or null if failed
   */
  public async createAndSendVerificationCode(
    userId: number,
    email: string,
    type: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<VerificationCode | null> {
    try {
      // Get the user's information
      const userResults = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!userResults.length) {
        console.error('User not found:', userId);
        return null;
      }
      
      const user = userResults[0];
      const username = user.displayName || user.username;
      
      // Generate verification code
      const code = this.generateVerificationCode();
      const expiresAt = this.calculateExpiryDate(type);
      
      // Create verification code record
      const verificationData: InsertVerificationCode = {
        userId,
        code,
        type,
        email: email !== user.email ? email : undefined, // Only store if different from user's email
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        expiresAt
      };
      
      const result = await db.insert(verificationCodes)
        .values(verificationData)
        .returning();
      
      if (!result.length) {
        console.error('Failed to create verification code');
        return null;
      }
      
      const verificationCode = result[0];
      
      // Send email based on verification type
      let emailSent = false;
      switch (type) {
        case VERIFICATION_TYPES.EMAIL_VERIFICATION:
          emailSent = await this.emailService.sendEmailVerificationCode(email, username, code);
          break;
        case VERIFICATION_TYPES.PASSWORD_RESET:
          emailSent = await this.emailService.sendPasswordResetCode(email, username, code);
          break;
        case VERIFICATION_TYPES.LOGIN_VERIFICATION:
          if (ipAddress && userAgent) {
            emailSent = await this.emailService.sendLoginVerificationCode(
              email, 
              username, 
              code, 
              ipAddress, 
              userAgent
            );
          } else {
            console.error('Missing IP address or user agent for login verification');
            return null;
          }
          break;
        default:
          console.error('Invalid verification type:', type);
          return null;
      }
      
      if (!emailSent) {
        console.error('Failed to send verification email');
        return null;
      }
      
      console.log(`Verification code created and sent: ${type}`);
      return verificationCode;
    } catch (error) {
      console.error('Error creating verification code:', error);
      return null;
    }
  }

  /**
   * Verify a code against stored verification codes
   * 
   * @param userId User ID
   * @param code The verification code to check
   * @param type Type of verification (email_verification, password_reset, login_verification)
   * @returns The verification code object if valid, null otherwise
   */
  public async verifyCode(
    userId: number,
    code: string,
    type: string
  ): Promise<VerificationCode | null> {
    try {
      const now = new Date();
      
      // Find valid verification code
      const results = await db.select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.userId, userId),
            eq(verificationCodes.code, code),
            eq(verificationCodes.type, type),
            eq(verificationCodes.isUsed, false),
            gt(verificationCodes.expiresAt, now)
          )
        )
        .orderBy(verificationCodes.createdAt, 'desc')
        .limit(1);
      
      if (!results.length) {
        console.log('No valid verification code found');
        return null;
      }
      
      const verificationCode = results[0];
      
      // Mark code as used
      await db.update(verificationCodes)
        .set({ 
          isUsed: true,
          usedAt: new Date()
        })
        .where(eq(verificationCodes.id, verificationCode.id));
      
      return verificationCode;
    } catch (error) {
      console.error('Error verifying code:', error);
      return null;
    }
  }

  /**
   * Get the most recent active verification code for a user
   * 
   * @param userId User ID
   * @param type Type of verification
   * @returns The most recent active verification code or null
   */
  public async getActiveVerificationCode(
    userId: number,
    type: string
  ): Promise<VerificationCode | null> {
    try {
      const now = new Date();
      
      const results = await db.select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.userId, userId),
            eq(verificationCodes.type, type),
            eq(verificationCodes.isUsed, false),
            gt(verificationCodes.expiresAt, now)
          )
        )
        .orderBy(verificationCodes.createdAt, 'desc')
        .limit(1);
      
      return results.length ? results[0] : null;
    } catch (error) {
      console.error('Error getting active verification code:', error);
      return null;
    }
  }

  /**
   * Mark all active verification codes of a specific type as used
   * 
   * @param userId User ID
   * @param type Type of verification
   */
  public async invalidateActiveVerificationCodes(
    userId: number,
    type: string
  ): Promise<void> {
    try {
      const now = new Date();
      
      await db.update(verificationCodes)
        .set({ 
          isUsed: true,
          usedAt: now
        })
        .where(
          and(
            eq(verificationCodes.userId, userId),
            eq(verificationCodes.type, type),
            eq(verificationCodes.isUsed, false),
            gt(verificationCodes.expiresAt, now)
          )
        );
    } catch (error) {
      console.error('Error invalidating verification codes:', error);
    }
  }
}

// Export the singleton instance
export const verificationService = VerificationService.getInstance();