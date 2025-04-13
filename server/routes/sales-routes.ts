import express from "express";
import { z } from "zod";
import { dbStorage } from "../storage";
import { requireSeller, attachSellerInfo } from "../middleware/seller-auth";
import { InsertSeller, InsertPublisherSeller, InsertPublisher } from "../../shared/schema";

const router = express.Router();

/**
 * Check if the current user has seller status
 * This is a public endpoint that works without seller authentication
 */
router.get("/check-status", attachSellerInfo, async (req, res) => {
  try {
    // Return false if not authenticated
    if (!req.isAuthenticated()) {
      return res.json({
        isSeller: false,
        isAuthenticated: false
      });
    }

    // Check if the user is a seller
    const userId = req.user!.id;
    const isSeller = await dbStorage.isUserSeller(userId);

    return res.json({
      isSeller,
      isAuthenticated: true
    });
  } catch (error) {
    console.error("Error checking seller status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get the current seller's information
 * This includes any verification codes they've created
 * 
 * Requires: Seller authentication
 */
router.get("/me", requireSeller, async (req, res) => {
  try {
    const sellerId = req.sellerInfo?.id;

    if (!sellerId) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    // Get the full seller information
    const sellerInfo = await dbStorage.getSellerById(sellerId);

    // Get any verification codes created by this seller
    const sellerVerificationCodes = await dbStorage.getSellerVerificationCodes(sellerId);

    return res.json({
      seller: sellerInfo,
      verificationCodes: sellerVerificationCodes
    });
  } catch (error) {
    console.error("Error getting seller info:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Generate a new verification code for a seller
 * This code is used by users to become publishers
 * 
 * Requires: Seller authentication
 */
router.post("/generate-code", requireSeller, async (req, res) => {
  try {
    const sellerId = req.sellerInfo?.id;

    if (!sellerId) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    // Create a new verification code
    const verificationCode = await dbStorage.createPublisherSellerVerificationCode(sellerId);

    if (!verificationCode) {
      return res.status(500).json({ error: "Failed to generate verification code" });
    }

    return res.status(201).json({
      verificationCode: verificationCode.verification_code
    });
  } catch (error) {
    console.error("Error generating verification code:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get all users for seller to possibly assign publisher status to
 * 
 * Requires: Seller authentication
 */
router.get("/users", requireSeller, async (req, res) => {
  try {
    // Get query parameters for searching/filtering
    const query = req.query.query as string || "";
    const page = parseInt(req.query.page as string || "1");
    const limit = parseInt(req.query.limit as string || "20");

    // Get all users that match the query
    const users = await dbStorage.searchUsers(query, page, limit);

    // Check which users are already publishers
    const usersWithPublisherStatus = await Promise.all(
      users.map(async (user: { id: number; email: string; username: string }) => {
        // Check if the user is already a publisher using the PublisherStorage's isUserPublisher method
        const isPublisher = await dbStorage.isUserPublisher(user.id);
        return {
          ...user,
          isPublisher
        };
      })
    );

    return res.json(usersWithPublisherStatus);
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Create a new seller account
 * This can be done by any authenticated user
 * 
 * Note: In a production environment, this would typically require admin approval
 */
router.post("/register", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user!.id;

    // Check if the user is already a seller
    const isAlreadySeller = await dbStorage.isUserSeller(userId);
    if (isAlreadySeller) {
      return res.status(400).json({ error: "User is already registered as a seller" });
    }

    // Validate the request body
    const sellerSchema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email is required"),
      company: z.string().min(1, "Company is required"),
      notes: z.string().optional()
    });

    const validationResult = sellerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid seller data", 
        details: validationResult.error.format() 
      });
    }

    // Create the seller
    const sellerData: InsertSeller = {
      userId,
      name: validationResult.data.name,
      email: validationResult.data.email,
      company: validationResult.data.company,
      notes: validationResult.data.notes,
      status: "active"
    };

    const newSeller = await dbStorage.createSeller(sellerData);

    if (!newSeller) {
      return res.status(500).json({ error: "Failed to create seller account" });
    }

    return res.status(201).json(newSeller);
  } catch (error) {
    console.error("Error creating seller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Update seller profile information
 * 
 * Requires: Seller authentication
 */
router.patch("/profile", requireSeller, async (req, res) => {
  try {
    const sellerId = req.sellerInfo?.id;

    if (!sellerId) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    // Validate the request body
    const updateSchema = z.object({
      name: z.string().min(1, "Name is required").optional(),
      email: z.string().email("Valid email is required").optional(),
      company: z.string().min(1, "Company is required").optional(),
      notes: z.string().optional()
    });

    const validationResult = updateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid seller data", 
        details: validationResult.error.format() 
      });
    }

    // Update the seller
    const updatedSeller = await dbStorage.updateSeller(sellerId, validationResult.data);

    if (!updatedSeller) {
      return res.status(500).json({ error: "Failed to update seller profile" });
    }

    return res.json(updatedSeller);
  } catch (error) {
    console.error("Error updating seller profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Check the status of a verification code
 * This endpoint is public and can be used by any user
 * This doesn't require authentication
 */
router.get("/verify-code/:code", (req, res, next) => {
  // Skip authentication for this public route
  if (req.params.code) {
    next();
  } else {
    res.status(400).json({ error: "Verification code is required" });
  }
}, async (req, res) => {
  try {
    const code = req.params.code;

    // Get the seller information from the verification code
    const sellerInfo = await dbStorage.getSellerDetailsByVerificationCode(code);

    if (!sellerInfo) {
      return res.status(404).json({ error: "Invalid verification code" });
    }

    // Don't expose seller's notes to public, just return necessary info
    return res.json({
      valid: true,
      seller: {
        name: sellerInfo.name,
        company: sellerInfo.company,
        status: sellerInfo.status
      }
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Assign publisher status to a user
 * A seller can use this endpoint to assign publisher status to any user
 * 
 * Requires: Seller authentication
 */
router.post("/assign-publisher", requireSeller, async (req, res) => {
  try {
    const sellerId = req.sellerInfo?.id;

    if (!sellerId) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    // Validate the request body
    const schema = z.object({
      userId: z.number().positive("Valid user ID is required"),
      publisherName: z.string().min(1, "Publisher name is required"),
      publisherDescription: z.string().optional(),
    });

    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid publisher data", 
        details: validationResult.error.format() 
      });
    }

    const { userId, publisherName, publisherDescription } = validationResult.data;

    // Check if the user already has publisher status
    const isAlreadyPublisher = await dbStorage.isUserPublisher(userId);
    if (isAlreadyPublisher) {
      return res.status(400).json({ error: "User already has publisher status" });
    }

    // Create a new publisher record for the user
    const publisherData: InsertPublisher = {
      userId,
      name: publisherName, // Required for backward compatibility
      publisher_name: publisherName,
      publisher_description: publisherDescription || undefined,
      description: publisherDescription || undefined, // Required for backward compatibility
    };

    const newPublisher = await dbStorage.createPublisher(publisherData);

    if (!newPublisher) {
      return res.status(500).json({ error: "Failed to assign publisher status" });
    }

    // Create a publisher-seller relationship
    try {
      const publisherSeller: InsertPublisherSeller = {
        sellerId,
        verification_code: undefined // No verification code for this relationship as it's directly created
      };

      await dbStorage.createPublisherSeller(publisherSeller);
    } catch (error) {
      console.error("Error creating publisher-seller relationship:", error);
      // Don't fail the whole process if this secondary step fails
      // The user is still a publisher, but the relationship with the seller isn't recorded
    }

    return res.status(201).json({
      success: true,
      message: "Publisher status assigned successfully",
      publisher: newPublisher
    });
  } catch (error) {
    console.error("Error assigning publisher status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;