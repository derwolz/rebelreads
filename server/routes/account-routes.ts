import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users, userGenreViews, viewGenres, insertAuthorSchema } from "@shared/schema";
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
    
    // Here you would handle other profile updates
    // by validating with updateProfileSchema
    
    // For now, just return the current user
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