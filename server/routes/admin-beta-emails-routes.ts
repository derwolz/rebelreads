import { Router, Request, Response } from "express";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { db } from "../db";
import { dbStorage } from "../storage";
import { signup_interests, betaKeys } from "../../shared/schema";
import { emailService } from "../email";
import { asc, desc, eq, isNull, notInArray, sql, like } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Use admin middleware for all routes
router.use(adminAuthMiddleware);

// Get signup interests with a flag indicating if they've received a beta key
router.get("/signup-interests", async (req: Request, res: Response) => {
  try {
    // Get all signup interests
    const signupInterests = await db
      .select()
      .from(signup_interests)
      .orderBy(desc(signup_interests.createdAt));
    
    // Get all beta keys that were sent to signup interests (based on description pattern)
    const betaKeysForSignups = await db
      .select()
      .from(betaKeys)
      .where(like(betaKeys.description, 'Beta key for %from signup interest'));
    
    // Create a map of emails to beta keys for quick lookup
    const emailToBetaKeyMap = new Map();
    for (const key of betaKeysForSignups) {
      // Extract email from the description: "Beta key for email@example.com from signup interest"
      const match = key.description?.match(/Beta key for ([^\s]+) from signup interest/);
      if (match && match[1]) {
        emailToBetaKeyMap.set(match[1], key);
      }
    }
    
    // Add a flag to each signup interest indicating if they've already received a beta key
    const enrichedSignupInterests = signupInterests.map(interest => ({
      ...interest,
      hasBetaKey: emailToBetaKeyMap.has(interest.email),
      betaKeyDetails: emailToBetaKeyMap.get(interest.email) || null
    }));
    
    // Return as JSON
    res.json(enrichedSignupInterests);
  } catch (error) {
    console.error("Error fetching signup interests:", error);
    res.status(500).json({ error: "Failed to fetch signup interests" });
  }
});

// Schema for validating beta email requests
const sendBetaEmailSchema = z.object({
  emailIds: z.array(z.number()),
  customMessage: z.string().optional(),
});

// Send beta keys to selected signup interests
router.post("/send", async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validationResult = sendBetaEmailSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid request", 
        details: validationResult.error.format() 
      });
    }
    
    const { emailIds, customMessage } = validationResult.data;
    
    if (emailIds.length === 0) {
      return res.status(400).json({ error: "No email IDs provided" });
    }
    
    // Get the signup interests
    const signupInterests = await db
      .select()
      .from(signup_interests)
      .where(sql`${signup_interests.id} IN ${emailIds}`);
    
    if (signupInterests.length === 0) {
      return res.status(404).json({ error: "No signup interests found for the provided IDs" });
    }
    
    // Results to track successes and failures
    const results = {
      successful: [] as Array<{ id: number; email: string; betaKey: string }>,
      failed: [] as Array<{ id: number; email: string; error: string }>
    };
    
    // Process each signup interest
    for (const interest of signupInterests) {
      try {
        // Generate a beta key for this user
        const betaKey = await dbStorage.generateBetaKey({
          description: `Beta key for ${interest.email} from signup interest`,
          usageLimit: 1,
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          createdBy: (req.user as any)?.id || null
        });
        
        // Send beta invitation email
        const emailSent = await emailService.sendBetaInvitationEmail(
          interest.email,
          betaKey.key
        );
        
        if (emailSent) {
          results.successful.push({
            id: interest.id,
            email: interest.email,
            betaKey: betaKey.key
          });
        } else {
          throw new Error("Failed to send email");
        }
      } catch (error) {
        console.error(`Error processing signup interest ${interest.id}:`, error);
        results.failed.push({
          id: interest.id,
          email: interest.email,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    // Return results
    res.json({
      message: `Processed ${signupInterests.length} signup interests`,
      successful: results.successful.length,
      failed: results.failed.length,
      results
    });
  } catch (error) {
    console.error("Error sending beta emails:", error);
    res.status(500).json({ error: "Failed to send beta emails" });
  }
});

export default router;