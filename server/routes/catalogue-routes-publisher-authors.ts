import { Router, Request, Response } from "express";
import { z } from "zod";
import { dbStorage } from "../storage";
import { requirePublisher } from "../middleware/author-auth";
import { db } from "../db";
import { authors, users, publishersAuthors, publishers } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { hashPassword } from "../auth";

const router = Router();

// Configure multer for author image uploads
const uploadsDir = "./uploads";
const profileImagesDir = path.join(uploadsDir, "profile-images");

// Ensure profile-images directory exists
[uploadsDir, profileImagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const authorImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profileImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const authorImageUpload = multer({
  storage: authorImageStorage,
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

// Define author schema for validation
const authorSchema = z.object({
  author_name: z.string().min(1, "Author name is required"),
  author_image: z.any().optional(),
  bio: z.string().optional(),
  birth_date: z.string().optional().transform(val => val ? new Date(val) : undefined),
  death_date: z.string().optional().transform(val => val ? new Date(val) : undefined),
  website: z.string().url().optional(),
});

// Helper to create a user for an author if needed
async function createAuthorUser(authorName: string, publisherDomain: string): Promise<{ id: number, email: string, password: string }> {
  // Generate a base username from the author name
  let baseUsername = authorName.toLowerCase().replace(/\s+/g, '');
  let username = baseUsername;
  let counter = 1;
  
  // Check if username exists and increment if needed
  while (await dbStorage.getUserByUsername(username)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  // Create email and password based on specifications
  const email = `${baseUsername}@${publisherDomain}`;
  const plainPassword = `${publisherDomain}_${baseUsername}`;
  const password = await hashPassword(plainPassword);
  
  // Create the user
  const user = await dbStorage.createUser({
    username,
    email,
    password,
    newsletterOptIn: false,
  });
  
  return { id: user.id, email, password: plainPassword };
}

/**
 * POST /api/catalogue/publishers/authors
 * Add multiple authors to a publisher
 * Protected route: Requires publisher authentication
 */
router.post("/", requirePublisher, authorImageUpload.single('author_image'), async (req: Request, res: Response) => {
  try {
    // Verify the user is a publisher
    const publisher = await dbStorage.getPublisherByUserId(req.user!.id);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher profile not found" });
    }
    
    // Extract publisher domain from website or business_email for user credentials
    let publisherDomain = "";
    if (publisher.website) {
      try {
        const url = new URL(publisher.website);
        publisherDomain = url.hostname.replace(/^www\./, '');
      } catch (e) {
        // Invalid URL, try to extract from email
      }
    }
    
    if (!publisherDomain && publisher.business_email) {
      const emailParts = publisher.business_email.split('@');
      if (emailParts.length > 1) {
        publisherDomain = emailParts[1];
      }
    }
    
    if (!publisherDomain) {
      return res.status(400).json({ error: "Could not determine publisher domain from website or email" });
    }
    
    // Parse and validate the author data
    let authorData;
    try {
      authorData = authorSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid author data", details: error.errors });
      }
      throw error;
    }
    
    // Handle author image if uploaded
    let authorImageUrl = null;
    if (req.file) {
      authorImageUrl = `/uploads/profile-images/${req.file.filename}`;
    }
    
    // Create a user for the author
    let userData;
    try {
      userData = await createAuthorUser(authorData.author_name, publisherDomain);
    } catch (error) {
      console.error("Error creating author user:", error);
      return res.status(500).json({ error: "Failed to create author user account" });
    }
    
    // Create the author record
    const author = await dbStorage.createAuthor({
      userId: userData.id,
      author_name: authorData.author_name,
      author_image_url: authorImageUrl,
      bio: authorData.bio,
      birth_date: authorData.birth_date,
      death_date: authorData.death_date,
      website: authorData.website,
    });
    
    // Associate the author with the publisher
    await dbStorage.addAuthorToPublisher(
      publisher.id,
      author.id,
      new Date()
    );
    
    // Return the author with credentials
    res.status(201).json({
      author,
      credentials: {
        email: userData.email,
        password: userData.password
      }
    });
  } catch (error) {
    console.error("Error creating author:", error);
    res.status(500).json({ error: "Failed to create author" });
  }
});

/**
 * PUT /api/catalogue/publishers/authors/:id
 * Update an author associated with a publisher
 * Protected route: Requires publisher authentication
 */
router.put("/:id", requirePublisher, authorImageUpload.single('author_image'), async (req: Request, res: Response) => {
  try {
    const authorId = parseInt(req.params.id);
    
    if (isNaN(authorId)) {
      return res.status(400).json({ error: "Invalid author ID" });
    }
    
    // Verify the user is a publisher
    const publisher = await dbStorage.getPublisherByUserId(req.user!.id);
    
    if (!publisher) {
      return res.status(404).json({ error: "Publisher profile not found" });
    }
    
    // Verify the author exists
    const author = await dbStorage.getAuthor(authorId);
    
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Verify the author is associated with this publisher
    const publisherAuthors = await dbStorage.getPublisherAuthors(publisher.id);
    const isAuthorWithPublisher = publisherAuthors.some(a => a.id === authorId);
    
    if (!isAuthorWithPublisher) {
      return res.status(403).json({ error: "This author is not associated with your publisher account" });
    }
    
    // Parse and validate the author data
    let authorData;
    try {
      authorData = authorSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid author data", details: error.errors });
      }
      throw error;
    }
    
    // Handle author image if uploaded
    let authorImageUrl = author.author_image_url;
    if (req.file) {
      authorImageUrl = `/uploads/profile-images/${req.file.filename}`;
    }
    
    // Update the author record
    const updatedAuthor = await dbStorage.updateAuthor(author.id, {
      author_name: authorData.author_name,
      author_image_url: authorImageUrl,
      bio: authorData.bio,
      birth_date: authorData.birth_date,
      death_date: authorData.death_date,
      website: authorData.website,
    });
    
    // Return the updated author
    res.status(200).json({ author: updatedAuthor });
  } catch (error) {
    console.error("Error updating author:", error);
    res.status(500).json({ error: "Failed to update author" });
  }
});

export default router;