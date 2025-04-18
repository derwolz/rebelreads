import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { 
  users, 
  userGenreViews, 
  viewGenres, 
  insertAuthorSchema, 
  insertPublisherSchema,
  insertPublisherSellerSchema,
  authors, 
  publishers,
  publisherSellers,
  UpdateProfile 
} from "@shared/schema";
import { comparePasswords, hashPassword } from "../auth";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure directories for profile image uploads
const uploadsDir = "./uploads";
const profileImagesDir = path.join(uploadsDir, "profile-images");

// Create directories if they don't exist
[uploadsDir, profileImagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for profile image uploads
const profileImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profileImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB size limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

const router = Router();

// Get current user profile
router.get("/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const user = await dbStorage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Don't send sensitive info
    const { password, ...profile } = user;
    
    res.json(profile);
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({ error: "Failed to retrieve profile" });
  }
});

// Get user's rating preferences
router.get("/rating-preferences", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const preferences = await dbStorage.getRatingPreferences(req.user.id);
    
    // Set content type header explicitly
    res.setHeader('Content-Type', 'application/json');
    
    if (!preferences) {
      // Return default preferences if none exist yet
      return res.json({ 
        enjoyment: 0.35,
        writing: 0.25,
        themes: 0.20,
        characters: 0.12,
        worldbuilding: 0.08
      });
    }
    
    // Log what we're sending back
    console.log("Returning preferences:", JSON.stringify(preferences));
    
    res.json(preferences);
  } catch (error) {
    console.error("Error getting rating preferences:", error);
    res.status(500).json({ error: "Failed to retrieve rating preferences" });
  }
});

// Save user's rating preferences
router.post("/rating-preferences", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    console.log("Rating preferences POST - User not authenticated");
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Set content type header explicitly
  res.setHeader('Content-Type', 'application/json');
  
  // Validate the request body
  const schema = z.object({
    enjoyment: z.number(),
    writing: z.number(),
    themes: z.number(),
    characters: z.number(),
    worldbuilding: z.number()
  });
  
  try {
    console.log("Rating preferences POST - Request body:", req.body);
    console.log("Rating preferences POST - User ID:", req.user.id);
    
    const weights = schema.parse(req.body);
    
    const preferences = await dbStorage.saveRatingPreferences(req.user.id, weights);
    
    console.log("Rating preferences POST - Successfully saved:", JSON.stringify(preferences));
    res.json(preferences);
  } catch (error) {
    console.error("Error saving rating preferences:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to save rating preferences" });
  }
});

// Update user profile
router.patch("/user", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // If hasCompletedOnboarding is in the request, update it
    if (req.body.hasCompletedOnboarding !== undefined) {
      // Update the user record
      await db
        .update(users)
        .set({ hasCompletedOnboarding: !!req.body.hasCompletedOnboarding })
        .where(eq(users.id, req.user.id));
      
      // Get the updated user
      const updatedUser = await dbStorage.getUser(req.user.id);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update the session user object
      const { password, ...userWithoutPassword } = updatedUser;
      req.user = userWithoutPassword as Express.User;
      
      return res.json(userWithoutPassword);
    }
    
    // Handle profile updates by validating with updateProfileSchema
    const updateData: Partial<UpdateProfile> = {};
    
    // Check if we're updating the basic profile fields
    if (req.body.username) updateData.username = req.body.username;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.displayName) updateData.displayName = req.body.displayName;
    if (req.body.bio) updateData.bio = req.body.bio;
    if (req.body.profileImageUrl) updateData.profileImageUrl = req.body.profileImageUrl;
    if (req.body.socialMediaLinks) updateData.socialMediaLinks = req.body.socialMediaLinks;
    if (req.body.socialLinks) updateData.socialLinks = req.body.socialLinks;
    
    // Handle password change if requested
    if (req.body.currentPassword && req.body.newPassword && req.body.confirmPassword) {
      // Get current user with password
      const user = await dbStorage.getUser(req.user.id);
      if (!user || !user.password) {
        return res.status(404).json({ error: "User not found or no password set" });
      }
      
      // Verify current password
      const isPasswordValid = await comparePasswords(req.body.currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Verify passwords match
      if (req.body.newPassword !== req.body.confirmPassword) {
        return res.status(400).json({ error: "New passwords do not match" });
      }
      
      // Hash new password
      updateData.password = await hashPassword(req.body.newPassword);
    }
    
    // Only proceed with update if there's something to update
    if (Object.keys(updateData).length > 0) {
      // Update the user
      const updatedUser = await dbStorage.updateUser(req.user.id, updateData);
      
      // Update the session user object
      const { password, ...userWithoutPassword } = updatedUser;
      req.user = userWithoutPassword as Express.User;
      
      return res.json(userWithoutPassword);
    }
    
    // If no update data provided, just return the current user
    const user = await dbStorage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
    
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Get user's genre views
router.get("/genre-preferences", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Parse pagination parameters
    const page = req.query.page ? parseInt(req.query.page as string) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 0;
    
    // Check if we're only fetching structure without genres
    const structureOnly = req.query.structureOnly === 'true';
    
    // Get all the user's views
    const views = await dbStorage.getUserGenreViews(req.user.id);
    
    // Set content type header
    res.setHeader('Content-Type', 'application/json');
    
    if (views.length === 0) {
      // Return empty data if no views exist yet
      return res.json({ 
        views: [],
        pagination: {
          total: 0,
          page: 0,
          limit: 0,
          pages: 0
        }
      });
    }
    
    // If we only need the structure, return just the views without genres
    if (structureOnly) {
      return res.json({ 
        views: views,
        pagination: {
          total: views.length,
          page: 0,
          limit: 0,
          pages: 1
        }
      });
    }
    
    // For each view, get the associated genres with pagination
    const viewsWithGenres = await Promise.all(
      views.map(async (view) => {
        const { genres, total } = await dbStorage.getViewGenres(view.id, page, limit);
        return {
          ...view,
          genres,
          genreMeta: {
            total,
            page: page,
            limit: limit,
            pages: limit > 0 ? Math.ceil(total / limit) : 1
          }
        };
      })
    );
    
    console.log("Returning genre views:", JSON.stringify(viewsWithGenres));
    
    res.json({ 
      views: viewsWithGenres,
      pagination: {
        total: views.length,
        page: 0,
        limit: 0,
        pages: 1
      }
    });
  } catch (error) {
    console.error("Error getting genre views:", error);
    res.status(500).json({ error: "Failed to retrieve genre views" });
  }
});

// Create a new genre view
router.post("/genre-views", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Set content type header
  res.setHeader('Content-Type', 'application/json');
  
  // Validate the request body
  const schema = z.object({
    name: z.string().min(1, "View name is required"),
    rank: z.number().int().min(0),
    isDefault: z.boolean().optional().default(false)
  });
  
  try {
    const data = schema.parse(req.body);
    
    // Create the view
    const view = await dbStorage.createGenreView(
      req.user.id, 
      data.name, 
      data.rank, 
      data.isDefault
    );
    
    console.log("Genre view created:", JSON.stringify(view));
    res.status(201).json(view);
  } catch (error) {
    console.error("Error creating genre view:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create genre view" });
  }
});

// Update a genre view
router.patch("/genre-views/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Set content type header
  res.setHeader('Content-Type', 'application/json');
  
  const viewId = parseInt(req.params.id);
  if (isNaN(viewId)) {
    return res.status(400).json({ error: "Invalid view ID" });
  }
  
  // Validate the request body
  const schema = z.object({
    name: z.string().min(1).optional(),
    rank: z.number().int().min(0).optional(),
    isDefault: z.boolean().optional()
  });
  
  try {
    const data = schema.parse(req.body);
    
    // Update the view
    const updatedView = await dbStorage.updateGenreView(viewId, data);
    
    console.log("Genre view updated:", JSON.stringify(updatedView));
    res.json(updatedView);
  } catch (error) {
    console.error("Error updating genre view:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update genre view" });
  }
});

// Delete a genre view
router.delete("/genre-views/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const viewId = parseInt(req.params.id);
  if (isNaN(viewId)) {
    return res.status(400).json({ error: "Invalid view ID" });
  }
  
  try {
    await dbStorage.deleteGenreView(viewId);
    
    console.log("Genre view deleted:", viewId);
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting genre view:", error);
    res.status(500).json({ error: "Failed to delete genre view" });
  }
});

// Add a genre to a view
router.post("/genre-views/:id/genres", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Set content type header
  res.setHeader('Content-Type', 'application/json');
  
  const viewId = parseInt(req.params.id);
  if (isNaN(viewId)) {
    return res.status(400).json({ error: "Invalid view ID" });
  }
  
  // Validate the request body
  const schema = z.object({
    taxonomyId: z.number().int().positive(),
    type: z.string(),
    rank: z.number().int().min(0)
  });
  
  try {
    const data = schema.parse(req.body);
    
    // Add the genre to the view
    const genre = await dbStorage.addGenreToView(
      viewId, 
      data.taxonomyId, 
      data.type, 
      data.rank
    );
    
    console.log("Genre added to view:", JSON.stringify(genre));
    res.status(201).json(genre);
  } catch (error) {
    console.error("Error adding genre to view:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to add genre to view" });
  }
});

// Remove a genre from a view
router.delete("/view-genres/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const genreId = parseInt(req.params.id);
  if (isNaN(genreId)) {
    return res.status(400).json({ error: "Invalid genre ID" });
  }
  
  try {
    await dbStorage.removeGenreFromView(genreId);
    
    console.log("Genre removed from view:", genreId);
    res.status(204).end();
  } catch (error) {
    console.error("Error removing genre from view:", error);
    res.status(500).json({ error: "Failed to remove genre from view" });
  }
});

// Update genre rank within a view
router.patch("/view-genres/:id/rank", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Set content type header
  res.setHeader('Content-Type', 'application/json');
  
  const genreId = parseInt(req.params.id);
  if (isNaN(genreId)) {
    return res.status(400).json({ error: "Invalid genre ID" });
  }
  
  // Validate the request body
  const schema = z.object({
    rank: z.number().int().min(0)
  });
  
  try {
    const data = schema.parse(req.body);
    
    // Update the genre rank
    const updatedGenre = await dbStorage.updateGenreRank(genreId, data.rank);
    
    console.log("Genre rank updated:", JSON.stringify(updatedGenre));
    res.json(updatedGenre);
  } catch (error) {
    console.error("Error updating genre rank:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update genre rank" });
  }
});

// Check if the user is an author
router.get("/author-status", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is an author
    const isAuthor = await dbStorage.isUserAuthor(req.user.id);
    
    // Get the author details if the user is an author
    let authorDetails = null;
    if (isAuthor) {
      authorDetails = await dbStorage.getAuthorByUserId(req.user.id);
    }
    
    res.json({ isAuthor, authorDetails });
  } catch (error) {
    console.error("Error checking author status:", error);
    res.status(500).json({ error: "Failed to check author status" });
  }
});

// Check if the user is a publisher
router.get("/publisher-status", async (req: Request, res: Response) => {
  // Explicitly set content type for this route
  res.setHeader('Content-Type', 'application/json');
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is a publisher
    const isPublisher = await dbStorage.isUserPublisher(req.user.id);
    
    // Get the publisher details if the user is a publisher
    let publisherDetails = null;
    if (isPublisher) {
      publisherDetails = await dbStorage.getPublisherByUserId(req.user.id);
    }
    
    console.log(`Publisher status check for user ${req.user.id}:`, { isPublisher, publisherDetails });
    
    // Ensure we're sending JSON response
    return res.json({ isPublisher, publisherDetails });
  } catch (error) {
    console.error("Error checking publisher status:", error);
    return res.status(500).json({ error: "Failed to check publisher status" });
  }
});

// Become an author
router.post("/become-author", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is already an author
    const isExistingAuthor = await dbStorage.isUserAuthor(req.user.id);
    
    if (isExistingAuthor) {
      return res.status(400).json({ error: "User is already registered as an author" });
    }
    
    // Validate the request body
    const authorData = insertAuthorSchema.parse({
      userId: req.user.id,
      authorName: req.body.authorName || req.user.username || req.user.email.split('@')[0],
      bio: req.body.bio || "",
      isPro: false, // Default to not pro
    });
    
    // Create a new author record
    const author = await dbStorage.createAuthor(authorData);
    
    res.status(201).json(author);
  } catch (error) {
    console.error("Error creating author:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to register as an author" });
  }
});

// Revoke author status and remove all related content
router.post("/revoke-author", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Validate username confirmation
    const confirmSchema = z.object({
      confirmUsername: z.string()
    });
    
    const { confirmUsername } = confirmSchema.parse(req.body);
    
    // Check if the confirmation username matches
    if (confirmUsername !== req.user.username) {
      return res.status(400).json({ error: "Username confirmation does not match" });
    }
    
    // Check if the user is an author
    const isExistingAuthor = await dbStorage.isUserAuthor(req.user.id);
    
    if (!isExistingAuthor) {
      return res.status(400).json({ error: "User is not registered as an author" });
    }
    
    // Get author details before deletion to check Pro status
    const authorDetails = await dbStorage.getAuthorByUserId(req.user.id);
    const isPro = authorDetails?.isPro || false;
    const proExpiresAt = authorDetails?.proExpiresAt || null;
    
    // 1. Delete all books by this author
    await dbStorage.deleteAllAuthorBooks(req.user.id);
    
    // 2. Delete the author record (but preserve pro status information)
    await dbStorage.deleteAuthor(req.user.id, isPro, proExpiresAt);
    
    // Return success response
    res.status(200).json({ message: "Author status revoked and all related content removed" });
  } catch (error) {
    console.error("Error revoking author status:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to revoke author status" });
  }
});

// Check if the user is a publisher seller
router.get("/publisher-seller-status", async (req: Request, res: Response) => {
  // Explicitly set content type for this route
  res.setHeader('Content-Type', 'application/json');
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is a publisher seller
    const isPublisherSeller = await dbStorage.isPublisherSeller(req.user.id);
    
    // Get the seller details if the user is a seller
    let sellerDetails = null;
    if (isPublisherSeller) {
      sellerDetails = await dbStorage.getPublisherSellerByUserId(req.user.id);
    }
    
    return res.json({ isPublisherSeller, sellerDetails });
  } catch (error) {
    console.error("Error checking publisher seller status:", error);
    return res.status(500).json({ error: "Failed to check publisher seller status" });
  }
});

// Register as a publisher seller
router.post("/register-publisher-seller", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is already a publisher seller
    const isExistingSeller = await dbStorage.isPublisherSeller(req.user.id);
    
    if (isExistingSeller) {
      return res.status(400).json({ error: "User is already registered as a publisher seller" });
    }
    
    // Validate the request body
    const sellerData = insertPublisherSellerSchema.parse({
      userId: req.user.id,
      name: req.body.name || req.user.username || req.user.email.split('@')[0],
      email: req.body.email || req.user.email,
      company: req.body.company,
      status: "active",
      notes: req.body.notes || "",
    });
    
    // Create a new publisher seller record
    const seller = await dbStorage.createPublisherSeller(sellerData);
    
    res.status(201).json(seller);
  } catch (error) {
    console.error("Error creating publisher seller:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to register as a publisher seller" });
  }
});

// Generate a new verification code for publisher seller
router.post("/publisher-seller/generate-code", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is a publisher seller
    const seller = await dbStorage.getPublisherSellerByUserId(req.user.id);
    
    if (!seller) {
      return res.status(404).json({ error: "Publisher seller not found" });
    }
    
    // Generate a new verification code
    const verificationCode = await dbStorage.generateVerificationCode(req.user.id);
    
    res.json({ verificationCode });
  } catch (error) {
    console.error("Error generating verification code:", error);
    res.status(500).json({ error: "Failed to generate verification code" });
  }
});

// Verify a publisher seller code
router.post("/verify-publisher-seller", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Validate the request body
    const schema = z.object({
      verificationCode: z.string().min(1, "Verification code is required")
    });
    
    const data = schema.parse(req.body);
    
    // Verify the code and get the seller
    const seller = await dbStorage.getPublisherSellerByVerificationCode(data.verificationCode);
    
    if (!seller) {
      return res.status(404).json({ error: "Invalid verification code" });
    }
    
    // Check if the seller is active
    if (seller.status !== "active") {
      return res.status(403).json({ error: "Publisher seller account is not active" });
    }
    
    // Return the verified seller info
    res.json({
      verified: true,
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        company: seller.company
      }
    });
  } catch (error) {
    console.error("Error verifying publisher seller:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to verify publisher seller" });
  }
});

// Become a publisher (now requires verification code)
router.post("/become-publisher", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is already a publisher
    const isExistingPublisher = await dbStorage.isUserPublisher(req.user.id);
    
    if (isExistingPublisher) {
      return res.status(400).json({ error: "User is already registered as a publisher" });
    }
    
    // Validate the request body which must now include a verification code
    const schema = z.object({
      name: z.string().optional(),
      publisher_name: z.string().min(1, "Publisher name is required"),
      publisher_description: z.string().optional(),
      description: z.string().optional(),
      business_email: z.string().email("Invalid email format").optional(),
      business_phone: z.string().optional(),
      business_address: z.string().optional(),
      website: z.string().url("Invalid URL format").optional(),
      logoUrl: z.string().optional(),
      verificationCode: z.string().min(1, "Verification code is required")
    });
    
    const data = schema.parse(req.body);
    
    // Verify the publisher seller code
    const seller = await dbStorage.getPublisherSellerByVerificationCode(data.verificationCode);
    
    if (!seller) {
      return res.status(403).json({ error: "Invalid verification code" });
    }
    
    // Check if the seller is active
    if (seller.status !== "active") {
      return res.status(403).json({ error: "This seller account is not active and cannot authorize new publishers" });
    }
    
    // Prepare publisher data
    const publisherData = insertPublisherSchema.parse({
      userId: req.user.id,
      name: data.name || req.user.username || req.user.email.split('@')[0],
      publisher_name: data.publisher_name,
      publisher_description: data.publisher_description || "",
      description: data.description || "",
      business_email: data.business_email || req.user.email,
      business_phone: data.business_phone || "",
      business_address: data.business_address || "",
      website: data.website || "",
      logoUrl: data.logoUrl || "",
    });
    
    // Create a new publisher record
    const publisher = await dbStorage.createPublisher(publisherData);
    
    // Invalidate the verification code to prevent reuse
    await dbStorage.updatePublisherSeller(seller.id, {
      verification_code: "" // Empty the verification code
    });
    
    // Return the new publisher with seller info
    res.status(201).json({
      publisher,
      verifiedBy: {
        sellerName: seller.name,
        sellerCompany: seller.company
      }
    });
  } catch (error) {
    console.error("Error creating publisher:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to register as a publisher" });
  }
});

// Get author profile
router.get("/author-profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is an author
    const author = await dbStorage.getAuthorByUserId(req.user.id);
    
    if (!author) {
      return res.status(404).json({ error: "Author profile not found" });
    }
    
    res.json(author);
  } catch (error) {
    console.error("Error getting author profile:", error);
    res.status(500).json({ error: "Failed to get author profile" });
  }
});

// Get publisher profile
router.get("/publisher-profile", async (req: Request, res: Response) => {
  // Explicitly set content type for this route
  res.setHeader('Content-Type', 'application/json');
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is a publisher
    const publisher = await dbStorage.getPublisherByUserId(req.user.id);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher profile not found" });
    }
    
    return res.json(publisher);
  } catch (error) {
    console.error("Error getting publisher profile:", error);
    return res.status(500).json({ error: "Failed to get publisher profile" });
  }
});

// Get publisher seller profile
router.get("/publisher-seller-profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is a publisher seller
    const seller = await dbStorage.getSellerByUserId(req.user.id);
    
    if (!seller) {
      return res.status(404).json({ error: "Publisher seller profile not found" });
    }
    
    res.json(seller);
  } catch (error) {
    console.error("Error getting publisher seller profile:", error);
    res.status(500).json({ error: "Failed to get publisher seller profile" });
  }
});

// Get seller verification codes
router.get("/verification-codes", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is a seller
    const seller = await dbStorage.getSellerByUserId(req.user.id);
    
    if (!seller) {
      return res.status(404).json({ error: "Seller profile not found" });
    }
    
    // Get the verification codes for this seller
    const codes = await dbStorage.getSellerVerificationCodes(seller.id);
    
    res.json(codes);
  } catch (error) {
    console.error("Error getting verification codes:", error);
    res.status(500).json({ error: "Failed to get verification codes" });
  }
});

// Generate a new verification code
router.post("/generate-verification-code", async (req: Request, res: Response) => {
  // Explicitly set the content type to application/json for this endpoint
  res.setHeader('Content-Type', 'application/json');
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    console.log("Generating verification code for user:", req.user.id);
    
    // Check if the user is a seller
    const seller = await dbStorage.getSellerByUserId(req.user.id);
    
    if (!seller) {
      console.log("Seller profile not found for user:", req.user.id);
      return res.status(404).json({ error: "Seller profile not found" });
    }
    
    console.log("Found seller profile:", seller.id);
    
    // Generate a new verification code
    const code = await dbStorage.createPublisherSellerVerificationCode(seller.id);
    
    console.log("Generated verification code:", code);
    
    if (!code) {
      return res.status(500).json({ error: "Failed to generate verification code" });
    }
    
    // Return a formatted response
    return res.status(200).json({
      id: code.id,
      sellerId: code.sellerId,
      verification_code: code.verification_code,
      createdAt: code.createdAt
    });
  } catch (error) {
    console.error("Error generating verification code:", error);
    // Ensure we're still sending JSON even for errors
    return res.status(500).json({ 
      error: "Failed to generate verification code",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get publishers verified by this seller
router.get("/verified-publishers", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is a seller
    const seller = await dbStorage.getSellerByUserId(req.user.id);
    
    if (!seller) {
      // If not a seller, return all publishers (default behavior)
      const publishers = await dbStorage.getPublishers();
      return res.json(publishers);
    }
    
    // Get publishers verified by this seller
    const verifiedPublishers = await dbStorage.getVerifiedPublishers(seller.id);
    res.json(verifiedPublishers);
  } catch (error) {
    console.error("Error getting verified publishers:", error);
    res.status(500).json({ error: "Failed to get verified publishers" });
  }
});

// Update publisher seller profile
router.patch("/publisher-seller-profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is a publisher seller
    const seller = await dbStorage.getPublisherSellerByUserId(req.user.id);
    
    if (!seller) {
      return res.status(404).json({ error: "Publisher seller profile not found" });
    }
    
    // Validate update data
    const schema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email("Invalid email format").optional(),
      company: z.string().min(1).optional(),
      notes: z.string().optional()
    });
    
    const data = schema.parse(req.body);
    
    // Update seller profile
    const updatedSeller = await dbStorage.updatePublisherSeller(seller.id, data);
    
    res.json(updatedSeller);
  } catch (error) {
    console.error("Error updating publisher seller profile:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data format", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update publisher seller profile" });
  }
});

// Upload author profile image
router.post("/author-profile-image", profileImageUpload.single('profileImage'), async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Get author profile
    const author = await dbStorage.getAuthorByUserId(req.user.id);
    
    if (!author) {
      return res.status(404).json({ error: "Author profile not found" });
    }
    
    // Create profile image URL path
    const author_image_url = `/uploads/profile-images/${req.file.filename}`;
    
    // Update author profile image URL in database
    await db
      .update(authors)
      .set({ author_image_url })
      .where(eq(authors.id, author.id));
    
    res.status(200).json({ author_image_url });
  } catch (error) {
    console.error("Error uploading author profile image:", error);
    res.status(500).json({ error: "Failed to upload author profile image" });
  }
});

// Update author profile
router.patch("/author-profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is an author
    const author = await dbStorage.getAuthorByUserId(req.user.id);
    
    if (!author) {
      return res.status(404).json({ error: "Author profile not found" });
    }
    
    // Update author profile
    const updatedAuthor = await dbStorage.updateAuthor(author.id, req.body);
    
    res.json(updatedAuthor);
  } catch (error) {
    console.error("Error updating author profile:", error);
    res.status(500).json({ error: "Failed to update author profile" });
  }
});

// Update publisher profile
router.patch("/publisher-profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if the user is a publisher
    const publisher = await dbStorage.getPublisherByUserId(req.user.id);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher profile not found" });
    }
    
    // Update publisher profile
    const updatedPublisher = await dbStorage.updatePublisher(publisher.id, req.body);
    
    res.json(updatedPublisher);
  } catch (error) {
    console.error("Error updating publisher profile:", error);
    res.status(500).json({ error: "Failed to update publisher profile" });
  }
});

// Upload profile image
router.post("/user/profile-image", profileImageUpload.single('profileImage'), async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Create profile image URL path
    const profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
    
    // Update user profile image URL in database
    await db
      .update(users)
      .set({ profileImageUrl })
      .where(eq(users.id, req.user.id));
    
    // Get updated user to verify changes
    const updatedUser = await dbStorage.getUser(req.user.id);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update the session user object with new profile image URL
    req.user.profileImageUrl = profileImageUrl;
    
    console.log(`Profile image updated for user ${req.user.id}: ${profileImageUrl}`);
    
    // Return success response with new profile image URL
    res.json({ profileImageUrl });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({ error: "Failed to upload profile image" });
  }
});

export default router;