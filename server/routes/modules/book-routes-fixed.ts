import express, { Router } from "express";
import { dbStorage } from "../../storage";
import multer from "multer";
import { enhanceReferralLinks } from "../../utils/favicon-utils";
import { sirenedImageBucket } from "../../services/sirened-image-bucket";
import { db } from "../../db";

// Configure multer for in-memory uploads (for use with object storage)
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

const router: Router = express.Router();

/**
 * GET /api/books/trending
 * Get trending books based on engagement and popularity score
 * No authentication required
 */
router.get("/trending", async (req, res) => {
  try {
    const books = await dbStorage.getPopularBooks();
    res.json(books);
  } catch (error: any) {
    console.error(`Error getting trending books:`, error);
    res.status(500).json({ error: error.message || "Failed to get trending books" });
  }
});

/**
 * GET /api/books
 * Get books with various filters
 * No authentication required
 */
router.get("/", async (req, res) => {
  try {
    // Get query parameters from request
    const { page = "1", limit = "20", query, genres, sort, orderBy } = req.query;
    
    // If no query parameters are provided, return error message
    if (!query && !genres) {
      return res.status(400).json({
        error: "Query parameters required",
        message: "Please provide at least one search parameter (query, genres)"
      });
    }
    
    // Parse page and limit as integers
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    // Parse genres if provided
    const genreList = genres ? (genres as string).split(',').map(g => g.trim()) : undefined;
    
    // Call storage method to get books
    const books = await dbStorage.selectBooks({
      query: query as string,
      genres: genreList,
      page: pageNum,
      limit: limitNum,
      sort: sort as string,
      orderBy: orderBy as 'asc' | 'desc'
    });
    
    res.json(books);
  } catch (error: any) {
    console.error(`Error fetching books:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch books" });
  }
});

/**
 * GET /api/books/:id
 * Get a specific book by ID
 * No authentication required
 */
router.get("/:id", async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }
    
    const book = await dbStorage.getBook(bookId);
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.json(book);
  } catch (error: any) {
    console.error(`Error fetching book:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch book" });
  }
});

/**
 * GET /api/books/:id/ratings
 * Get ratings for a specific book
 * No authentication required
 */
router.get("/:id/ratings", async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }
    
    const ratings = await dbStorage.getRatings(bookId);
    res.json(ratings);
  } catch (error: any) {
    console.error(`Error fetching book ratings:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch book ratings" });
  }
});

/**
 * GET /api/my-books
 * Get books for the authenticated user as an author
 * Authentication and author status required
 */
router.get("/my-books", async (req, res) => {
  // Force JSON content type
  res.type('json');
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const author = await dbStorage.getAuthorByUserId(req.user!.id);
  
  if (!author) {
    return res.status(403).json({ error: "User is not an author" });
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
  // Force JSON content type
  res.type('json');
  
  try {
    // Validate authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check author status
    const author = await dbStorage.getAuthorByUserId(req.user!.id);
    if (!author) {
      return res.status(403).json({ error: "Not an author" });
    }
    
    console.log("POST - Creating new book");
    
    // Check if we have images
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "At least one book image is required" });
    }
    
    console.log("POST - Processing form data");
    
    // Process form data fields with safe parsing
    const parseJsonField = (fieldName: string, defaultVal: any = []) => {
      if (!req.body[fieldName]) return defaultVal;
      try {
        return JSON.parse(req.body[fieldName]);
      } catch (error) {
        console.error(`Error parsing ${fieldName}:`, error);
        return defaultVal;
      }
    };
    
    // Parse all JSON fields
    const formats = parseJsonField('formats');
    const characters = parseJsonField('characters');
    const awards = parseJsonField('awards');
    const genreTaxonomies = parseJsonField('genreTaxonomies');
    
    // Parse dates and numbers
    const publishedDate = req.body.publishedDate ? new Date(req.body.publishedDate) : null;
    const pageCount = req.body.pageCount ? parseInt(req.body.pageCount) : null;
    
    // Process referral links
    let referralLinks = [];
    try {
      const parsedLinks = parseJsonField('referralLinks');
      // Enhance with domain and favicon information
      referralLinks = await enhanceReferralLinks(parsedLinks);
    } catch (error) {
      console.error("Error processing referral links:", error);
    }
    
    console.log("POST - Creating book record");
    
    // Create the book
    const book = await dbStorage.createBook({
      title: req.body.title,
      description: req.body.description,
      authorId: author.id,
      referralLinks: referralLinks,
      formats: formats,
      promoted: false,
      pageCount: pageCount,
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
 * PATCH /api/books/:id
 * Update an existing book
 * Authentication and author status required
 */
router.patch("/:id", async (req, res) => {
  // Force JSON content type
  res.type('json');
  
  try {
    // Basic validation
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get user ID from session
    const userId = req.user!.id;
    
    // Get author record first
    const author = await dbStorage.getAuthorByUserId(userId);
    if (!author) {
      return res.status(403).json({ error: "Not an author" });
    }
    
    // Three ways to identify the book:
    // 1. Direct ID from URL
    // 2. authorname + bookname params
    // 3. title + authorId combo
    
    let bookId = parseInt(req.params.id);
    let book = null;
    
    // Log what we received
    console.log("PATCH request data:", { 
      urlId: req.params.id,
      authorname: req.body.authorname, 
      bookname: req.body.bookname
    });
    
    // Handle authorname and bookname parameters if provided
    if (req.body.authorname && req.body.bookname) {
      console.log(`Looking up book by author name and book name: ${req.body.authorname}, ${req.body.bookname}`);
      
      // Option 1: Use the author we already found if names match
      if (author.author_name === req.body.authorname) {
        // Find the book by direct author ID and title
        const authorBook = await dbStorage.getBookByAuthorAndTitle(
          author.author_name, // Use author_name string, not ID
          req.body.bookname
        );
        
        if (authorBook) {
          console.log(`Found book with ID ${authorBook.id} by author name match`);
          bookId = authorBook.id;
          book = authorBook;
        }
      } else {
        // Option 2: Names don't match, try to find the specified author
        const namedAuthor = await dbStorage.getAuthorByName(req.body.authorname);
        if (namedAuthor) {
          // Find the book by this author
          const authorBook = await dbStorage.getBookByAuthorAndTitle(
            namedAuthor.author_name,
            req.body.bookname
          );
          
          if (authorBook) {
            console.log(`Found book with ID ${authorBook.id} by explicit author lookup`);
            bookId = authorBook.id;
            book = authorBook;
          }
        }
      }
    }
    
    // If we didn't find the book by name, try the direct ID approach
    if (!book && !isNaN(bookId)) {
      book = await dbStorage.getBook(bookId);
    }
    
    // Final check if we found a book
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Verify ownership - authors can only edit their own books
    if (book.authorId !== author.id) {
      return res.status(403).json({ 
        error: "Not authorized - you don't own this book",
        authorId: book.authorId,
        yourAuthorId: author.id 
      });
    }
    
    console.log("PATCH updating book:", bookId);
    console.log("Update fields:", Object.keys(req.body));
    
    // Extract the updated fields from request body, ensuring authorname and bookname don't get sent to SQL
    const { authorname, bookname, genreTaxonomies, ...updates } = req.body;
    
    console.log("Processing update with clean fields:", Object.keys(updates));
    
    // Explicitly ensure we're not trying to update the book ID or author ID which could cause SQL issues
    const cleanUpdates = { ...updates };
    delete cleanUpdates.id;
    delete cleanUpdates.authorId;
    
    // Update the book in database with clean data
    const updatedBook = await dbStorage.updateBook(bookId, cleanUpdates);
    
    // Update taxonomies if provided
    if (genreTaxonomies && Array.isArray(genreTaxonomies)) {
      await dbStorage.updateBookTaxonomies(bookId, genreTaxonomies);
    }
    
    // Return success with updated book
    return res.status(200).json(updatedBook);
  } catch (error: any) {
    console.error("PATCH book error:", error);
    return res.status(500).json({ 
      error: "Failed to update book",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * PATCH /api/books/:id/upload
 * Update a book with file uploads
 * Authentication and author status required
 */
router.patch("/:id/upload", multipleImageUpload, async (req, res) => {
  // Force JSON content type
  res.type('json');
  
  try {
    // Basic validation
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get user ID from session
    const userId = req.user!.id;
    
    // Get author record first
    const author = await dbStorage.getAuthorByUserId(userId);
    if (!author) {
      return res.status(403).json({ error: "Not an author" });
    }
    
    // Three ways to identify the book:
    // 1. Direct ID from URL
    // 2. authorname + bookname params
    // 3. title + authorId combo
    
    let bookId = parseInt(req.params.id);
    let book = null;
    
    // Log what we received
    console.log("PATCH upload request data:", { 
      urlId: req.params.id,
      authorname: req.body.authorname, 
      bookname: req.body.bookname
    });
    
    // Handle authorname and bookname parameters if provided
    if (req.body.authorname && req.body.bookname) {
      console.log(`Looking up book by author name and book name: ${req.body.authorname}, ${req.body.bookname}`);
      
      // Option 1: Use the author we already found if names match
      if (author.author_name === req.body.authorname) {
        // Find the book by direct author ID and title
        const authorBook = await dbStorage.getBookByAuthorAndTitle(
          author.author_name, // Use author_name string, not ID
          req.body.bookname
        );
        
        if (authorBook) {
          console.log(`Found book with ID ${authorBook.id} by author name match`);
          bookId = authorBook.id;
          book = authorBook;
        }
      } else {
        // Option 2: Names don't match, try to find the specified author
        const namedAuthor = await dbStorage.getAuthorByName(req.body.authorname);
        if (namedAuthor) {
          // Find the book by this author
          const authorBook = await dbStorage.getBookByAuthorAndTitle(
            namedAuthor.author_name,
            req.body.bookname
          );
          
          if (authorBook) {
            console.log(`Found book with ID ${authorBook.id} by explicit author lookup`);
            bookId = authorBook.id;
            book = authorBook;
          }
        }
      }
    }
    
    // If we didn't find the book by name, try the direct ID approach
    if (!book && !isNaN(bookId)) {
      book = await dbStorage.getBook(bookId);
    }
    
    // Final check if we found a book
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Verify ownership - authors can only edit their own books
    if (book.authorId !== author.id) {
      return res.status(403).json({ 
        error: "Not authorized - you don't own this book",
        authorId: book.authorId,
        yourAuthorId: author.id 
      });
    }
    
    console.log("PATCH upload request for book:", bookId);
    
    // Process form data
    const updates: any = {};
    
    // Handle simple fields first (excluding authorname and bookname)
    for (const key in req.body) {
      if (key === 'authorname' || key === 'bookname') continue;
      if (req.body[key] === '' || req.body[key] === undefined) continue;
      
      // Parse JSON fields
      if (['formats', 'characters', 'awards', 'genreTaxonomies', 'referralLinks'].includes(key)) {
        try {
          updates[key] = JSON.parse(req.body[key]);
        } catch (e) {
          console.error(`Error parsing JSON field ${key}:`, e);
        }
      } else if (key === 'publishedDate') {
        updates[key] = new Date(req.body[key]);
      } else if (key === 'pageCount') {
        updates[key] = parseInt(req.body[key]);
      } else {
        updates[key] = req.body[key];
      }
    }
    
    // Process uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && Object.keys(files).length > 0) {
      console.log("Processing uploads:", Object.keys(files));
      
      for (const fieldName in files) {
        if (fieldName.startsWith('bookImage_')) {
          const imageType = fieldName.replace('bookImage_', '') as any;
          const file = files[fieldName][0];
          
          try {
            // Upload to storage
            const storageKey = await sirenedImageBucket.uploadBookImage(file, imageType, bookId);
            const imageUrl = await sirenedImageBucket.getPublicUrl(storageKey);
            
            // Get dimensions based on image type
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
                width = 100;
                height = 100;
            }
            
            // Save to database with appropriate dimensions
            const bookImage = await dbStorage.addBookImage({
              bookId: bookId,
              imageUrl,
              imageType,
              width,
              height,
              sizeKb: Math.round(file.size / 1024),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            
            console.log(`Uploaded ${imageType} image for book ${bookId}`);
          } catch (e) {
            console.error(`Error uploading ${imageType} image:`, e);
          }
        }
      }
    }
    
    // Update the book
    const updatedBook = await dbStorage.updateBook(bookId, updates);
    
    // Update taxonomies if provided
    if (updates.genreTaxonomies && Array.isArray(updates.genreTaxonomies)) {
      await dbStorage.updateBookTaxonomies(bookId, updates.genreTaxonomies);
    }
    
    // Return success
    return res.status(200).json(updatedBook);
  } catch (error: any) {
    console.error("PATCH book upload error:", error);
    return res.status(500).json({ 
      error: "Failed to update book with uploads",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;