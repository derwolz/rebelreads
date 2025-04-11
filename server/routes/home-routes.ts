import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { db } from "../db";
import { ratings, books, followers } from "@shared/schema";
import { eq, and, inArray, desc, avg, count, sql } from "drizzle-orm";

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
  { name: 'bookImage_book-card', maxCount: 1 },
  { name: 'bookImage_grid-item', maxCount: 1 },
  { name: 'bookImage_mini', maxCount: 1 },
  { name: 'bookImage_hero', maxCount: 1 }
]);

const router = Router();

// Serve uploaded files
router.use("/uploads", express.static("uploads"));

router.get("/books", async (_req, res) => {
  const books = await dbStorage.getBooks();
  res.json(books);
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
  res.json(book);
});

router.get("/books/:id/ratings", async (req, res) => {
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const ratings = await dbStorage.getRatings(bookId);
  res.json(ratings);
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
  const books = await dbStorage.getBooksByAuthor(req.user!.id);
  res.json(books);
});

router.post("/books", multipleImageUpload, async (req, res) => {
  if (!req.isAuthenticated() || !req.user!.isAuthor) {
    return res.sendStatus(401);
  }

  try {
    // Log the request body and files for debugging
    console.log("Book creation request:", req.body);
    console.log("Uploaded files:", req.files);
    
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

    // Create the book first (without taxonomies and without cover URL)
    const book = await dbStorage.createBook({
      title: req.body.title,
      description: req.body.description,
      authorId: req.user!.id,
      author: req.user!.authorName || req.user!.username,
      formats: formats,
      promoted: false,
      authorImageUrl: null,
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

    // Extract image type info from field names
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

router.patch("/books/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const book = await dbStorage.getBook(parseInt(req.params.id));
  if (!book || book.authorId !== req.user!.id) {
    return res.sendStatus(403);
  }

  try {
    // Add debugging to see what's in the request
    console.log("Book update request body:", JSON.stringify(req.body, null, 2));
    
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
    if (bookData.referralLinks) safeBookData.referralLinks = bookData.referralLinks;
    if (bookData.internal_details) safeBookData.internal_details = bookData.internal_details;
    if (bookData.coverUrl) safeBookData.coverUrl = bookData.coverUrl;
    
    console.log("Safe book data:", JSON.stringify(safeBookData, null, 2));
    
    // Update main book data first (only if we have data to update)
    let updatedBook = book;
    if (Object.keys(safeBookData).length > 0) {
      updatedBook = await dbStorage.updateBook(book.id, safeBookData);
    }
    
    // Then handle taxonomies if present
    if (genreTaxonomies) {
      await dbStorage.updateBookTaxonomies(book.id, genreTaxonomies);
    }
    
    res.json(updatedBook);
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ error: "Failed to update book" });
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

router.post("/authors/:id/follow", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const authorId = parseInt(req.params.id);
  const author = await dbStorage.getUser(authorId);
  if (!author?.isAuthor) return res.sendStatus(404);

  await dbStorage.followAuthor(req.user!.id, authorId);
  res.sendStatus(200);
});

router.post("/authors/:id/unfollow", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const authorId = parseInt(req.params.id);
  const author = await dbStorage.getUser(authorId);
  if (!author?.isAuthor) return res.sendStatus(404);

  await dbStorage.unfollowAuthor(req.user!.id, authorId);
  res.sendStatus(200);
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
    
    // Get user reading statistics
    const wishlistedBooks = await dbStorage.getWishlistedBooks(userId);
    const wishlisted = wishlistedBooks.length;
    
    const completedBooks = await dbStorage.getCompletedBooks(userId);
    const completed = completedBooks.length;
    
    // Get user's ratings for averages
    const userRatings = await dbStorage.getUserRatings(userId);
    
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
    const recentReviews = await db
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
        bookCoverUrl: books.coverUrl,
        bookAuthor: books.author
      })
      .from(ratings)
      .innerJoin(books, eq(ratings.bookId, books.id))
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt))
      .limit(5);
    
    // Get recommendations - for now simple recommendations based on user's most read genres
    const userGenres = new Set<string>();
    [...wishlistedBooks, ...completedBooks].forEach(book => {
      book.genres.forEach(genre => userGenres.add(genre));
    });
    
    // Get books in user's preferred genres that they haven't rated yet
    let recommendations = [];
    
    if (userGenres.size > 0) {
      // Using a simpler approach to avoid SQL array operators
      try {
        // Get all books
        const allBooks = await db.select().from(books).limit(50);
        
        // Get user's rated books
        const userRatedBookIds = userRatings.map(rating => rating.bookId);
        
        // Filter recommendations client-side
        recommendations = allBooks.filter(book => {
          // Don't recommend books the user has already rated
          if (userRatedBookIds.includes(book.id)) {
            return false;
          }
          
          // Check if the book has any genres that match user interests
          return book.genres.some(genre => userGenres.has(genre));
        }).slice(0, 6);
      } catch (error) {
        console.error("Error getting recommendations:", error);
        recommendations = [];
      }
    }
    
    // Get user's following/follower counts
    const followingCount = await dbStorage.getFollowingCount(userId);
    const followerCount = await dbStorage.getFollowerCount(userId);
    
    // Format the response
    const dashboard = {
      user: {
        username: user.username,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        followingCount,
        followerCount,
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
