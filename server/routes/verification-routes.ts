import { Router } from "express";
import { securityService } from "../services/security-service";
import { verificationService } from "../services/verification-service";
import { VERIFICATION_TYPES } from "../services/verification-service";
import { dbStorage } from "../storage";

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

export default verificationRouter;