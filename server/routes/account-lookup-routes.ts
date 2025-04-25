import { Router } from "express";
import { z } from "zod";
import { dbStorage } from "../storage";

const router = Router();

/**
 * Lookup a user by email
 * Only returns minimal information (userId) needed for password reset
 * 
 * Usage:
 * POST /api/account/lookup-by-email
 * 
 * Request body:
 * {
 *   email: string
 * }
 * 
 * Response:
 * {
 *   userId: number
 * }
 * 
 * Response status codes:
 * 200 - Success
 * 400 - Invalid request
 * 404 - User not found
 * 500 - Server error
 */
router.post("/lookup-by-email", async (req, res) => {
  try {
    // Define validation schema
    const lookupSchema = z.object({
      email: z.string().email("Please provide a valid email address"),
    });

    // Validate request
    const validationResult = lookupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validationResult.error.format() 
      });
    }

    const { email } = validationResult.data;
    
    // Look up the user by email
    const user = await dbStorage.getUserByEmail(email);
    
    // If user doesn't exist, return 404
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // For security reasons, only return the user ID
    return res.status(200).json({ 
      userId: user.id
    });
  } catch (error) {
    console.error("Error looking up user by email:", error);
    return res.status(500).json({ error: "An error occurred while processing your request" });
  }
});

export default router;