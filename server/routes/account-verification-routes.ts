import express from 'express';
import { z } from 'zod';
import { verificationService, VERIFICATION_TYPES } from '../services/verification-service';
import { securityService } from '../services/security-service';
import { db } from '../db';
import { users } from '@shared/schema';
import { hashPassword } from '../auth';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Request schemas
const sendVerificationCodeSchema = z.object({
  userId: z.number().int().positive(),
  email: z.string().email(),
  type: z.enum([
    VERIFICATION_TYPES.EMAIL_VERIFICATION,
    VERIFICATION_TYPES.PASSWORD_RESET,
    VERIFICATION_TYPES.LOGIN_VERIFICATION
  ]),
});

const verifyCodeSchema = z.object({
  userId: z.number().int().positive(),
  code: z.string().min(6).max(6),
  type: z.enum([
    VERIFICATION_TYPES.EMAIL_VERIFICATION,
    VERIFICATION_TYPES.PASSWORD_RESET,
    VERIFICATION_TYPES.LOGIN_VERIFICATION
  ]),
});

const changeEmailSchema = z.object({
  userId: z.number().int().positive(),
  newEmail: z.string().email(),
  code: z.string().min(6).max(6),
});

const resetPasswordSchema = z.object({
  userId: z.number().int().positive(), 
  code: z.string().min(6).max(6),
  newPassword: z.string().min(8),
});

/**
 * Send a verification code
 * POST /api/account/verification/send
 */
router.post('/send', async (req, res) => {
  try {
    // Validate request
    const validationResult = sendVerificationCodeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validationResult.error.format()
      });
    }
    
    const { userId, email, type } = validationResult.data;
    
    // Add IP and user agent for login verification
    const ipAddress = type === VERIFICATION_TYPES.LOGIN_VERIFICATION 
      ? securityService.getIpAddress(req)
      : undefined;
    
    const userAgent = type === VERIFICATION_TYPES.LOGIN_VERIFICATION
      ? securityService.getUserAgent(req)
      : undefined;
    
    // Create and send verification code
    const verificationCode = await verificationService.createAndSendVerificationCode(
      userId,
      email,
      type,
      ipAddress,
      userAgent
    );
    
    if (!verificationCode) {
      return res.status(500).json({ error: 'Failed to send verification code' });
    }
    
    return res.status(200).json({ 
      message: 'Verification code sent successfully',
      expiresAt: verificationCode.expiresAt
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verify a code
 * POST /api/account/verification/verify
 */
router.post('/verify', async (req, res) => {
  try {
    // Validate request
    const validationResult = verifyCodeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validationResult.error.format()
      });
    }
    
    const { userId, code, type } = validationResult.data;
    
    // Verify code
    const verificationResult = await verificationService.verifyCode(userId, code, type);
    
    if (!verificationResult) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    return res.status(200).json({ 
      message: 'Verification successful',
      verified: true
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Change email (requires verification code)
 * POST /api/account/verification/change-email
 */
router.post('/change-email', async (req, res) => {
  try {
    // Validate request
    const validationResult = changeEmailSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validationResult.error.format()
      });
    }
    
    const { userId, newEmail, code } = validationResult.data;
    
    // Verify the code
    const verificationResult = await verificationService.verifyCode(
      userId,
      code,
      VERIFICATION_TYPES.EMAIL_VERIFICATION
    );
    
    if (!verificationResult) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    // Verify that the email in the verification code matches the new email
    if (verificationResult.email && verificationResult.email !== newEmail) {
      return res.status(400).json({ error: 'Email mismatch' });
    }
    
    // Update the user's email
    await db.update(users)
      .set({ email: newEmail })
      .where(eq(users.id, userId));
    
    return res.status(200).json({ 
      message: 'Email updated successfully',
      email: newEmail
    });
  } catch (error) {
    console.error('Error changing email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Reset password (requires verification code)
 * POST /api/account/verification/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    // Validate request
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validationResult.error.format()
      });
    }
    
    const { userId, code, newPassword } = validationResult.data;
    
    // Verify the code
    const verificationResult = await verificationService.verifyCode(
      userId,
      code,
      VERIFICATION_TYPES.PASSWORD_RESET
    );
    
    if (!verificationResult) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    // Hash the password (this is just a placeholder, we should use the same hashing 
    // function that's used in auth.ts)
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user's password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
    
    return res.status(200).json({ 
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get login verification status
 * GET /api/account/verification/login-status/:userId
 */
router.get('/login-status/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Check if verification is needed for this device/location
    const verificationNeeded = await securityService.isVerificationNeeded(userId, req);
    
    return res.status(200).json({ 
      verificationNeeded,
      ipAddress: securityService.getIpAddress(req),
      userAgent: securityService.getUserAgent(req)
    });
  } catch (error) {
    console.error('Error checking login verification status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



export default router;