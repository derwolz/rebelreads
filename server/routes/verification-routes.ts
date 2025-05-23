import { Router } from "express";
import { securityService } from "../services/security-service";
import { verificationService } from "../services/verification-service";
import { VERIFICATION_TYPES } from "../services/verification-service";
import { dbStorage } from "../storage";
import { z } from "zod";
import { hashPassword } from "../auth";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const verificationRouter = Router();

/**
 * Endpoint to resend a verification code
 * 
 * Usage:
 * POST /api/resend-verification
 * 
 * Request body:
 * {
 *   userId: number
 *   type: string ("email_verification", "password_reset", "login_verification")
 * }
 * 
 * Response status codes:
 * 200 - Success
 * 400 - Invalid request
 * 404 - User not found
 * 500 - Server error
 */
verificationRouter.post("/resend-verification", async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    if (!userId || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Check if type is valid
    if (!Object.values(VERIFICATION_TYPES).includes(type)) {
      return res.status(400).json({ error: "Invalid verification type" });
    }
    
    // Get user data
    const user = await dbStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Invalidate any existing verification codes for this user and type
    await verificationService.invalidateActiveVerificationCodes(userId, type);
    
    // Login verification needs IP and user agent
    if (type === VERIFICATION_TYPES.LOGIN_VERIFICATION) {
      // Use security service to handle login verification
      const sent = await securityService.sendLoginVerification(userId, user.email, req);
      
      if (sent) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ error: "Failed to send verification code" });
      }
    } else {
      // For other types of verification
      const verificationCode = await verificationService.createAndSendVerificationCode(
        userId,
        user.email,
        type
      );
      
      if (verificationCode) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ error: "Failed to send verification code" });
      }
    }
  } catch (error) {
    console.error("Error resending verification code:", error);
    return res.status(500).json({ error: "Failed to resend verification code" });
  }
});

/**
 * Endpoint to request a password reset by email
 * 
 * Usage:
 * POST /api/request-password-reset
 * 
 * Request body:
 * {
 *   email: string
 * }
 * 
 * Response status codes:
 * 200 - Success (always returned even if email doesn't exist for security)
 * 400 - Invalid request
 * 500 - Server error
 */
verificationRouter.post("/request-password-reset", async (req, res) => {
  try {
    // Define validation schema
    const requestSchema = z.object({
      email: z.string().email("Please provide a valid email address"),
    });

    // Validate request
    const validationResult = requestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validationResult.error.format() 
      });
    }

    const { email } = validationResult.data;
    
    // Look up the user by email
    const user = await dbStorage.getUserByEmail(email);
    
    // If user doesn't exist, still return success (prevents email enumeration)
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({ success: true });
    }
    
    // If the user is using an OAuth provider, they can't reset their password
    if (user.provider) {
      // Still return success but log for audit purposes
      console.log(`Password reset attempted for OAuth user: ${email} (${user.provider})`);
      return res.status(200).json({ success: true });
    }
    
    // Invalidate any existing password reset codes for this user
    await verificationService.invalidateActiveVerificationCodes(
      user.id, 
      VERIFICATION_TYPES.PASSWORD_RESET
    );
    
    // Create and send a new verification code
    const verificationCode = await verificationService.createAndSendVerificationCode(
      user.id,
      email,
      VERIFICATION_TYPES.PASSWORD_RESET
    );
    
    if (!verificationCode) {
      // Log the error but still return success to client
      console.error(`Failed to send password reset verification to ${email}`);
    }
    
    // Always return success, even if email sending fails (prevent enumeration)
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({ error: "An error occurred while processing your request" });
  }
});

/**
 * Endpoint to verify a code and reset password in one step
 * This doesn't require authentication since it's part of the password reset flow
 * 
 * Usage:
 * POST /api/reset-password
 * 
 * Request body:
 * {
 *   userId: number,
 *   code: string,
 *   newPassword: string
 * }
 * 
 * Response status codes:
 * 200 - Success
 * 400 - Invalid request
 * 404 - User not found
 * 500 - Server error
 */
verificationRouter.post("/reset-password", async (req, res) => {
  try {
    // Define validation schema
    const resetSchema = z.object({
      userId: z.number().int().positive(),
      code: z.string().length(6, "Verification code must be exactly 6 characters"),
      newPassword: z.string().min(8, "New password must be at least 8 characters")
    });

    // Validate request
    const validationResult = resetSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validationResult.error.format() 
      });
    }

    const { userId, code, newPassword } = validationResult.data;
    
    // Get user data
    const user = await dbStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // If the user is using an OAuth provider, they can't reset their password
    if (user.provider) {
      return res.status(400).json({ 
        error: "Cannot reset password for accounts using social login",
        provider: user.provider
      });
    }
    
    // Verify the code
    const verificationResult = await verificationService.verifyCode(
      userId,
      code,
      VERIFICATION_TYPES.PASSWORD_RESET
    );
    
    if (!verificationResult) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user's password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
    
    // Invalidate all password reset codes for this user after successful reset
    await verificationService.invalidateActiveVerificationCodes(
      userId, 
      VERIFICATION_TYPES.PASSWORD_RESET
    );
    
    return res.status(200).json({ 
      success: true,
      message: "Password reset successfully" 
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "An error occurred while processing your request" });
  }
});

/**
 * Endpoint to verify a code without requiring authentication
 * This is part of the public password reset flow
 * 
 * Usage:
 * POST /api/verify-code
 * 
 * Request body:
 * {
 *   userId: number,
 *   code: string,
 *   type: string ("password_reset")
 * }
 * 
 * Response status codes:
 * 200 - Success
 * 400 - Invalid request
 * 404 - User not found
 * 500 - Server error
 */
verificationRouter.post("/verify-code", async (req, res) => {
  try {
    // Define validation schema
    const verifySchema = z.object({
      userId: z.number().int().positive(),
      code: z.string().length(6, "Verification code must be exactly 6 characters"),
      type: z.enum([VERIFICATION_TYPES.PASSWORD_RESET])
    });

    // Validate request
    const validationResult = verifySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validationResult.error.format() 
      });
    }

    const { userId, code, type } = validationResult.data;
    
    // Get user data
    const user = await dbStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Verify the code
    const verificationResult = await verificationService.verifyCode(userId, code, type);
    
    if (!verificationResult) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }
    
    return res.status(200).json({ 
      success: true,
      verified: true, 
      message: "Verification code is valid"
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    return res.status(500).json({ error: "An error occurred while processing your request" });
  }
});

export default verificationRouter;