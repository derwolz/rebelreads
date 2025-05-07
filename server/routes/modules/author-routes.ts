import { Router, Request, Response } from "express";
import { dbStorage } from "../../storage";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /api/authors/:id
 * Get author details by ID
 * Authentication required to prevent scraping attacks
 */
router.get("/:id([0-9]+)", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: "Invalid author ID" });
  }
  
  try {
    const author = await dbStorage.getAuthor(authorId);
    
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Get number of books published by this author
    const books = await dbStorage.getBooksByAuthor(author.id);
    
    // Get number of followers for this author
    const followerCount = await dbStorage.getFollowerCount(author.id);
    
    // Get author aggregate ratings
    const aggregateRatings = await dbStorage.getAuthorAggregateRatings(author.id);
    
    // Get total number of ratings across all books
    let totalRatings = 0;
    if (books && books.length > 0) {
      const bookIds = books.map(book => book.id);
      const allRatings = await dbStorage.getRatingsForBooks(bookIds);
      totalRatings = allRatings.length;
    }
    
    // Get user profile data for profile image
    const userData = await dbStorage.getUser(author.userId);
    
    // Update response with enhanced data
    const authorWithStats = {
      ...author,
      bookCount: books.length,
      followerCount: followerCount,
      totalRatings: totalRatings,
      books: books,
      aggregateRatings: aggregateRatings,
      profileImageUrl: userData?.profileImageUrl
    };
    
    return res.json(authorWithStats);
  } catch (error) {
    console.error(`Error fetching author by ID: ${authorId}:`, error);
    return res.status(500).json({ error: "Failed to fetch author" });
  }
});

/**
 * GET /api/author
 * Get author details by name via query parameter
 * Alternate route for API by author name which is more SEO friendly
 * Example: /api/author?name=John%20Doe
 * 
 * Public endpoint - no authentication required
 */
router.get("/", async (req, res) => {
  const authorName = req.query.name;
  
  if (!authorName) {
    return res.status(400).json({ error: "Author name is required as a query parameter" });
  }
  
  try {
    const author = await dbStorage.getAuthorByName(authorName as string);
    
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Get number of books published by this author
    const books = await dbStorage.getBooksByAuthor(author.id);
    
    // Get number of followers for this author
    const followerCount = await dbStorage.getFollowerCount(author.id);
    
    // Get author aggregate ratings
    const aggregateRatings = await dbStorage.getAuthorAggregateRatings(author.id);
    
    // Get total number of ratings across all books
    let totalRatings = 0;
    if (books && books.length > 0) {
      const bookIds = books.map(book => book.id);
      const allRatings = await dbStorage.getRatingsForBooks(bookIds);
      totalRatings = allRatings.length;
    }
    
    // Get user profile data for profile image
    const userData = await dbStorage.getUser(author.userId);
    
    // Update response with enhanced data
    const authorWithStats = {
      ...author,
      bookCount: books.length,
      followerCount: followerCount,
      totalRatings: totalRatings,
      books: books,
      aggregateRatings: aggregateRatings,
      profileImageUrl: userData?.profileImageUrl
    };
    
    return res.json(authorWithStats);
  } catch (error) {
    console.error(`Error fetching author by name: ${authorName}:`, error);
    return res.status(500).json({ error: "Failed to fetch author" });
  }
});

/**
 * GET /api/authors/:id/publisher
 * Get publisher details for a specific author
 * Authentication required to prevent scraping attacks
 */
router.get("/:id/publisher", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

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
    
    if (!publisher) {
      return res.json(null); // No publisher associated with this author
    }
    
    return res.json(publisher);
  } catch (error) {
    console.error("Error fetching author publisher:", error);
    return res.status(500).json({ error: "Failed to fetch author publisher" });
  }
});

/**
 * GET /api/authors/:id/bookshelves
 * Get bookshelves shared by an author
 * Public endpoint - no authentication required since these are shared shelves
 */
router.get("/:id/bookshelves", async (req, res) => {
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
    
    // Get user ID for this author
    const userId = author.userId;
    
    if (!userId) {
      return res.status(404).json({ error: "Author's user account not found" });
    }
    
    // Get shared bookshelves for this user
    const bookshelves = await dbStorage.getSharedBookshelvesForUser(userId);
    
    return res.json(bookshelves);
  } catch (error) {
    console.error("Error fetching author bookshelves:", error);
    return res.status(500).json({ error: "Failed to fetch author bookshelves" });
  }
});

/**
 * POST /api/authors/:id/follow
 * Follow an author
 * Authentication required
 */
router.post("/:id/follow", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: "Invalid author ID" });
  }
  
  try {
    // Don't allow following yourself
    const userAuthor = await dbStorage.getAuthorByUserId(req.user!.id);
    if (userAuthor && userAuthor.id === authorId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }
    
    const result = await dbStorage.followAuthor(req.user!.id, authorId);
    res.json(result);
  } catch (error: any) {
    console.error("Error following author:", error);
    res.status(500).json({ error: error.message || "Failed to follow author" });
  }
});

/**
 * POST /api/authors/:id/unfollow
 * Unfollow an author
 * Authentication required
 */
router.post("/:id/unfollow", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: "Invalid author ID" });
  }
  
  try {
    const result = await dbStorage.unfollowAuthor(req.user!.id, authorId);
    res.json(result);
  } catch (error: any) {
    console.error("Error unfollowing author:", error);
    res.status(500).json({ error: error.message || "Failed to unfollow author" });
  }
});

/**
 * GET /api/authors/:id/following
 * Check if the logged-in user is following an author
 * Authentication required
 */
router.get("/:id/following", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: "Invalid author ID" });
  }
  
  try {
    const isFollowing = await dbStorage.isFollowing(req.user!.id, authorId);
    // Return both formats for compatibility (isFollowing and following)
    res.json({ isFollowing: isFollowing, following: isFollowing });
  } catch (error: any) {
    console.error("Error checking following status:", error);
    res.status(500).json({ error: error.message || "Failed to check following status" });
  }
});

/**
 * GET /api/my-books/ratings
 * Get all ratings for an author's books
 * Authentication required
 */
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

export default router;