import { Router, Request, Response } from "express";
import { dbStorage } from "../../storage";
import { enhanceReferralLinks } from "../../utils/favicon-utils";
import multer from "multer";
import { sirenedImageBucket } from "../../services/sirened-image-bucket";
import sharp from "sharp";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const multipleImageUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
}).fields([
  { name: 'bookImage_full', maxCount: 1 },
  { name: 'bookImage_background', maxCount: 1 },
  { name: 'bookImage_book-cover', maxCount: 1 },
  { name: 'bookImage_book-card', maxCount: 1 },
  { name: 'bookImage_hero', maxCount: 1 },
  { name: 'bookImage_spine', maxCount: 1 },
  { name: 'bookImage_mini', maxCount: 1 },
  { name: 'bookImage_vertical-banner', maxCount: 1 },
  { name: 'bookImage_horizontal-banner', maxCount: 1 }
]);

/**
 * GET /api/books-by-name/taxonomies
 * Get taxonomies for a specific book by author name and book title
 * Public endpoint - no authentication required
 */
router.get("/taxonomies", async (req, res) => {
  // Force JSON content type to prevent Vite intercept
  res.type('application/json');
  
  // Get author name and book title from query parameters
  const authorName = req.query.authorName as string;
  const bookTitle = req.query.bookTitle as string;
  
  if (!authorName || !bookTitle) {
    return res.status(400).json({ 
      error: "Missing parameters", 
      message: "Both authorName and bookTitle are required" 
    });
  }

  try {
    // Look up the book by author name and title
    const book = await dbStorage.getBookByAuthorAndTitle(authorName, bookTitle);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    const taxonomies = await dbStorage.getBookTaxonomies(book.id);
    return res.json(taxonomies);
  } catch (error) {
    console.error("Error fetching book taxonomies:", error);
    return res.status(500).json({ error: "Failed to fetch book taxonomies" });
  }
});

/**
 * PATCH /api/books-by-name/update
 * Update an existing book by author name and title
 * Authentication and author status required
 */
router.patch("/update", async (req, res) => {
  // Force JSON content type
  res.type('json');
  
  try {
    // Basic validation
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get user ID
    const userId = req.user!.id;
    
    // Get author name and book title from query parameters
    const authorName = req.query.authorName as string;
    const bookTitle = req.query.bookTitle as string;
    
    if (!authorName || !bookTitle) {
      return res.status(400).json({ 
        error: "Missing parameters", 
        message: "Both authorName and bookTitle are required query parameters" 
      });
    }
    
    console.log(`Looking up book by author name and book title: ${authorName}, ${bookTitle}`);
    
    // Find book by author name and title
    const book = await dbStorage.getBookByAuthorAndTitle(authorName, bookTitle);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Get author record
    const author = await dbStorage.getAuthorByUserId(userId);
    if (!author) {
      return res.status(403).json({ error: "Not an author" });
    }
    
    // Verify ownership
    if (book.authorId !== author.id) {
      return res.status(403).json({ error: "Not authorized - you don't own this book" });
    }
    
    console.log("PATCH request for book:", book.id);
    console.log("Update fields:", Object.keys(req.body));
    
    // Extract the updated fields from request body
    // Remove non-book fields to avoid DB errors
    const { authorname, bookname, genreTaxonomies, bookImages, ...updates } = req.body;
    
    // Process the update
    console.log("Processing update with full data:", {
      fieldsToUpdate: Object.keys(updates),
      hasTaxonomies: !!genreTaxonomies,
      hasImages: !!bookImages,
      taxonomiesCount: genreTaxonomies ? genreTaxonomies.length : 0,
      imagesCount: bookImages ? bookImages.length : 0
    });
    
    // Update the book basic info in database
    const updatedBook = await dbStorage.updateBook(book.id, updates);
    
    // Update taxonomies if provided
    if (genreTaxonomies && Array.isArray(genreTaxonomies)) {
      console.log("Updating taxonomies:", genreTaxonomies);
      await dbStorage.updateBookTaxonomies(book.id, genreTaxonomies);
    }
    
    // Process book images if provided
    if (bookImages && Array.isArray(bookImages) && bookImages.length > 0) {
      console.log("Processing images update:", bookImages.length, "images");
      
      for (const image of bookImages) {
        if (image && image.imageUrl && image.imageType) {
          try {
            // Get dimensions from image data or use defaults based on type
            const width = image.width || 100;
            const height = image.height || 100;
            const sizeKb = image.sizeKb || 0;
            
            // Add or update the image in the database using object format
            await dbStorage.addBookImage({
              bookId: book.id,
              imageUrl: image.imageUrl,
              imageType: image.imageType,
              width,
              height,
              sizeKb,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log(`Updated ${image.imageType} image: ${image.imageUrl}`);
          } catch (error) {
            console.error(`Error updating image ${image.imageType}:`, error);
          }
        }
      }
    }
    
    // Get the complete updated book with all its images and taxonomies
    const completeBook = await dbStorage.getBook(book.id);
    
    // Get the book taxonomies to include in the response
    const bookTaxonomies = await dbStorage.getBookTaxonomies(book.id);
    
    // Add taxonomies to the complete book object
    const bookWithTaxonomies = {
      ...completeBook,
      genreTaxonomies: bookTaxonomies
    };
    
    // Return success with updated book including images and taxonomies
    return res.status(200).json(bookWithTaxonomies);
  } catch (error) {
    console.error("PATCH book error:", error);
    return res.status(500).json({ 
      error: "Failed to update book",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * PATCH /api/books-by-name/upload
 * Update a book with file uploads using author name and title instead of ID
 * Authentication and author status required
 */
router.patch("/upload", multipleImageUpload, async (req, res) => {
  // Force JSON content type
  res.type('json');
  
  try {
    // Basic validation
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get user ID
    const userId = req.user!.id;
    
    // Get author name and book title from query parameters
    const authorName = req.query.authorName as string;
    const bookTitle = req.query.bookTitle as string;
    
    if (!authorName || !bookTitle) {
      return res.status(400).json({ 
        error: "Missing parameters", 
        message: "Both authorName and bookTitle are required query parameters" 
      });
    }
    
    console.log(`Looking up book by author name and book title: ${authorName}, ${bookTitle}`);
    
    // Find book by author name and title
    const book = await dbStorage.getBookByAuthorAndTitle(authorName, bookTitle);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Get author record
    const author = await dbStorage.getAuthorByUserId(userId);
    if (!author) {
      return res.status(403).json({ error: "Not an author" });
    }
    
    // Verify ownership
    if (book.authorId !== author.id) {
      return res.status(403).json({ error: "Not authorized - you don't own this book" });
    }
    
    console.log("PATCH upload request for book:", book.id);
    
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
      
      // Track if we have a full image to use for auto-generation
      let fullImageFile: Express.Multer.File | null = null;
      let fullImageUrl: string = '';
      let fullImageChanged = false;
      
      // Check if book already has a full-size image
      let existingFullImageUrl: string | null = null;
      if (book.images && book.images.length > 0) {
        const existingFullImage = book.images.find(img => img.imageType === 'full');
        if (existingFullImage) {
          existingFullImageUrl = existingFullImage.imageUrl;
          console.log(`Found existing full image URL: ${existingFullImageUrl}`);
        }
      }
      
      // First pass: identify the full-size image if it exists
      for (const fieldName in files) {
        if (fieldName.startsWith('bookImage_')) {
          const imageType = fieldName.replace('bookImage_', '') as any;
          const file = files[fieldName][0];
          
          // Store the full image file for auto-generation
          if (imageType === 'full') {
            console.log("Found full size image for book ID:", book.id);
            fullImageFile = file;
            fullImageChanged = true;
          }
        }
      }
      
      // Process all image uploads
      for (const fieldName in files) {
        if (fieldName.startsWith('bookImage_')) {
          const imageType = fieldName.replace('bookImage_', '') as any;
          const file = files[fieldName][0];
          
          try {
            // Upload to storage
            const storageKey = await sirenedImageBucket.uploadBookImage(file, imageType, book.id);
            const imageUrl = await sirenedImageBucket.getPublicUrl(storageKey);
            
            // Log and store the full image URL for auto-generation
            if (imageType === 'full') {
              console.log("IMPORTANT: Saving full size image URL:", imageUrl);
              fullImageUrl = imageUrl;
            }
            
            console.log(`Saved ${imageType} image with URL: ${imageUrl} and storage key: ${storageKey}`);
            
            // Get dimensions based on image type
            let width = 0;
            let height = 0;
            
            switch (imageType) {
              case 'full':
                width = 1600;
                height = 2560;
                console.log("SAVING FULL COVER IMAGE TO DATABASE WITH DIMENSIONS:", width, "x", height);
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
                width = 96;
                height = 160;
                break;
              case 'book-cover':
                width = 480;
                height = 770;
                break;
              case 'vertical-banner':
                width = 400;
                height = 800;
                break;
              case 'horizontal-banner':
                width = 800;
                height = 400;
                break;
              default:
                width = 100;
                height = 100;
            }
            
            // Add or update the image in the database using object format
            await dbStorage.addBookImage({
              bookId: book.id,
              imageUrl,
              imageType,
              width,
              height,
              sizeKb: Math.round(file.size / 1024),
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } catch (error) {
            console.error(`Error processing ${imageType} image:`, error);
            return res.status(500).json({ 
              error: "Image upload failed", 
              message: error instanceof Error ? error.message : "Unknown error" 
            });
          }
        }
      }
      
      // Image regeneration is now handled by the frontend
      // No need for server-side image regeneration
    }
    
    // Update book data in the database
    if (Object.keys(updates).length > 0) {
      console.log("Updating book data with fields:", Object.keys(updates));
      
      // Filter out any image-related fields that might have been added (bookImageType_*)
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => !key.startsWith('bookImageType_'))
      );
      
      console.log("Cleaned update fields:", Object.keys(cleanUpdates));
      
      if (Object.keys(cleanUpdates).length > 0) {
        await dbStorage.updateBook(book.id, cleanUpdates);
      }
    }
    
    // Get the updated book with all its images
    const updatedBook = await dbStorage.getBook(book.id);
    if (!updatedBook) {
      return res.status(500).json({ error: "Failed to retrieve updated book" });
    }
    
    // Get the book taxonomies to include in the response
    const bookTaxonomies = await dbStorage.getBookTaxonomies(book.id);
    
    // Add taxonomies to the complete book object
    const bookWithTaxonomies = {
      ...updatedBook,
      genreTaxonomies: bookTaxonomies
    };
    
    // Return success with updated book including images and taxonomies
    return res.status(200).json(bookWithTaxonomies);
  } catch (error) {
    console.error("PATCH book upload error:", error);
    return res.status(500).json({ 
      error: "Failed to update book with uploads",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * DELETE /api/books-by-name/delete
 * Delete a book by author name and book title via query parameters
 * Authentication and author status required
 */
router.delete("/delete", async (req, res) => {
  // Force JSON content type
  res.type('json');
  
  try {
    // Basic validation
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get user ID
    const userId = req.user!.id;
    
    // Get author name and book title from query parameters
    const authorName = req.query.authorName as string;
    const bookTitle = req.query.bookTitle as string;
    
    if (!authorName || !bookTitle) {
      return res.status(400).json({ 
        error: "Missing parameters", 
        message: "Both authorName and bookTitle are required query parameters" 
      });
    }
    
    console.log(`Looking up book to delete by author name and book title: ${authorName}, ${bookTitle}`);
    
    // Find book by author name and title
    const book = await dbStorage.getBookByAuthorAndTitle(authorName, bookTitle);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Get author record
    const author = await dbStorage.getAuthorByUserId(userId);
    if (!author) {
      return res.status(403).json({ error: "Not an author" });
    }
    
    // Verify ownership
    if (book.authorId !== author.id && !(req.user as any).isAdmin) {
      return res.status(403).json({ error: "Not authorized - you don't own this book" });
    }
    
    // Delete the book
    await dbStorage.deleteBook(book.id, author.id);
    console.log(`Successfully deleted book "${bookTitle}" by author "${authorName}"`);
    
    return res.status(200).json({ 
      message: "Book deleted successfully", 
      bookId: book.id,
      bookTitle: book.title
    });
  } catch (error) {
    console.error("DELETE book error:", error);
    return res.status(500).json({ 
      error: "Failed to delete book",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;