import { Router, Request, Response } from "express";
import { dbStorage } from "../../storage";
import multer from "multer";
import { enhanceReferralLinks } from "../../utils/favicon-utils";
import { and, eq } from "drizzle-orm";
import { sirenedImageBucket } from "../../services/sirened-image-bucket";

// Configure multer for in-memory uploads (for use with object storage)
// Create a field name filter that accepts form fields matching bookImage_ pattern
const bookImageFieldFilter = (fieldname: string) => {
  return fieldname.startsWith('bookImage_');
};

// Multer for single file upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB size limit
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
    fileSize: 10 * 1024 * 1024, // 10MB size limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
}).fields([
  { name: 'bookImage_book-detail', maxCount: 1 },
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
 * Get all books
 * Public endpoint - no authentication required
 */
router.get("/", async (_req, res) => {
  const books = await dbStorage.getBooks();
  res.json(books);
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

    // Track if we have a book-detail image to use for auto-generation
    let bookDetailFile: Express.Multer.File | null = null;
    let bookDetailUrl: string = '';

    // First pass: process the uploaded files and look for book-detail
    for (const fieldName in uploadedFiles) {
      if (fieldName.startsWith('bookImage_')) {
        const imageType = fieldName.replace('bookImage_', '');
        const file = uploadedFiles[fieldName][0]; // Get first file from array
        
        // Store the book-detail file for potential auto-generation
        if (imageType === 'book-detail') {
          bookDetailFile = file;
          // We'll upload the file in the next pass with the book ID
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
          
          // Store book-detail URL for potential auto-generation
          if (imageType === 'book-detail') {
            bookDetailUrl = imageUrl;
          }
          
          // Add to database with imageType
          const bookImage = await dbStorage.addBookImage({
            bookId: book.id,
            imageUrl,
            imageType,
            storageKey,
            width: null, // These could be calculated but we're skipping for now
            height: null,
            createdAt: new Date(),
          });
          
          bookImageEntries.push(bookImage);
        } catch (uploadError) {
          console.error(`Error uploading ${imageType} image for book ID ${book.id}:`, uploadError);
          // Continue with other images even if one fails
        }
      }
    }

    // Generate missing image types if book-detail is available
    if (bookDetailFile && bookDetailUrl) {
      try {
        // Call function to auto-generate other image types
        await sirenedImageBucket.generateAdditionalBookImages(bookDetailFile, book.id);
      } catch (genError) {
        console.error(`Error generating additional book images:`, genError);
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
    
    const impression = await dbStorage.recordBookImpression(
      bookId, 
      req.user!.id, 
      source, 
      type,
      weight
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
    const referralId = req.body.referralId;
    const source = req.body.source || "unknown";
    
    if (!referralId) {
      return res.status(400).json({ error: "referralId is required" });
    }
    
    // Record as an impression with type 'referral_click' and weight 1.0
    if (userId) {
      await dbStorage.recordBookImpression(
        bookId, 
        userId, 
        source, 
        "referral_click",
        1.0
      );
    }
    
    // Record the actual click-through
    const clickThrough = await dbStorage.recordReferralClickThrough(
      bookId, 
      referralId,
      userId || 0, // Use 0 for anonymous
      source
    );
    
    res.status(201).json(clickThrough);
  } catch (error: any) {
    console.error(`Error recording click-through:`, error);
    res.status(500).json({ error: error.message || "Failed to record click-through" });
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
    await dbStorage.deleteBook(bookId);
    
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