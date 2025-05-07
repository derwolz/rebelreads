import { Router, Request, Response } from "express";
import { dbStorage } from "../../storage";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../db";
import { rating_preferences } from "../../../shared/schema";

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

// Helper to calculate reading compatibility between an author and a user
async function calculateAuthorUserCompatibility(authorId: number, userId: number) {
  try {
    // Get author's average ratings across books
    const authorRatings = await dbStorage.getAuthorAggregateRatings(authorId);
    
    if (!authorRatings) {
      return {
        overall: "No ratings available",
        score: 0,
        normalizedDifference: 1, // Maximum difference
        criteria: {}
      };
    }
    
    // Get user's rating preferences
    let userPrefs = await db.query.rating_preferences.findFirst({
      where: eq(rating_preferences.userId, userId)
    });
    
    // Create default preferences if they don't exist
    if (!userPrefs) {
      console.log(`Creating default preferences for user ${userId}`);
      
      await db.insert(rating_preferences).values([{
        userId: userId,
        enjoyment: "0.5",
        writing: "0.5",
        themes: "0.5",
        characters: "0.5",
        worldbuilding: "0.5",
        autoAdjust: true
      }]);
      
      // Retrieve the newly created preferences
      userPrefs = await db.query.rating_preferences.findFirst({
        where: eq(rating_preferences.userId, userId)
      });
      
      // If still not found, create a temporary object
      if (!userPrefs) {
        userPrefs = {
          id: 0, // Placeholder
          userId: userId,
          enjoyment: "0.5",
          writing: "0.5",
          themes: "0.5",
          characters: "0.5",
          worldbuilding: "0.5",
          autoAdjust: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    }
    
    // Calculate compatibility for each criterion
    const criteria = ['enjoyment', 'writing', 'themes', 'characters', 'worldbuilding'] as const;
    let totalWeightedDiff = 0;
    let totalWeight = 0;
    const criteriaCompatibility: Record<string, any> = {};
    
    for (const criterion of criteria) {
      // Convert to our new -1 to 1 scale from the old 0 to 5 star scale
      // For author ratings: 
      // 0 stars = -1 (thumbs down)
      // 2.5 stars = 0 (neutral)
      // 5 stars = 1 (thumbs up)
      const authorRatingOldScale = authorRatings[criterion];
      const authorValue = (authorRatingOldScale - 2.5) / 2.5; // Convert 0-5 scale to -1 to 1
      
      // User preferences are already on 0-1 scale, convert to -1 to 1
      const userValue = parseFloat(userPrefs[criterion].toString()) * 2 - 1;
      
      // Calculate the absolute difference and normalize to 0-1 scale
      // Since our weights are on a -1 to 1 scale, the max difference is 2
      const diff = Math.abs(authorValue - userValue) / 2;
      const normalized = diff;
      
      // Apply compatibility levels based on normalized difference
      let compatibility = "";
      if (normalized <= 0.02) {
        compatibility = "Overwhelmingly compatible";
      } else if (normalized <= 0.05) {
        compatibility = "Very compatible";
      } else if (normalized <= 0.10) {
        compatibility = "Mostly compatible";
      } else if (normalized <= 0.20) {
        compatibility = "Mixed compatibility";
      } else if (normalized <= 0.35) {
        compatibility = "Mostly incompatible";
      } else if (normalized <= 0.40) {
        compatibility = "Very incompatible";
      } else {
        compatibility = "Overwhelmingly incompatible";
      }
      
      criteriaCompatibility[criterion] = {
        compatibility,
        difference: diff,
        normalized
      };
      
      // Add to weighted overall calculation
      // Use the average of both values for this criterion
      const criterionWeight = (Math.abs(authorValue) + Math.abs(userValue)) / 2;
      totalWeightedDiff += diff * criterionWeight;
      totalWeight += criterionWeight;
    }
    
    // Calculate overall normalized difference
    const overallNormalized = totalWeight > 0 ? totalWeightedDiff / totalWeight : 0;
    
    // Determine overall compatibility
    let overallCompatibility = "";
    if (overallNormalized <= 0.02) {
      overallCompatibility = "Overwhelmingly compatible";
    } else if (overallNormalized <= 0.05) {
      overallCompatibility = "Very compatible";
    } else if (overallNormalized <= 0.10) {
      overallCompatibility = "Mostly compatible";
    } else if (overallNormalized <= 0.20) {
      overallCompatibility = "Mixed compatibility";
    } else if (overallNormalized <= 0.35) {
      overallCompatibility = "Mostly incompatible";
    } else if (overallNormalized <= 0.40) {
      overallCompatibility = "Very incompatible";
    } else {
      overallCompatibility = "Overwhelmingly incompatible";
    }
    
    // Calculate compatibility score on a -3 to +3 scale
    let compatibilityScore = 0;
    if (overallNormalized <= 0.02) compatibilityScore = 3;
    else if (overallNormalized <= 0.05) compatibilityScore = 2;
    else if (overallNormalized <= 0.10) compatibilityScore = 1;
    else if (overallNormalized <= 0.20) compatibilityScore = 0;
    else if (overallNormalized <= 0.35) compatibilityScore = -1;
    else if (overallNormalized <= 0.40) compatibilityScore = -2;
    else compatibilityScore = -3;
    
    return {
      overall: overallCompatibility,
      score: compatibilityScore,
      normalizedDifference: overallNormalized,
      criteria: criteriaCompatibility,
      // Include additional data for debugging or advanced display
      authorRatings: {
        enjoyment: authorRatings.enjoyment,
        writing: authorRatings.writing,
        themes: authorRatings.themes,
        characters: authorRatings.characters,
        worldbuilding: authorRatings.worldbuilding,
        overall: authorRatings.overall
      }
    };
  } catch (error) {
    console.error("Error calculating author compatibility:", error);
    return {
      overall: "Error calculating compatibility",
      score: 0,
      normalizedDifference: 1,
      criteria: {}
    };
  }
}

/**
 * GET /api/authors/:id/compatibility
 * Get the compatibility rating between the logged-in user and an author
 * Authentication required
 */
router.get("/:id/compatibility", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: "Invalid author ID" });
  }
  
  try {
    // Check if the author exists
    const author = await dbStorage.getAuthor(authorId);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    
    // Check if the author has enough ratings for meaningful compatibility
    // Get books by this author
    const authorBooks = await dbStorage.getBooksByAuthor(authorId);
    
    // Get total number of ratings across all books
    let totalRatings = 0;
    if (authorBooks && authorBooks.length > 0) {
      const bookIds = authorBooks.map(book => book.id);
      const allRatings = await dbStorage.getRatingsForBooks(bookIds);
      totalRatings = allRatings.length;
    }
    
    // Minimum ratings needed for compatibility calculation
    const MINIMUM_RATINGS_REQUIRED = 10;
    const hasEnoughRatings = totalRatings >= MINIMUM_RATINGS_REQUIRED;
    
    // Get the current user's ID
    const userId = req.user!.id;
    
    if (!hasEnoughRatings) {
      // Get author's average ratings still, but don't calculate compatibility
      const authorRatings = await dbStorage.getAuthorAggregateRatings(authorId);
      const userPreferences = await dbStorage.getRatingPreferences(userId);
      
      return res.json({
        currentUser: {
          id: userId,
          username: req.user!.username,
          preferences: userPreferences || null
        },
        authorRatings: authorRatings || {
          overall: 0,
          enjoyment: 0,
          writing: 0,
          themes: 0, 
          characters: 0,
          worldbuilding: 0
        },
        totalRatings: totalRatings,
        ratingsNeeded: MINIMUM_RATINGS_REQUIRED - totalRatings,
        hasEnoughRatings: false
      });
    }
    
    // Calculate compatibility between user and author
    const compatibility = await calculateAuthorUserCompatibility(authorId, userId);
    
    // Get user's rating preferences
    const userPreferences = await dbStorage.getRatingPreferences(userId);
    
    // Return both author ratings and compatibility data
    res.json({
      currentUser: {
        id: userId,
        username: req.user!.username,
        preferences: userPreferences || null
      },
      authorRatings: compatibility.authorRatings,
      totalRatings: totalRatings,
      hasEnoughRatings: true,
      compatibility: {
        overall: compatibility.overall,
        score: compatibility.score,
        normalizedDifference: compatibility.normalizedDifference,
        criteria: compatibility.criteria
      }
    });
  } catch (error) {
    console.error("Error fetching author compatibility:", error);
    res.status(500).json({ error: "Failed to calculate compatibility" });
  }
});

export default router;