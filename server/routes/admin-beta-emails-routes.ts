import { Router, Request, Response } from "express";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { db } from "../db";
import { dbStorage } from "../storage";
import { signup_interests } from "../../shared/schema";
import { emailService } from "../email";
import { asc, desc, eq, isNull, notInArray, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Use admin middleware for all routes
router.use(adminAuthMiddleware);

// Get signup interests that haven't received a beta key yet
router.get("/signup-interests", async (req: Request, res: Response) => {
  try {
    // Get signup interests that don't have a beta key yet
    const signupInterests = await db
      .select()
      .from(signup_interests)
      .orderBy(desc(signup_interests.createdAt));
    
    // Return as JSON
    res.json(signupInterests);
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