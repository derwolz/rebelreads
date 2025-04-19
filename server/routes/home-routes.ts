import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { db } from "../db";
import { 
  ratings, 
  books, 
  followers, 
  bookImages, 
  bookGenreTaxonomies, 
  genreTaxonomies,
  bookShelves,
  shelfBooks,
  authors
} from "@shared/schema";
import { enhanceReferralLinks } from "../utils/favicon-utils";
import { eq, and, inArray, notInArray, desc, avg, count, sql, asc } from "drizzle-orm";

// Configure multer for file uploads
const uploadsDir = "./uploads";
const coversDir = path.join(uploadsDir, "covers");

[uploadsDir, coversDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, coversDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Create a field name filter that accepts form fields matching bookImage_ pattern
const bookImageFieldFilter = (fieldname: string) => {
  return fieldname.startsWith('bookImage_');
};

// Multer for single cover upload (legacy)
const upload = multer({ storage: fileStorage });

// Multer for multiple book images with dynamic field names
const multipleImageUpload = multer({
  storage: fileStorage,
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
  { name: 'bookImage_grid-item', maxCount: 1 },
  { name: 'bookImage_hero', maxCount: 1 },
  // We still accept these but they're optional now as they'll be auto-generated
  { name: 'bookImage_book-card', maxCount: 1 },
  { name: 'bookImage_mini', maxCount: 1 }
]);

const router = Router();

// Serve uploaded files
router.use("/uploads", express.static("uploads"));

// Ensure the profile-images directory exists
const profileImagesDir = path.join(uploadsDir, "profile-images");
if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}

router.get("/books", async (_req, res) => {
  const books = await dbStorage.getBooks();
  
  // Add debugging
  console.log(`Returning ${books.length} books`);
  if (books.length > 0) {
    console.log(`First book has ${books[0]?.images?.length || 0} images:`, 
      books[0]?.images?.map(img => `${img.imageType}: ${img.imageUrl}`));
  }
  
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
  
  console.log(`Searching for book with authorName: ${authorName}, title: ${bookTitle}`);
  
  try {
    // Get book by author name and title
    const book = await dbStorage.getBookByAuthorAndTitle(authorName as string, bookTitle as string);
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Add debugging to check if images are attached to the book
    console.log(`Book with title "${bookTitle}" by "${authorName}" has ${book.images?.length || 0} images:`, 
      book.images?.map(img => `${img.imageType}: ${img.imageUrl}`));
    
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

router.get("/books/:id", async (req, res) => {
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const book = await dbStorage.getBook(bookId);
  if (!book) return res.sendStatus(404);
  
  // Add debugging to check if images are attached to the book
  console.log(`Book ID ${bookId} has ${book.images?.length || 0} images:`, 
    book.images?.map(img => `${img.imageType}: ${img.imageUrl}`));
  
  res.json(book);
});

router.get("/books/:id/ratings", async (req, res) => {
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const bookRatings = await dbStorage.getRatings(bookId);
  
  // Get user information and replies for each review
  const ratingsWithUserInfo = await Promise.all(bookRatings.map(async (rating) => {
    // Get user information
    const user = await dbStorage.getUser(rating.userId);
    
    // Get replies to this review
    const replies = await dbStorage.getReplies(rating.id);
    
    // Add author info to each reply
    const repliesWithAuthor = await Promise.all(replies.map(async (reply) => {
      const author = await dbStorage.getUser(reply.authorId);
      return {
        ...reply,
        author: {
          username: author?.username || 'Unknown',
          profileImageUrl: author?.profileImageUrl
        }
      };
    }));
    
    return {
      ...rating,
      user: {
        username: user?.username || 'Anonymous',
        displayName: user?.displayName || user?.username || 'Anonymous',
        profileImageUrl: user?.profileImageUrl
      },
      replies: repliesWithAuthor
    };
  }));
  
  res.json(ratingsWithUserInfo);
});

router.get("/books/:id/taxonomies", async (req, res) => {
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
router.get("/books/:id/author", async (req, res) => {
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
 * GET /api/authors/:id/publisher
 * Get publisher details for a specific author
 * Public endpoint - no authentication required
 */
router.get("/authors/:id/publisher", async (req, res) => {
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: "Invalid author ID" });
  }

  try {
    // Check if the author exists first
    const author = await dbStorage.getAuthor(authorId);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Get the publisher for this author
    const publisher = await dbStorage.getAuthorPublisher(authorId);
    
    // For debugging
    console.log(`Publisher for author ${authorId}:`, publisher);
    
    if (!publisher) {
      return res.json(null); // No publisher associated with this author
    }
    
    return res.json(publisher);
  } catch (error) {
    console.error("Error fetching author publisher:", error);
    return res.status(500).json({ error: "Failed to fetch author publisher" });
  }
});

router.post("/books/:id/ratings", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  try {
    const rating = await dbStorage.createRating({
      bookId,
      userId: req.user!.id,
      enjoyment: req.body.enjoyment,
      writing: req.body.writing,
      themes: req.body.themes,
      characters: req.body.characters,
      worldbuilding: req.body.worldbuilding,
      review: req.body.review,
      analysis: req.body.analysis,
    });

    // Mark the book as completed
    await dbStorage.markAsCompleted(req.user!.id, bookId);

    res.json(rating);
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique violation
      try {
        const [updatedRating] = await db
          .update(ratings)
          .set({
            enjoyment: req.body.enjoyment,
            writing: req.body.writing,
            themes: req.body.themes,
            characters: req.body.characters,
            worldbuilding: req.body.worldbuilding,
            review: req.body.review,
            analysis: req.body.analysis,
          })
          .where(
            and(eq(ratings.userId, req.user!.id), eq(ratings.bookId, bookId)),
          )
          .returning();

        // Mark the book as completed
        await dbStorage.markAsCompleted(req.user!.id, bookId);

        return res.json(updatedRating);
      } catch (updateError) {
        return res.status(500).send("Failed to update rating");
      }
    }
    res.status(400).send(error.message);
  }
});

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

// Get all ratings for an author's books
router.get("/my-books/ratings", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  // Get the author ID from the user ID
  const author = await dbStorage.getAuthorByUserId(req.user!.id);
  
  if (!author) {
    return res.status(403).json({ error: "User is not an author or author record not found" });
  }
  
  // Get all books by this author
  const authorBooks = await dbStorage.getBooksByAuthor(author.id);
  
  if (!authorBooks || authorBooks.length === 0) {
    return res.json([]);
  }
  
  // Get all ratings for all books by this author
  const bookIds = authorBooks.map(book => book.id);
  const allRatings = await dbStorage.getRatingsForBooks(bookIds);
  
  res.json(allRatings);
});

router.post("/books", multipleImageUpload, async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(401);
  }

  try {
    // Log the request body and files for debugging
    console.log("Book creation request:", JSON.stringify(req.body, null, 2));
    console.log("Uploaded files:", JSON.stringify(req.files, null, 2));
    console.log("Fields starting with bookImage_:", Object.keys(req.files || {}).filter(key => key.startsWith('bookImage_')));
    
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
        console.log("Enhanced referral links for new book:", JSON.stringify(referralLinks, null, 2));
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
          bookDetailUrl = `/uploads/covers/${file.filename}`;
        }
      }
    }

    // Second pass: process all image types (including auto-generated ones)
    for (const fieldName in uploadedFiles) {
      if (fieldName.startsWith('bookImage_')) {
        const imageType = fieldName.replace('bookImage_', '');
        const file = uploadedFiles[fieldName][0]; // Get first file from array
        const imageUrl = `/uploads/covers/${file.filename}`;
        
        // Get dimensions from request body
        let width = 0;
        let height = 0;
        
        // Set dimensions based on image type
        switch (imageType) {
          case "book-detail":
            width = 480;
            height = 600;
            break;
          case "background":
            width = 1300;
            height = 1500;
            break;
          case "book-card":
            width = 256;
            height = 440;
            break;
          case "grid-item":
            width = 56;
            height = 212;
            break;
          case "mini":
            width = 48;
            height = 64;
            break;
          case "hero":
            width = 1500;
            height = 600;
            break;
        }
        
        // Add to array of images to insert
        bookImageEntries.push({
          bookId: book.id,
          imageUrl,
          imageType,
          width,
          height,
          sizeKb: Math.round(file.size / 1024) // Convert bytes to KB
        });
      }
    }
    
    // Auto-generate book-card and mini images if we have a book-detail image
    // but didn't receive explicit files for these types
    if (bookDetailFile && bookDetailUrl) {
      // Check if we don't already have book-card in our entries
      if (!bookImageEntries.some(entry => entry.imageType === 'book-card')) {
        console.log("Auto-generating book-card image from book-detail");
        bookImageEntries.push({
          bookId: book.id,
          imageUrl: bookDetailUrl, // Use same image file - would be scaled on client side
          imageType: 'book-card',
          width: 256,
          height: 440,
          sizeKb: Math.round(bookDetailFile.size / 1024) // Use same file size
        });
      }
      
      // Check if we don't already have mini in our entries
      if (!bookImageEntries.some(entry => entry.imageType === 'mini')) {
        console.log("Auto-generating mini image from book-detail");
        bookImageEntries.push({
          bookId: book.id,
          imageUrl: bookDetailUrl, // Use same image file - would be scaled on client side
          imageType: 'mini',
          width: 48,
          height: 64,
          sizeKb: Math.round(bookDetailFile.size / 1024) // Use same file size
        });
      }
    }

    // Insert all book images using a single database operation
    if (bookImageEntries.length > 0) {
      console.log("Inserting book images:", bookImageEntries);
      await db.insert(bookImages).values(bookImageEntries);
    }

    // Now handle the taxonomies separately if present
    if (genreTaxonomies && genreTaxonomies.length > 0) {
      console.log("Adding taxonomies for new book:", genreTaxonomies);
      await dbStorage.updateBookTaxonomies(book.id, genreTaxonomies);
    }

    // Fetch the complete book with images to return to client
    const completeBook = await dbStorage.getBook(book.id);
    res.json(completeBook);
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ error: "Failed to create book" });
  }
});

router.patch("/books/:id", multipleImageUpload, async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  // Get the author ID from the user ID
  const author = await dbStorage.getAuthorByUserId(req.user!.id);
  
  if (!author) {
    return res.status(403).json({ error: "User is not an author or author record not found" });
  }
  
  const book = await dbStorage.getBook(parseInt(req.params.id));
  if (!book || book.authorId !== author.id) {
    return res.sendStatus(403);
  }

  try {
    // Add debugging to see what's in the request
    console.log("Book update request body:", JSON.stringify(req.body, null, 2));
    console.log("Uploaded files:", JSON.stringify(req.files, null, 2));
    console.log("Fields starting with bookImage_:", Object.keys(req.files || {}).filter(key => key.startsWith('bookImage_')));
    
    // Extract genreTaxonomies from request body to handle separately
    const { genreTaxonomies, ...bookData } = req.body;
    
    // Ensure we're not passing any unexpected data to the update query
    const safeBookData: Record<string, any> = {};
    
    // Only include existing book fields in the data we pass to the update
    if (bookData.title) safeBookData.title = bookData.title;
    if (bookData.description) safeBookData.description = bookData.description;
    if (bookData.pageCount) safeBookData.pageCount = bookData.pageCount;
    if (bookData.formats) safeBookData.formats = bookData.formats;
    if (bookData.publishedDate) safeBookData.publishedDate = bookData.publishedDate;
    if (bookData.awards) safeBookData.awards = bookData.awards;
    if (bookData.originalTitle) safeBookData.originalTitle = bookData.originalTitle;
    if (bookData.series) safeBookData.series = bookData.series;
    if (bookData.setting) safeBookData.setting = bookData.setting;
    if (bookData.characters) safeBookData.characters = bookData.characters;
    if (bookData.isbn) safeBookData.isbn = bookData.isbn;
    if (bookData.asin) safeBookData.asin = bookData.asin;
    if (bookData.language) safeBookData.language = bookData.language;
    
    // Process referral links to add domain and favicon information
    if (bookData.referralLinks) {
      console.log("Processing referral links for favicon enhancement");
      try {
        // Enhance referral links with domain and favicon information
        const enhancedLinks = await enhanceReferralLinks(bookData.referralLinks);
        safeBookData.referralLinks = enhancedLinks;
        console.log("Enhanced referral links:", JSON.stringify(enhancedLinks, null, 2));
      } catch (error) {
        console.error("Error enhancing referral links:", error);
        // If enhancement fails, still update with original links
        safeBookData.referralLinks = bookData.referralLinks;
      }
    }
    
    if (bookData.internal_details) safeBookData.internal_details = bookData.internal_details;
    
    console.log("Safe book data:", JSON.stringify(safeBookData, null, 2));
    
    // Update main book data first (only if we have data to update)
    let updatedBook = book;
    if (Object.keys(safeBookData).length > 0) {
      updatedBook = await dbStorage.updateBook(book.id, safeBookData);
    }
    
    // Process any new images that were uploaded
    if (req.files && Object.keys(req.files).length > 0) {
      const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] };
      const bookImageEntries = [];
      
      // Track if book-detail was updated to auto-generate book-card and mini
      let updatedBookDetailFile: Express.Multer.File | null = null;
      let updatedBookDetailUrl: string = '';
      
      // First pass: Check if book-detail is being updated
      for (const fieldName in uploadedFiles) {
        if (fieldName === 'bookImage_book-detail') {
          const file = uploadedFiles[fieldName][0]; // Get first file from array
          updatedBookDetailFile = file;
          updatedBookDetailUrl = `/uploads/covers/${file.filename}`;
          console.log("Found updated book-detail image:", updatedBookDetailUrl);
          break;
        }
      }
      
      // Second pass: Process all uploaded images
      for (const fieldName in uploadedFiles) {
        if (fieldName.startsWith('bookImage_')) {
          const imageType = fieldName.replace('bookImage_', '');
          const file = uploadedFiles[fieldName][0]; // Get first file from array
          const imageUrl = `/uploads/covers/${file.filename}`;
          
          // Set dimensions based on image type
          let width = 0;
          let height = 0;
          
          switch (imageType) {
            case "book-detail":
              width = 480;
              height = 600;
              break;
            case "background":
              width = 1300;
              height = 1500;
              break;
            case "book-card":
              width = 256;
              height = 440;
              break;
            case "grid-item":
              width = 56;
              height = 212;
              break;
            case "mini":
              width = 48;
              height = 64;
              break;
            case "hero":
              width = 1500;
              height = 600;
              break;
          }
          
          // First check if this image type already exists for this book
          // If it does, we'll update it. If not, we'll create it.
          const existingImages = book.images ? book.images.filter(img => img.imageType === imageType) : [];
          
          if (existingImages.length > 0) {
            // Update the existing image
            await db.update(bookImages)
              .set({
                imageUrl,
                width,
                height,
                sizeKb: Math.round(file.size / 1024),
                updatedAt: new Date()
              })
              .where(eq(bookImages.id, existingImages[0].id));
          } else {
            // Add to array of images to insert
            bookImageEntries.push({
              bookId: book.id,
              imageUrl,
              imageType,
              width,
              height,
              sizeKb: Math.round(file.size / 1024) // Convert bytes to KB
            });
          }
        }
      }
      
      // If book-detail was updated, auto-generate book-card and mini if not explicitly uploaded
      if (updatedBookDetailFile && updatedBookDetailUrl) {
        const uploadedImageTypes = Object.keys(uploadedFiles).map(key => key.replace('bookImage_', ''));
        console.log("Uploaded image types:", uploadedImageTypes);
        
        // Check if book-card isn't being updated explicitly
        if (!uploadedImageTypes.includes('book-card')) {
          // Find existing book-card image
          const existingBookCard = book.images ? book.images.find(img => img.imageType === 'book-card') : null;
          
          if (existingBookCard) {
            // Update the existing book-card with the new book-detail image
            console.log("Auto-updating book-card with new book-detail image");
            await db.update(bookImages)
              .set({
                imageUrl: updatedBookDetailUrl,
                sizeKb: Math.round(updatedBookDetailFile.size / 1024),
                updatedAt: new Date()
              })
              .where(eq(bookImages.id, existingBookCard.id));
          } else {
            // Create a new book-card image
            console.log("Auto-generating new book-card from book-detail");
            bookImageEntries.push({
              bookId: book.id,
              imageUrl: updatedBookDetailUrl,
              imageType: 'book-card',
              width: 256,
              height: 440,
              sizeKb: Math.round(updatedBookDetailFile.size / 1024)
            });
          }
        }
        
        // Check if mini isn't being updated explicitly
        if (!uploadedImageTypes.includes('mini')) {
          // Find existing mini image
          const existingMini = book.images ? book.images.find(img => img.imageType === 'mini') : null;
          
          if (existingMini) {
            // Update the existing mini with the new book-detail image
            console.log("Auto-updating mini with new book-detail image");
            await db.update(bookImages)
              .set({
                imageUrl: updatedBookDetailUrl,
                sizeKb: Math.round(updatedBookDetailFile.size / 1024),
                updatedAt: new Date()
              })
              .where(eq(bookImages.id, existingMini.id));
          } else {
            // Create a new mini image
            console.log("Auto-generating new mini from book-detail");
            bookImageEntries.push({
              bookId: book.id,
              imageUrl: updatedBookDetailUrl,
              imageType: 'mini',
              width: 48,
              height: 64,
              sizeKb: Math.round(updatedBookDetailFile.size / 1024)
            });
          }
        }
      }
      
      // Insert any new book images
      if (bookImageEntries.length > 0) {
        console.log("Inserting new book images:", bookImageEntries);
        await db.insert(bookImages).values(bookImageEntries);
      }
    }
    
    // Then handle taxonomies if present
    if (genreTaxonomies) {
      await dbStorage.updateBookTaxonomies(book.id, genreTaxonomies);
    }
    
    // Fetch the complete updated book with images to return to client
    const completeBook = await dbStorage.getBook(book.id);
    res.json(completeBook);
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ error: "Failed to update book" });
  }
});

// Record an impression for a book
router.post("/books/:id/impression", async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const { source, context, type, weight } = req.body;
    
    if (!source || !context) {
      return res.status(400).json({ error: "Source and context are required" });
    }
    
    // Determine interaction weight based on type
    let interactionWeight = 1.0; // default weight
    
    if (weight !== undefined) {
      // Use explicit weight if provided
      interactionWeight = parseFloat(weight);
    } else if (type) {
      // Assign weight based on interaction type
      switch (type) {
        case "detail-expand": // Hover interactions
          interactionWeight = 0.25;
          break;
        case "card-click": // Clicking on book card
          interactionWeight = 0.5;
          break;
        case "referral-click": // Clicking on referral link
          interactionWeight = 1.0;
          break;
        default:
          interactionWeight = 1.0;
      }
    }

    const impression = await dbStorage.recordBookImpression(
      bookId,
      req.isAuthenticated() ? req.user!.id : null,
      source,
      context,
      type || "view",
      interactionWeight
    );

    res.status(201).json(impression);
  } catch (error) {
    console.error("Error recording book impression:", error);
    res.status(500).json({ error: "Failed to record book impression" });
  }
});

// Record a click-through for a book
router.post("/books/:id/click-through", async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const { source, referrer } = req.body;
    
    if (!source) {
      return res.status(400).json({ error: "Source is required" });
    }

    const clickThrough = await dbStorage.recordBookClickThrough(
      bookId,
      req.isAuthenticated() ? req.user!.id : null,
      source,
      referrer || ""
    );

    res.status(201).json(clickThrough);
  } catch (error) {
    console.error("Error recording book click-through:", error);
    res.status(500).json({ error: "Failed to record book click-through" });
  }
});

// Add DELETE endpoint for books
router.delete("/books/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  try {
    // Get the book to verify ownership
    const book = await dbStorage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Get the author ID from the user ID
    const author = await dbStorage.getAuthorByUserId(req.user!.id);
    
    if (!author) {
      return res.status(403).json({ error: "User is not an author or author record not found" });
    }
    
    // Verify that the authenticated user (as an author) owns this book
    if (book.authorId !== author.id) {
      return res.status(403).json({ error: "You don't have permission to delete this book" });
    }

    // Delete the book
    await dbStorage.deleteBook(bookId, author.id);
    
    console.log(`Book ID ${bookId} deleted by user ID ${req.user!.id}`);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

router.get("/books/:id/reading-status", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const status = await dbStorage.getReadingStatus(req.user!.id, bookId);
  res.json(status || {});
});

router.post("/books/:id/wishlist", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const status = await dbStorage.toggleWishlist(req.user!.id, bookId);
  res.json(status);
});

router.delete("/books/:id/wishlist", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const status = await dbStorage.toggleWishlist(req.user!.id, bookId);
  res.json(status);
});

router.get("/wishlist/books", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const wishlistedBooks = await dbStorage.getWishlistedBooks(req.user!.id);
    res.json(wishlistedBooks);
  } catch (error) {
    console.error("Error fetching wishlisted books:", error);
    res.status(500).json({ error: "Failed to fetch wishlisted books" });
  }
});

// Get the current user's rating for a specific book
router.get("/books/:id/user-rating", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  try {
    const userId = req.user!.id;
    
    // Fetch the user's rating for this book
    const userRating = await db
      .select()
      .from(ratings)
      .where(
        and(
          eq(ratings.userId, userId),
          eq(ratings.bookId, bookId)
        )
      )
      .limit(1);
    
    if (userRating.length === 0) {
      return res.json(null);
    }
    
    res.json(userRating[0]);
  } catch (error) {
    console.error("Error fetching user rating:", error);
    res.status(500).json({ error: "Failed to fetch user rating" });
  }
});

router.get("/books/followed-authors", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    // Get authors that the user follows
    const followedAuthors = await db
      .select({
        authorId: followers.followingId
      })
      .from(followers)
      .where(eq(followers.followerId, req.user!.id));
    
    if (followedAuthors.length === 0) {
      return res.json([]);
    }
    
    // Get books by those authors
    const authorIds = followedAuthors.map(f => f.authorId);
    const authorBooks = await db
      .select()
      .from(books)
      .where(inArray(books.authorId, authorIds));
    
    res.json(authorBooks);
  } catch (error) {
    console.error("Error fetching followed authors books:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch books from followed authors" });
  }
});

// Get author details by ID
router.get("/authors/:id", async (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    if (isNaN(authorId)) {
      return res.status(400).json({ error: "Invalid author ID" });
    }

    // Get author details from storage
    const author = await dbStorage.getAuthor(authorId);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    // Get user info for this author
    const user = await dbStorage.getUser(author.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get books by this author
    const books = await dbStorage.getBooksByAuthor(authorId);

    // Get follower count
    const followerCount = await dbStorage.getAuthorFollowerCount(authorId);

    // Get author genres
    const genres = await dbStorage.getAuthorGenres(authorId);
    
    // Get aggregate ratings for the author
    const ratings = await dbStorage.getAuthorAggregateRatings(authorId);

    // Combine all data
    const authorDetails = {
      id: author.id,
      username: user.username,
      authorName: author.author_name,
      authorBio: author.bio,
      birthDate: author.birth_date,
      deathDate: author.death_date,
      website: author.website,
      books,
      followerCount,
      genres,
      aggregateRatings: ratings,
      socialMediaLinks: [] // Authors don't have social media links stored in DB yet
    };

    res.json(authorDetails);
  } catch (error) {
    console.error("Error fetching author details:", error);
    res.status(500).json({ error: "Failed to fetch author details" });
  }
});

// Get author details by name - new route to help prevent scraping by obscuring author IDs
router.get("/author", async (req, res) => {
  try {
    const { authorName } = req.query;
    
    if (!authorName || typeof authorName !== 'string') {
      return res.status(400).json({ error: "Author name is required as a query parameter" });
    }
    
    console.log(`Searching for author with name: ${authorName}`);

    // Get author details from storage by name
    const author = await dbStorage.getAuthorByName(authorName);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    // Get user info for this author
    const user = await dbStorage.getUser(author.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get books by this author
    const books = await dbStorage.getBooksByAuthor(author.id);

    // Get follower count
    const followerCount = await dbStorage.getAuthorFollowerCount(author.id);

    // Get author genres
    const genres = await dbStorage.getAuthorGenres(author.id);
    
    // Get aggregate ratings for the author
    const ratings = await dbStorage.getAuthorAggregateRatings(author.id);

    // Combine all data
    const authorDetails = {
      id: author.id,
      username: user.username,
      authorName: author.author_name,
      authorBio: author.bio,
      birthDate: author.birth_date,
      deathDate: author.death_date,
      website: author.website,
      books,
      followerCount,
      genres,
      aggregateRatings: ratings,
      socialMediaLinks: [] // Authors don't have social media links stored in DB yet
    };

    res.json(authorDetails);
  } catch (error) {
    console.error("Error fetching author details by name:", error);
    res.status(500).json({ error: "Failed to fetch author details" });
  }
});

/**
 * GET /api/authors/:id/bookshelves
 * Get shared bookshelves for an author with the books they contain
 * Public endpoint - no authentication required
 */
router.get("/authors/:id/bookshelves", async (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    if (isNaN(authorId)) {
      return res.status(400).json({ error: "Invalid author ID" });
    }

    // Get author details from storage
    const author = await dbStorage.getAuthor(authorId);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    // Find shared bookshelves for this author
    const sharedShelves = await db.select()
      .from(bookShelves)
      .where(and(
        eq(bookShelves.userId, author.userId),
        eq(bookShelves.isShared, true)
      ))
      .orderBy(asc(bookShelves.rank));

    // Get books for each shelf
    const shelvesWithBooks = await Promise.all(
      sharedShelves.map(async (shelf) => {
        // Get shelf-book relationships
        const shelfBooksData = await db.select()
          .from(shelfBooks)
          .where(eq(shelfBooks.shelfId, shelf.id))
          .orderBy(asc(shelfBooks.rank));

        // Get the actual books
        const bookIds = shelfBooksData.map(sb => sb.bookId);
        let shelfBookItems: any[] = [];
        
        if (bookIds.length > 0) {
          // Fetch the books with their images
          shelfBookItems = await Promise.all(
            bookIds.map(async (bookId) => {
              const book = await dbStorage.getBook(bookId);
              return book;
            })
          );
        }

        return {
          shelf,
          books: shelfBookItems.filter(Boolean) // Filter out any null values
        };
      })
    );

    res.json(shelvesWithBooks);
  } catch (error) {
    console.error("Error fetching author bookshelves:", error);
    res.status(500).json({ error: "Failed to fetch author bookshelves" });
  }
});

router.post("/authors/:id/follow", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const authorId = parseInt(req.params.id);
  // Check if the author exists directly in the authors table
  const author = await dbStorage.getAuthor(authorId);
  if (!author) return res.sendStatus(404);

  await dbStorage.followAuthor(req.user!.id, authorId);
  res.sendStatus(200);
});

router.post("/authors/:id/unfollow", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const authorId = parseInt(req.params.id);
  // Check if the author exists directly in the authors table
  const author = await dbStorage.getAuthor(authorId);
  if (!author) return res.sendStatus(404);

  await dbStorage.unfollowAuthor(req.user!.id, authorId);
  res.sendStatus(200);
});

// Check if user is following an author
router.get("/authors/:id/following", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ isFollowing: false });

  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: "Invalid author ID" });
  }

  try {
    const isFollowing = await dbStorage.isFollowing(req.user!.id, authorId);
    res.json({ isFollowing });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ error: "Failed to check follow status", isFollowing: false });
  }
});

// User dashboard endpoint
router.get("/dashboard", async (req: Request, res: Response) => {
  // Check if user is authenticated, return empty structure if not
  if (!req.isAuthenticated()) {
    console.log("Dashboard accessed without authentication");
    return res.json({
      user: {
        username: "Guest",
        bio: null,
        profileImageUrl: null,
        followingCount: 0,
        followerCount: 0,
        socialMediaLinks: []
      },
      readingStats: {
        wishlisted: 0,
        completed: 0
      },
      averageRatings: null,
      recentReviews: [],
      recommendations: []
    });
  }

  try {
    const userId = req.user!.id;
    
    // Get user data
    const user = await dbStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Ensure user has all required fields
    if (!user.username || user.username === null) {
      console.warn(`User ${userId} has null username, using fallback`);
      user.username = "User";
    }
    
    // Get user reading statistics
    const wishlistedBooks = await dbStorage.getWishlistedBooks(userId) || [];
    const wishlisted = wishlistedBooks.length;
    
    const completedBooks = await dbStorage.getCompletedBooks(userId) || [];
    const completed = completedBooks.length;
    
    // Get user's ratings for averages
    const userRatings = await dbStorage.getUserRatings(userId) || [];
    
    let averageRatings = null;
    if (userRatings.length > 0) {
      const enjoymentSum = userRatings.reduce((sum, r) => sum + r.enjoyment, 0);
      const writingSum = userRatings.reduce((sum, r) => sum + r.writing, 0);
      const themesSum = userRatings.reduce((sum, r) => sum + r.themes, 0);
      const charactersSum = userRatings.reduce((sum, r) => sum + r.characters, 0);
      const worldbuildingSum = userRatings.reduce((sum, r) => sum + r.worldbuilding, 0);
      
      const count = userRatings.length;
      
      // Calculate weighted overall rating based on default weights
      const overallSum = userRatings.reduce((sum, r) => {
        const weightedRating = 
          (r.enjoyment * 0.3) + 
          (r.writing * 0.3) + 
          (r.themes * 0.2) + 
          (r.characters * 0.1) + 
          (r.worldbuilding * 0.1);
        return sum + weightedRating;
      }, 0);
      
      averageRatings = {
        overall: overallSum / count,
        enjoyment: enjoymentSum / count,
        writing: writingSum / count,
        themes: themesSum / count,
        characters: charactersSum / count,
        worldbuilding: worldbuildingSum / count
      };
    }
    
    // Get recent reviews with book information
    let recentReviewsRaw = [];
    try {
      recentReviewsRaw = await db
        .select({
          id: ratings.id,
          review: ratings.review,
          enjoyment: ratings.enjoyment,
          writing: ratings.writing,
          themes: ratings.themes,
          characters: ratings.characters,
          worldbuilding: ratings.worldbuilding,
          createdAt: ratings.createdAt,
          bookId: books.id,
          bookTitle: books.title,
          // Note: author column no longer exists in books table
          authorId: books.authorId
        })
        .from(ratings)
        .innerJoin(books, eq(ratings.bookId, books.id))
        .where(eq(ratings.userId, userId))
        .orderBy(desc(ratings.createdAt))
        .limit(5);
    } catch (error) {
      console.error("Error fetching recent reviews:", error);
      // Continue with empty reviews rather than failing the whole request
    }
      
    // Get all book IDs from the reviews to fetch their images
    const reviewBookIds = recentReviewsRaw.map(review => review.bookId);
    
    // Get images for each book
    const bookImagesData = reviewBookIds.length > 0 
      ? await db.select()
        .from(bookImages)
        .where(inArray(bookImages.bookId, reviewBookIds))
      : [];
      
    // Group images by book ID
    const imagesByBookId = new Map<number, { imageUrl: string, imageType: string }[]>();
    bookImagesData.forEach(image => {
      if (!imagesByBookId.has(image.bookId)) {
        imagesByBookId.set(image.bookId, []);
      }
      imagesByBookId.get(image.bookId)!.push({
        imageUrl: image.imageUrl,
        imageType: image.imageType
      });
    });
    
    // Add cover image URL to each review (preferring 'mini' type for reviews)
    const recentReviews = recentReviewsRaw.map(review => {
      const bookImages = imagesByBookId.get(review.bookId) || [];
      // Try to find the mini image first, as it's meant for reviews
      let coverImage = bookImages.find(img => img.imageType === 'mini');
      // If no mini image, try book-card
      if (!coverImage) {
        coverImage = bookImages.find(img => img.imageType === 'book-card');
      }
      // If still no image, use any available image
      if (!coverImage && bookImages.length > 0) {
        coverImage = bookImages[0];
      }
      
      return {
        ...review,
        bookCoverUrl: coverImage ? coverImage.imageUrl : null
      };
    });
    
    // Get recommendations - using book taxonomies instead of direct genre arrays
    const userGenres = new Set<number>();
    
    // Collect book IDs from wishlisted and completed books
    const bookIds = [...wishlistedBooks, ...completedBooks].map(book => book.id);
    
    // Skip taxonomy lookup if no books found
    if (bookIds.length > 0) {
      try {
        // Fetch taxonomies for these books
        const bookTaxonomies = await db
          .select({
            taxonomyId: bookGenreTaxonomies.taxonomyId,
            type: genreTaxonomies.type
          })
          .from(bookGenreTaxonomies)
          .innerJoin(
            genreTaxonomies,
            eq(bookGenreTaxonomies.taxonomyId, genreTaxonomies.id)
          )
          .where(
            and(
              inArray(bookGenreTaxonomies.bookId, bookIds),
              eq(genreTaxonomies.type, 'genre') // Only consider main genres
            )
          );
        
        // Add taxonomy IDs to the set
        bookTaxonomies.forEach(taxonomy => userGenres.add(taxonomy.taxonomyId));
      } catch (error) {
        console.error("Error fetching book taxonomies for recommendation:", error);
      }
    }
    
    // Get books in user's preferred genres that they haven't rated yet
    let recommendationsRaw = [];
    
    if (userGenres.size > 0) {
      try {
        // For now we'll switch to a simpler recommendation strategy
        // Get books that the user has not rated yet
        const userRatedBookIds = userRatings.map(rating => rating.bookId);
        
        // Convert the Set of taxonomy IDs to an array
        const taxonomyIdsArray = Array.from(userGenres);
        
        // Query for books with matching taxonomies, excluding ones the user has already rated
        if (userRatedBookIds.length === 0) {
          // If user hasn't rated any books, get books with matching taxonomies
          // First get book IDs that match the user's genres
          const bookIdsWithUserGenres = await db
            .select({
              bookId: bookGenreTaxonomies.bookId
            })
            .from(bookGenreTaxonomies)
            .where(inArray(bookGenreTaxonomies.taxonomyId, taxonomyIdsArray))
            .groupBy(bookGenreTaxonomies.bookId);
            
          // Then fetch those books
          if (bookIdsWithUserGenres.length > 0) {
            const matchingBookIds = bookIdsWithUserGenres.map(item => item.bookId);
            recommendationsRaw = await db
              .select()
              .from(books)
              .where(inArray(books.id, matchingBookIds))
              .orderBy(desc(books.impressionCount))
              .limit(6);
          } else {
            // Fallback to popular books if no matching genre books found
            recommendationsRaw = await db
              .select()
              .from(books)
              .orderBy(desc(books.impressionCount))
              .limit(6);
          }
        } else {
          // Get books with matching taxonomies, excluding ones the user has already rated
          const bookIdsWithUserGenres = await db
            .select({
              bookId: bookGenreTaxonomies.bookId
            })
            .from(bookGenreTaxonomies)
            .where(inArray(bookGenreTaxonomies.taxonomyId, taxonomyIdsArray))
            .groupBy(bookGenreTaxonomies.bookId);
            
          if (bookIdsWithUserGenres.length > 0) {
            const matchingBookIds = bookIdsWithUserGenres.map(item => item.bookId)
              .filter(id => !userRatedBookIds.includes(id));
              
            recommendationsRaw = await db
              .select()
              .from(books)
              .where(inArray(books.id, matchingBookIds))
              .orderBy(desc(books.impressionCount))
              .limit(6);
          } else {
            // Fallback to popular books if no matching genre books found
            recommendationsRaw = await db
              .select()
              .from(books)
              .where(notInArray(books.id, userRatedBookIds))
              .orderBy(desc(books.impressionCount))
              .limit(6);
          }
        }
      } catch (error) {
        console.error("Error getting recommendations:", error);
        recommendationsRaw = [];
      }
    }
    
    // Get all book IDs from recommendations to fetch their images
    const recommendationBookIds = recommendationsRaw.map(book => book.id);
    
    // Get images for each recommended book
    const recommendationImagesData = recommendationBookIds.length > 0 
      ? await db.select()
        .from(bookImages)
        .where(inArray(bookImages.bookId, recommendationBookIds))
      : [];
      
    // Group images by book ID
    const recommendationImagesByBookId = new Map<number, { imageUrl: string, imageType: string }[]>();
    recommendationImagesData.forEach(image => {
      if (!recommendationImagesByBookId.has(image.bookId)) {
        recommendationImagesByBookId.set(image.bookId, []);
      }
      recommendationImagesByBookId.get(image.bookId)!.push({
        imageUrl: image.imageUrl,
        imageType: image.imageType
      });
    });
    
    // Add cover image URL to each recommendation (preferring 'book-card' type for recommendations)
    const recommendations = recommendationsRaw.map(book => {
      const bookImages = recommendationImagesByBookId.get(book.id) || [];
      // Try to find the book-card image first, as it's meant for recommendations
      let coverImage = bookImages.find(img => img.imageType === 'book-card');
      // If no book-card image, try mini or book-detail
      if (!coverImage) {
        coverImage = bookImages.find(img => img.imageType === 'book-detail' || img.imageType === 'mini');
      }
      // If still no image, use any available image
      if (!coverImage && bookImages.length > 0) {
        coverImage = bookImages[0];
      }
      
      return {
        ...book
      };
    });
    
    // Get user's following/follower counts
    const followingCount = await dbStorage.getFollowingCount(userId);
    const followerCount = await dbStorage.getFollowerCount(userId);
    
    // Format the response
    const dashboard = {
      user: {
        username: user.username || 'User',
        bio: user.bio || null,
        profileImageUrl: user.profileImageUrl || null,
        followingCount: followingCount || 0,
        followerCount: followerCount || 0,
        socialMediaLinks: user.socialMediaLinks || []
      },
      readingStats: {
        wishlisted,
        completed
      },
      averageRatings,
      recentReviews,
      recommendations
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    res.status(500).json({ error: "Failed to retrieve dashboard data", details: error });
  }
});

export default router;
