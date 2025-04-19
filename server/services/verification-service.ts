import { dbStorage } from "../storage";
import { EmailService } from "../email/email-service";
import crypto from "crypto";

// Get email service instance
const emailService = EmailService.getInstance();

// Types of verification codes the service can handle
export enum VERIFICATION_TYPES {
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
  LOGIN_VERIFICATION = "login_verification"
}

// Code expiration times in milliseconds
const EXPIRATION_TIMES = {
  [VERIFICATION_TYPES.EMAIL_VERIFICATION]: 24 * 60 * 60 * 1000, // 24 hours
  [VERIFICATION_TYPES.PASSWORD_RESET]: 1 * 60 * 60 * 1000,     // 1 hour
  [VERIFICATION_TYPES.LOGIN_VERIFICATION]: 15 * 60 * 1000      // 15 minutes
};

// Template configuration for emails
const EMAIL_TEMPLATES = {
  [VERIFICATION_TYPES.EMAIL_VERIFICATION]: {
    subject: "Verify Your Email Address - Sirened",
    getHtml: (code: string, username: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Hello ${username},</p>
        <p>Please use the following verification code to confirm your email address:</p>
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 24 hours.</p>
        <p>If you didn't request this verification, you can safely ignore this email.</p>
        <p>Best regards,<br>The Sirened Team</p>
      </div>
    `,
    getText: (code: string, username: string) => `
      Verify Your Email Address

      Hello ${username},

      Please use the following verification code to confirm your email address:

      ${code}

      This code will expire in 24 hours.

      If you didn't request this verification, you can safely ignore this email.

      Best regards,
      The Sirened Team
    `
  },
  [VERIFICATION_TYPES.PASSWORD_RESET]: {
    subject: "Password Reset Request - Sirened",
    getHtml: (code: string, username: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${username},</p>
        <p>We received a request to reset your password. Please use the following code to complete the process:</p>
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please contact us immediately as someone may be trying to access your account.</p>
        <p>Best regards,<br>The Sirened Team</p>
      </div>
    `,
    getText: (code: string, username: string) => `
      Password Reset Request

      Hello ${username},

      We received a request to reset your password. Please use the following code to complete the process:

      ${code}

      This code will expire in 1 hour.

      If you didn't request a password reset, please contact us immediately as someone may be trying to access your account.

      Best regards,
      The Sirened Team
    `
  },
  [VERIFICATION_TYPES.LOGIN_VERIFICATION]: {
    subject: "Login Verification Code - Sirened",
    getHtml: (code: string, username: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Login Verification Required</h2>
        <p>Hello ${username},</p>
        <p>We noticed a login attempt from a new device or location. For your security, please use the following code to verify it's you:</p>
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't try to log in, please contact us immediately as someone may be trying to access your account.</p>
        <p>Best regards,<br>The Sirened Team</p>
      </div>
    `,
    getText: (code: string, username: string) => `
      Login Verification Required

      Hello ${username},

      We noticed a login attempt from a new device or location. For your security, please use the following code to verify it's you:

      ${code}

      This code will expire in 15 minutes.

      If you didn't try to log in, please contact us immediately as someone may be trying to access your account.

      Best regards,
      The Sirened Team
    `
  }
};

// Additional metadata for verification codes
interface VerificationMetadata {
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * VerificationService - Handles creating, sending, and verifying verification codes
 */
class VerificationService {
  private static instance: VerificationService;
  
  // Private constructor to enforce the singleton pattern
  private constructor() {}
  
  /**
   * Get the singleton instance of VerificationService
   */
  public static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }
  
  /**
   * Creates and sends a verification code via email
   */
  public async createAndSendVerificationCode(
    userId: number,
    email: string,
    type: VERIFICATION_TYPES,
    metadata: VerificationMetadata = {}
  ): Promise<string | null> {
    try {
      // Get user information to include in the email
      const user = await dbStorage.getUser(userId);
      if (!user) {
        console.error(`User not found for ID: ${userId}`);
        return null;
      }
      
      // Generate a verification code
      const code = this.generateVerificationCode();
      
      // Calculate expiration time based on verification type
      const expiresAt = new Date(Date.now() + EXPIRATION_TIMES[type]);
      
      // Store the verification code
      const savedCode = await dbStorage.createVerificationCode({
        userId,
        code,
        type,
        expiresAt,
        email: metadata?.email,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent
      });
      
      if (!savedCode) {
        console.error("Failed to save verification code");
        return null;
      }
      
      // Get the email template
      const template = EMAIL_TEMPLATES[type];
      
      // Send the email
      const emailSent = await emailService.sendEmail(
        email,
        template.subject,
        template.getHtml(code, user.username),
        template.getText(code, user.username)
      );
      
      if (!emailSent) {
        console.error("Failed to send verification email");
        return null;
      }
      
      return code;
    } catch (error) {
      console.error("Error creating and sending verification code:", error);
      return null;
    }
  }
  
  /**
   * Verifies a code for a specific user and type
   */
  public async verifyCode(
    userId: number,
    code: string,
    type: VERIFICATION_TYPES
  ): Promise<boolean> {
    try {
      // Get the most recent active verification code for this user and type
      const verificationCode = await dbStorage.getActiveVerificationCode(userId, type);
      
      if (!verificationCode) {
        return false;
      }
      
      // Check if the code is expired
      const now = new Date();
      if (now > verificationCode.expiresAt) {
        return false;
      }
      
      // Check if the code matches
      if (verificationCode.code !== code) {
        return false;
      }
      
      // Mark the code as used
      await dbStorage.markVerificationCodeAsUsed(verificationCode.id);
      
      return true;
    } catch (error) {
      console.error("Error verifying code:", error);
      return false;
    }
  }
  
  /**
   * Invalidates all active verification codes for a user and type
   */
  public async invalidateActiveVerificationCodes(
    userId: number,
    type: VERIFICATION_TYPES
  ): Promise<boolean> {
    try {
      await dbStorage.invalidateVerificationCodes(userId, type);
      return true;
    } catch (error) {
      console.error("Error invalidating verification codes:", error);
      return false;
    }
  }
  
  /**
   * Generates a random verification code
   * @returns A 6-character alphanumeric code
   */
  private generateVerificationCode(): string {
    // Generate a random 6-character code
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }
}

// Export the singleton instance
export const verificationService = VerificationService.getInstance();