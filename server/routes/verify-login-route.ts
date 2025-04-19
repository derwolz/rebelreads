import { Router } from "express";
import { dbStorage } from "../storage";
import { verificationService, VERIFICATION_TYPES } from "../services/verification-service";
import { securityService } from "../services/security-service";

const verifyLoginRouter = Router();

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
verifyLoginRouter.post("/verify-login", async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    if (!userId || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Get user data
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
      return res.status(401).json({ error: "Invalid or expired verification code" });
    }
    
    // Mark the current IP and user agent as trusted for this user
    await securityService.trustDeviceForUser(userId, req);
    
    // Clean up verified codes for this user and type
    await verificationService.invalidateActiveVerificationCodes(
      userId, 
      VERIFICATION_TYPES.LOGIN_VERIFICATION
    );
    
    // Log the user in
    req.login(user, (err) => {
      if (err) {
        console.error("Login error after verification:", err);
        return res.status(500).json({ error: "Login failed after verification" });
      }
      
      // Return the user data
      return res.status(200).json(user);
    });
  } catch (error) {
    console.error("Error verifying login:", error);
    return res.status(500).json({ error: "Failed to verify login" });
  }
});

export default verifyLoginRouter;