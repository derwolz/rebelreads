import { Router } from "express";
import { z } from "zod";
import { securityService } from "../services/security-service";
import { verificationService, VERIFICATION_TYPES } from "../services/verification-service";
import { dbStorage } from "../storage";

const router = Router();

// Schema for verification request
const verifyLoginSchema = z.object({
  userId: z.number().int().positive(),
  code: z.string().min(6).max(8)
});

// Schema for resend code request
const resendVerificationSchema = z.object({
  userId: z.number().int().positive()
});

/**
 * Endpoint to verify a login using a verification code
 * 
 * Usage:
 * POST /api/verify-login
 * 
 * Request body:
 * {
 *   userId: number
 *   code: string
 * }
 * 
 * Response:
 * 200 - User object on success
 * 400 - Invalid request
 * 401 - Invalid verification code
 * 404 - User not found
 * 500 - Server error
 */
router.post("/verify-login", async (req, res) => {
  try {
    // Validate request
    const validation = verifyLoginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.format()
      });
    }

    const { userId, code } = validation.data;

    // Get user
    const user = await dbStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify the code
    const isValid = await verificationService.verifyCode(
      userId,
      code,
      VERIFICATION_TYPES.LOGIN_VERIFICATION
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    // Add this device as trusted
    await securityService.trustDeviceForUser(userId, req);

    // Login user
    req.login(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Login failed" });
      }
      
      // Return user info (without password)
      const { password, ...userInfo } = user;
      return res.status(200).json(userInfo);
    });
  } catch (error) {
    console.error("Error verifying login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Endpoint to resend a verification code
 * 
 * Usage:
 * POST /api/resend-verification
 * 
 * Request body:
 * {
 *   userId: number
 * }
 * 
 * Response:
 * 200 - Success
 * 400 - Invalid request
 * 404 - User not found
 * 500 - Server error
 */
router.post("/resend-verification", async (req, res) => {
  try {
    // Validate request
    const validation = resendVerificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.format()
      });
    }

    const { userId } = validation.data;

    // Get user
    const user = await dbStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Invalidate any existing verification codes
    await verificationService.invalidateActiveVerificationCodes(
      userId,
      VERIFICATION_TYPES.LOGIN_VERIFICATION
    );

    // Send new verification code
    const sent = await securityService.sendLoginVerification(
      userId,
      user.email,
      req
    );

    if (!sent) {
      return res.status(500).json({ error: "Failed to send verification code" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error resending verification code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;