import { Router } from "express";
import { verificationService } from "../services/verification-service";
import { VERIFICATION_TYPES } from "../services/verification-service";
import { dbStorage } from "../storage";
import { z } from "zod";
import { hashPassword } from "../auth";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Endpoint to verify a code for public access (no auth required)
 * This is specifically for the password reset flow
 * 
 * Usage:
 * POST /api/public/verify-code
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
router.post("/verify-code", async (req, res) => {
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
    
    // Check the code without consuming it
    const verificationResult = await verificationService.checkCode(userId, code, type);
    
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

/**
 * Endpoint to verify a code and reset password in one step (no auth required)
 * This is specifically for the password reset flow
 * 
 * Usage:
 * POST /api/public/reset-password
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
router.post("/reset-password", async (req, res) => {
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
    
    // Check the code first without consuming it
    const verificationResult = await verificationService.checkCode(
      userId,
      code,
      VERIFICATION_TYPES.PASSWORD_RESET
    );
    
    if (!verificationResult) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }
    
    // If we get here, the code is valid, but we'll need to verify and consume it
    await verificationService.verifyCode(
      userId,
      code,
      VERIFICATION_TYPES.PASSWORD_RESET
    );
    
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

export default router;