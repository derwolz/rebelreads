import { Router, Request, Response } from "express";
import { dbStorage } from "../../storage";
import multer from "multer";
import { enhanceReferralLinks } from "../../utils/favicon-utils";
import { applyContentFilters } from "../../utils/content-filters";
import { and, eq } from "drizzle-orm";
import { sirenedImageBucket } from "../../services/sirened-image-bucket";
import { db } from "../../db";
import { insertReferralClickSchema, referralClicks } from "@shared/schema";

// Configure multer for in-memory uploads (for use with object storage)
// Create a field name filter that accepts form fields matching bookImage_ pattern
const bookImageFieldFilter = (fieldname: string) => {
  return fieldname.startsWith('bookImage_');
};

// Multer for single file upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB size limit (increased for full resolution images)
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Multer for multiple book images with dynamic field names
const multipleImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB size limit (increased for full resolution images)
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
}).fields([
  { name: 'bookImage_full', maxCount: 1 },           // The high-resolution book cover image
  { name: 'bookImage_background', maxCount: 1 },
  { name: 'bookImage_spine', maxCount: 1 },
  { name: 'bookImage_hero', maxCount: 1 },
  // We still accept these but they're optional now as they'll be auto-generated
  { name: 'bookImage_book-card', maxCount: 1 },
  { name: 'bookImage_mini', maxCount: 1 }
]);

const router = Router();

/**
 * GET /api/books
 * Get books with query parameters
 * Supports pagination and filtering to prevent exposing the entire database
 * Public endpoint - no authentication required
 */
router.get("/", async (req, res) => {
  try {
    // Get query parameters for pagination and filtering
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const genre = req.query.genre as string || null;
    const authorName = req.query.authorName as string || null;
    
    // Validate pagination parameters
    if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
      return res.status(400).json({ error: "Invalid pagination parameters" });
    }
    
    // Require at least one filter parameter to prevent full database exposure
    if (!genre && !authorName && !req.query.promoted && !req.query.recent) {
      return res.status(400).json({ 
        error: "Query parameters required",
        message: "Please provide at least one filter parameter (genre, authorName, promoted=true, or recent=true)"
      });
    }
    
    // Get filtered and paginated books
    const books = await dbStorage.getBooks();
    
    // Apply manual filtering based on query parameters
    let filteredBooks = books;
    
    // Filter by genre if specified
    if (genre) {
      // Get all book IDs first
      const bookIds = filteredBooks.map(book => book.id);
      
      // Fetch taxonomy data for these books
      const bookTaxonomies = await Promise.all(
        bookIds.map(async (bookId) => {
          const taxonomies = await dbStorage.getBookTaxonomies(bookId);
          return { bookId, taxonomies };
        })
      );
      
      // Create a map of book ID to genres
      const bookGenresMap = new Map();
      bookTaxonomies.forEach(item => {
        const genres = item.taxonomies
          .filter(tax => tax.type === 'genre')
          .map(tax => tax.name.toLowerCase());
        bookGenresMap.set(item.bookId, genres);
      });
      
      // Filter books by genre
      filteredBooks = filteredBooks.filter(book => {
        const bookGenres = bookGenresMap.get(book.id) || [];
        return bookGenres.includes(genre.toLowerCase());
      });
    }
    
    // Filter by author name if specified
    if (authorName) {
      filteredBooks = filteredBooks.filter(book => 
        book.authorName?.toLowerCase().includes(authorName.toLowerCase())
      );
    }
    
    // Filter to promoted books only if specified
    if (req.query.promoted === 'true') {
      filteredBooks = filteredBooks.filter(book => book.promoted);
    }
    
    // Filter to recent books if specified
    if (req.query.recent === 'true') {
      // Sort by published date
      filteredBooks = filteredBooks
        .filter(book => book.publishedDate)
        .sort((a, b) => {
          if (!a.publishedDate || !b.publishedDate) return 0;
          return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        });
    }
    
    // Apply content filtering if user is authenticated
    if (req.isAuthenticated() && req.user) {
      // Extract book IDs from filtered results
      const bookIds = filteredBooks.map(book => book.id);
      
      // Apply content filters
      const filteredBookIds = await applyContentFilters(req.user.id, bookIds);
      
      // Filter out blocked books
      filteredBooks = filteredBooks.filter(book => filteredBookIds.includes(book.id));
    }
    
    // Apply pagination
    const paginatedBooks = filteredBooks.slice(offset, offset + limit);
    
    // Return books with metadata
    res.json({
      books: paginatedBooks,
      metadata: {
        total: filteredBooks.length,
        limit,
        offset,
        hasMore: (offset + limit) < filteredBooks.length
      }
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

/**
 * GET /api/books/:id
 * Direct ID-based access has been removed to prevent scraping attacks
 */
router.get("/:id([0-9]+)", async (req, res) => {
  // This will catch direct numeric IDs only, like /books/1
  // Other routes like /:id/ratings will still work
  return res.status(404).json({ error: "Not found - Direct ID access is not permitted" });
});

/**
 * GET /api/book-details
 * Get book details by author name and title via query parameters
 * This route provides an alternative way to access book details that is harder to scrape
 * Example: /api/book-details?authorName=King%20Stanky&bookTitle=Valkyrie%20X%20Truck
 * 
 * Public endpoint - no authentication required
 */
router.get("/book-details", async (req, res) => {
  const { authorName, bookTitle } = req.query;
  
  // Validate required query parameters
  if (!authorName || !bookTitle) {
    return res.status(400).json({ error: "Both authorName and bookTitle query parameters are required" });
  }
  
  try {
    // Get book by author name and title
    const book = await dbStorage.getBookByAuthorAndTitle(authorName as string, bookTitle as string);
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Record an impression if the book is found and user is authenticated
    if (req.isAuthenticated() && req.user && book.id) {
      try {
        await dbStorage.recordBookImpression(book.id, req.user.id, "query-parameters");
      } catch (impressionError) {
        console.error("Error recording impression:", impressionError);
        // Non-critical error, continue with the response
      }
    }
    
    res.json(book);
  } catch (error) {
    console.error(`Error fetching book with authorName: ${authorName}, title: ${bookTitle}:`, error);
    res.status(500).json({ error: "Failed to fetch book details" });
  }
});

/**
 * GET /api/recommendations
 * Get recommended books for logged-in user
 * Authentication required
 */
router.get("/recommendations", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const userId = req.user!.id;
    const recommendations = await dbStorage.getRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

/**
 * GET /api/coming-soon
 * Get a list of upcoming books with future publication dates
 * Public endpoint - no authentication required
 */
router.get("/coming-soon", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const comingSoonBooks = await dbStorage.getComingSoonBooks(limit);
    res.json(comingSoonBooks);
  } catch (error) {
    console.error("Error getting coming soon books:", error);
    res.status(500).json({ error: "Failed to get coming soon books" });
  }
});

/**
 * GET /api/books/:id/taxonomies
 * Get taxonomies for a specific book
 * Public endpoint - no authentication required
 */
router.get("/:id/taxonomies", async (req, res) => {
  // Public endpoint - no authentication required
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  try {
    // Check if the bookId exists first
    const book = await dbStorage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    const taxonomies = await dbStorage.getBookTaxonomies(bookId);
    return res.json(taxonomies);
  } catch (error) {
    console.error("Error fetching book taxonomies:", error);
    return res.status(500).json({ error: "Failed to fetch book taxonomies" });
  }
});

/**
 * GET /api/books/:id/author
 * Get author details for a specific book
 * Public endpoint - no authentication required
 */
router.get("/:id/author", async (req, res) => {
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  try {
    // Check if the bookId exists first
    const book = await dbStorage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Get the author for this book
    const author = await dbStorage.getAuthor(book.authorId);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    return res.json(author);
  } catch (error) {
    console.error("Error fetching book author:", error);
    return res.status(500).json({ error: "Failed to fetch book author" });
  }
});

/**
 * GET /api/my-books
 * Get all books by the logged-in author
 * Authentication required
 */
router.get("/my-books", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  // Get the author ID from the user ID
  const author = await dbStorage.getAuthorByUserId(req.user!.id);
  
  if (!author) {
    return res.status(403).json({ error: "User is not an author or author record not found" });
  }
  
  const books = await dbStorage.getBooksByAuthor(author.id);
  res.json(books);
});

/**
 * POST /api/books
 * Create a new book
 * Authentication and author status required
 */
router.post("/", multipleImageUpload, async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(401);
  }

  try {
    // Check if we have at least one image
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "At least one book image is required" });
    }

    // Parse form data fields
    const formats = req.body.formats ? JSON.parse(req.body.formats) : [];
    const characters = req.body.characters ? JSON.parse(req.body.characters) : [];
    const awards = req.body.awards ? JSON.parse(req.body.awards) : [];
    const publishedDate = req.body.publishedDate ? new Date(req.body.publishedDate) : null;
    
    // Extract and handle taxonomy data separately
    const genreTaxonomies = req.body.genreTaxonomies ? JSON.parse(req.body.genreTaxonomies) : [];
    
    // Process referral links if present
    let referralLinks = [];
    if (req.body.referralLinks) {
      try {
        const parsedLinks = JSON.parse(req.body.referralLinks);
        // Enhance with domain and favicon information
        referralLinks = await enhanceReferralLinks(parsedLinks);
      } catch (error) {
        console.error("Error processing referral links:", error);
      }
    }

    // Get the author ID from the user ID (not using user.id directly since we need author.id)
    const author = await dbStorage.getAuthorByUserId(req.user!.id);
    
    if (!author) {
      return res.status(403).json({ error: "User is not an author or author record not found" });
    }
    
    // Create the book first (without taxonomies and without cover URL)
    const book = await dbStorage.createBook({
      title: req.body.title,
      description: req.body.description,
      authorId: author.id, // Use the author ID instead of the user ID
      referralLinks: referralLinks,
      formats: formats,
      promoted: false,
      pageCount: req.body.pageCount ? parseInt(req.body.pageCount) : null,
      publishedDate,
      awards,
      originalTitle: req.body.originalTitle || null,
      series: req.body.series || null,
      setting: req.body.setting || null,
      characters,
      isbn: req.body.isbn || null,
      asin: req.body.asin || null,
      language: req.body.language || "English",
    });

    // Now process all uploaded images and add them to book_images table
    const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] };
    const bookImageEntries = [];

    // Track if we have a full image to use for auto-generation
    let fullImageFile: Express.Multer.File | null = null;
    let fullImageUrl: string = '';

    // First pass: process the uploaded files and look for the full high-res image
    for (const fieldName in uploadedFiles) {
      if (fieldName.startsWith('bookImage_')) {
        const imageType = fieldName.replace('bookImage_', '');
        const file = uploadedFiles[fieldName][0]; // Get first file from array
        
        // Store the full image file for resizing
        if (imageType === 'full') {
          fullImageFile = file;
        }
      }
    }

    // Process all image types with book ID now available
    console.log(`Processing ${Object.keys(uploadedFiles).length} image types for book ID ${book.id}`);
    
    for (const fieldName in uploadedFiles) {
      if (fieldName.startsWith('bookImage_')) {
        const imageType = fieldName.replace('bookImage_', '') as any;
        const file = uploadedFiles[fieldName][0]; // Get first file from array
        
        console.log(`Uploading ${imageType} image for book ID ${book.id}`);
        
        try {
          // Upload to object storage using SirenedImageBucket with book ID
          const storageKey = await sirenedImageBucket.uploadBookImage(file, imageType, book.id);
          const imageUrl = await sirenedImageBucket.getPublicUrl(storageKey);
          
          // Store full image URL for auto-generation
          if (imageType === 'full') {
            fullImageUrl = imageUrl;
          }
          
          // Add to database with imageType and correct dimensions
          let width = 0;
          let height = 0;
          switch (imageType) {
            case 'full':
              width = 1600;
              height = 2560;
              break;
            case 'background':
              width = 1300;
              height = 1500;
              break;
            case 'spine':
              width = 56;
              height = 212;
              break;
            case 'hero':
              width = 1500;
              height = 600;
              break;
            case 'book-card':
              width = 260;
              height = 435;
              break;
            case 'mini':
              width = 64;
              height = 40;
              break;
            default:
              // Default sizes if not recognized
              width = 100;
              height = 100;
          }
          
          const bookImage = await dbStorage.addBookImage({
            bookId: book.id,
            imageUrl,
            imageType,
            width,
            height,
            sizeKb: Math.round(file.size / 1024),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          bookImageEntries.push(bookImage);
        } catch (uploadError) {
          console.error(`Error uploading ${imageType} image for book ID ${book.id}:`, uploadError);
          // Continue with other images even if one fails
        }
      }
    }

    // Generate derived images from the full image if available
    if (fullImageFile && fullImageUrl) {
      try {
        // Call function to auto-generate other image types from the full image
        const generatedImages = await sirenedImageBucket.generateAdditionalBookImages(fullImageFile, book.id);
        
        // We no longer generate or store a separate book-detail image
        // The book-detail view will use the full image directly
        
        // Add book-card image to database if generated
        if (generatedImages.bookCard) {
          try {
            const bookCardImage = await dbStorage.addBookImage({
              bookId: book.id,
              imageUrl: generatedImages.bookCard.publicUrl,
              imageType: 'book-card',
              width: 260,  // New width for book-card
              height: 435, // New height for book-card
              sizeKb: Math.round(fullImageFile.size / 8), // Estimate size based on original
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            bookImageEntries.push(bookCardImage);
          } catch (err) {
            console.error(`Error adding book-card image to database:`, err);
          }
        }
        
        // Add mini image to database if generated
        if (generatedImages.mini) {
          try {
            const miniImage = await dbStorage.addBookImage({
              bookId: book.id,
              imageUrl: generatedImages.mini.publicUrl,
              imageType: 'mini',
              width: 64,   // New width for mini
              height: 40,  // New height for mini
              sizeKb: Math.round(fullImageFile.size / 16), // Estimate size based on original
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            bookImageEntries.push(miniImage);
          } catch (err) {
            console.error(`Error adding mini image to database:`, err);
          }
        }
      } catch (genError) {
        console.error(`Error generating additional book images from full image:`, genError);
      }
    }

    // Add genre taxonomies for the book if provided
    if (genreTaxonomies.length > 0) {
      try {
        await dbStorage.updateBookTaxonomies(book.id, genreTaxonomies);
      } catch (taxError) {
        console.error(`Error updating book taxonomies:`, taxError);
      }
    }

    // Return the fully created book with images
    const fullBook = await dbStorage.getBook(book.id);
    res.status(201).json(fullBook);
  } catch (error: any) {
    console.error("Error creating book:", error);
    res.status(500).json({ error: error.message || "Failed to create book" });
  }
});

/**
 * POST /api/books/:id/impression
 * Record an impression for a book
 * Authentication required
 */
router.post("/:id/impression", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }
  
  try {
    const type = req.body.type || "view"; // Default to 'view' if no type provided
    const weight = req.body.weight || 0; // Default to 0 if no weight provided
    const source = req.body.source || "unknown"; // Source of the impression
    const context = req.body.context || "unknown"; // Context of the impression
    
    // Enhanced tracking data
    const position = req.body.position; // Position in container (optional)
    const container_type = req.body.container_type; // Type of container (optional)
    const container_id = req.body.container_id; // ID of container (optional)
    const metadata = req.body.metadata || {}; // Additional metadata (optional)
    
    const impression = await dbStorage.recordBookImpression(
      bookId, 
      req.user!.id, 
      source, 
      context,
      type,
      weight,
      position,
      container_type,
      container_id,
      metadata
    );
    
    res.status(201).json(impression);
  } catch (error: any) {
    console.error(`Error recording book impression:`, error);
    res.status(500).json({ error: error.message || "Failed to record impression" });
  }
});

/**
 * POST /api/books/:id/click-through
 * Record a click-through for a book (e.g., clicking on a referral link)
 * Authentication required
 */
router.post("/:id/click-through", async (req, res) => {
  // Anonymous click-throughs are allowed, but we'll track user if authenticated
  const userId = req.isAuthenticated() ? req.user!.id : null;
  
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }
  
  try {
    // Get source, referrer, and container data
    const source = req.body.source || "unknown";
    const referrer = req.body.referrer || "unknown";
    
    // Enhanced tracking data
    const position = req.body.position; // Position in container (optional)
    const container_type = req.body.container_type; // Type of container (optional)
    const container_id = req.body.container_id; // ID of container (optional)
    const metadata = req.body.metadata || {}; // Additional metadata (optional)
    
    // Check if this is a referral link click or a regular book card click
    const isReferralLink = req.body.isReferral === true;
    
    // Only require referralDomain for actual external referral links
    if (isReferralLink && !metadata.referralDomain) {
      return res.status(400).json({ 
        error: "metadata.referralDomain is required for referral links" 
      });
    }
    
    // Record as an impression with type 'referral_click' and weight 1.0
    if (userId) {
      await dbStorage.recordBookImpression(
        bookId, 
        userId, 
        source, 
        referrer, // Use referrer as context
        "referral_click",
        1.0,
        position,
        container_type,
        container_id,
        metadata
      );
    }
    
    // Record the actual click-through
    const clickThrough = await dbStorage.recordBookClickThrough(
      bookId, 
      userId,
      source,
      referrer,
      position,
      container_type,
      container_id,
      metadata
    );
    
    res.status(201).json(clickThrough);
  } catch (error: any) {
    console.error(`Error recording click-through:`, error);
    res.status(500).json({ error: error.message || "Failed to record click-through" });
  }
});

/**
 * POST /api/books/:id/referral-click
 * Record a referral click in the dedicated referral_clicks table
 * This is a new endpoint specifically for tracking external referral links with domain info
 */
router.post("/:id/referral-click", async (req, res) => {
  // Allow anonymous tracking but record user ID if authenticated
  const userId = req.isAuthenticated() ? req.user!.id : null;
  
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }
  
  try {
    // Extract required data from request body
    const {
      sourceContext,   // Where the click came from (e.g., book-details, book-shelf/share)
      retailerName,    // Name of the retailer (Amazon, Barnes & Noble, etc.)
      targetDomain,    // The domain of the destination URL (e.g., amazon.com)
      targetSubdomain, // Optional subdomain (e.g., www, smile)
      targetUrl,       // The full destination URL
      deviceInfo,      // Optional device information
      metadata         // Any additional tracking data
    } = req.body;
    
    // Validate required fields
    if (!sourceContext || !retailerName || !targetDomain || !targetUrl) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "sourceContext, retailerName, targetDomain, and targetUrl are required"
      });
    }
    
    // Validate URL format
    try {
      new URL(targetUrl);
    } catch (urlError) {
      return res.status(400).json({
        error: "Invalid URL format",
        message: "targetUrl must be a valid URL"
      });
    }
    
    // Insert the referral click record
    const result = await db.insert(referralClicks).values({
      bookId,
      userId,
      sourceContext,
      retailerName,
      targetDomain,
      targetSubdomain: targetSubdomain || null,
      targetUrl,
      deviceInfo: deviceInfo || {},
      metadata: metadata || {}
    }).returning();
    
    // Return the created referral click record
    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error(`Error recording referral click:`, error);
    res.status(500).json({ error: error.message || "Failed to record referral click" });
  }
});

/**
 * PATCH /api/books/:id
 * Update an existing book
 * Authentication and author status required
 */
router.patch("/:id", multipleImageUpload, async (req, res) => {
  // Set content type right away to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    // Parse the ID from the URL
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    // Get the book to verify ownership
    const book = await dbStorage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Get the author ID from the user ID
    const author = await dbStorage.getAuthorByUserId(req.user!.id);
    if (!author) {
      return res.status(403).json({ error: "Author record not found" });
    }

    // Verify the author owns this book
    if (book.authorId !== author.id) {
      return res.status(403).json({ error: "You do not have permission to update this book" });
    }

    console.log("Processing PATCH request for book ID:", bookId);
    console.log("Request Content-Type:", req.get('Content-Type'));
    
    // Create an object to hold all the updated fields
    const updatedFields: any = {};

    // Process form data or JSON depending on content type
    if (req.is('multipart/form-data')) {
      console.log("Processing multipart form data");
      
      // Handle simple fields
      for (const key in req.body) {
        // Skip empty values
        if (req.body[key] === '' || req.body[key] === undefined) continue;
        
        // Handle fields that need to be parsed from JSON strings
        if (['formats', 'characters', 'awards', 'genreTaxonomies', 'referralLinks'].includes(key)) {
          try {
            updatedFields[key] = JSON.parse(req.body[key]);
          } catch (e) {
            console.error(`Error parsing JSON field ${key}:`, e);
          }
        } else if (key === 'publishedDate') {
          updatedFields[key] = new Date(req.body[key]);
        } else if (key === 'pageCount') {
          updatedFields[key] = parseInt(req.body[key]);
        } else {
          updatedFields[key] = req.body[key];
        }
      }
      
      // Process uploaded files if any
      const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (uploadedFiles && Object.keys(uploadedFiles).length > 0) {
        console.log("Processing uploaded files:", Object.keys(uploadedFiles));
        // Process book images similar to the POST endpoint
        for (const fieldName in uploadedFiles) {
          if (fieldName.startsWith('bookImage_')) {
            const imageType = fieldName.replace('bookImage_', '') as any;
            const file = uploadedFiles[fieldName][0]; // Get first file from array
            
            console.log(`Uploading ${imageType} image for book ID ${bookId}`);
            
            try {
              // Upload to object storage using SirenedImageBucket with book ID
              const storageKey = await sirenedImageBucket.uploadBookImage(file, imageType, bookId);
              const imageUrl = await sirenedImageBucket.getPublicUrl(storageKey);
              
              // Store the image URL in the database separately
              await dbStorage.addBookImage(bookId, imageType, imageUrl);
            } catch (e) {
              console.error(`Error uploading image ${imageType}:`, e);
            }
          }
        }
      }
    } else {
      // If not multipart, assume it's JSON
      console.log("Processing JSON data");
      Object.assign(updatedFields, req.body);
    }

    console.log("Fields to update:", Object.keys(updatedFields));
    
    // Process referral links if present
    if (updatedFields.referralLinks) {
      try {
        updatedFields.referralLinks = await enhanceReferralLinks(updatedFields.referralLinks);
      } catch (error) {
        console.error("Error processing referral links:", error);
      }
    }

    // Update the book
    const updatedBook = await dbStorage.updateBook(bookId, updatedFields);
    
    // Handle taxonomy data if present
    if (updatedFields.genreTaxonomies && Array.isArray(updatedFields.genreTaxonomies)) {
      await dbStorage.updateBookTaxonomies(bookId, updatedFields.genreTaxonomies);
    }

    console.log("Book updated successfully:", bookId);
    return res.status(200).json(updatedBook);
  } catch (error) {
    console.error("Error updating book:", error);
    return res.status(500).json({ error: "Failed to update book" });
  }
});

/**
 * DELETE /api/books/:id
 * Delete a book
 * Authentication and author status required
 */
router.delete("/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }
  
  try {
    // Get the book to check if the user is the author
    const book = await dbStorage.getBook(bookId);
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Get the author ID for the current user
    const author = await dbStorage.getAuthorByUserId(req.user!.id);
    
    if (!author) {
      return res.status(403).json({ error: "User is not an author" });
    }
    
    // Check if the user is the book's author or has admin privileges
    if (book.authorId !== author.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: "You are not authorized to delete this book" });
    }
    
    // Delete the book
    await dbStorage.deleteBook(bookId, author.id);
    
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting book:`, error);
    res.status(500).json({ error: error.message || "Failed to delete book" });
  }
});

/**
 * GET /api/books/:id/reading-status
 * Get the reading status for a book
 * Authentication required
 */
router.get("/:id/reading-status", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }
  
  try {
    const status = await dbStorage.getReadingStatus(req.user!.id, bookId);
    res.json(status);
  } catch (error: any) {
    console.error(`Error getting reading status:`, error);
    res.status(500).json({ error: error.message || "Failed to get reading status" });
  }
});

/**
 * GET /api/books/followed-authors
 * Get books from authors the user follows
 * Authentication required
 */
router.get("/followed-authors", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const books = await dbStorage.getBooksFromFollowedAuthors(req.user!.id);
    res.json(books);
  } catch (error: any) {
    console.error(`Error getting books from followed authors:`, error);
    res.status(500).json({ error: error.message || "Failed to get books from followed authors" });
  }
});

export default router;