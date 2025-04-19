import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { securityService } from "../services/security-service";

const router = Router();

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
router.post("/verify-login", async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get the user
    const user = await dbStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify the code
    const isValid = await securityService.verifyLoginCode(userId, code);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    // Mark this device as trusted
    await securityService.trustDeviceForUser(userId, req);

    // Log the user in
    req.login(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Failed to log in" });
      }
      
      return res.status(200).json(user);
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
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
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Get the user
    const user = await dbStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send a new verification code
    const sent = await securityService.sendLoginVerification(
      userId,
      user.email,
      req
    );

    if (sent) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: "Failed to send verification code" });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;