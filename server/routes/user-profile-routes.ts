import { Router, Request, Response } from "express";
import { db } from "../db";
import { 
  users, 
  followers, 
  ratings, 
  reading_status, 
  bookShelves, 
  shelfBooks,
  books,
  rating_preferences,
  bookImages
} from "../../shared/schema";
import { eq, and, desc, asc, inArray, ilike, or, ne, count, avg, gt } from "drizzle-orm";
import { dbStorage } from "../storage";
import { z } from "zod";

const router = Router();

// Get the current user's rating preferences - MUST be placed BEFORE the /:username route to avoid conflicts
router.get("/current/rating-preferences", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const preferences = await dbStorage.getRatingPreferences(req.user.id);
    
    if (!preferences) {
      // Create default preferences if they don't exist
      const defaults = {
        enjoyment: 0.5, 
        writing: 0.5,
        themes: 0.5,
        characters: 0.5,
        worldbuilding: 0.5,
        autoAdjust: true
      };
      
      // Save default preferences
      await dbStorage.saveRatingPreferences(req.user.id, defaults);
      
      // Get the newly created preferences
      const newPreferences = await dbStorage.getRatingPreferences(req.user.id);
      return res.json(newPreferences);
    }
    
    return res.json(preferences);
  } catch (error) {
    console.error("Error fetching user rating preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper to calculate reading compatibility between two users
async function calculateReadingCompatibility(user1Id: number, user2Id: number) {
  console.log(`Calculating compatibility between user ${user1Id} and ${user2Id}`);
  
  // Get or create rating preferences for both users
  const user1Prefs = await getOrCreateUserPreferences(user1Id);
  const user2Prefs = await getOrCreateUserPreferences(user2Id);
  
  // Calculate normalized differences for each rating criterion
  const criteria = ["enjoyment", "writing", "themes", "characters", "worldbuilding"] as const;
  
  // Store differences and calculate compatibility for each criterion
  const criteriaCompatibility: Record<string, {
    compatibility: string;
    difference: number;
    normalized: number;
  }> = {};
  
  // Calculate the total weighted difference for overall compatibility
  let totalWeightedDiff = 0;
  let totalWeight = 0;
  
  for (const criterion of criteria) {
    const user1Value = parseFloat(user1Prefs[criterion].toString());
    const user2Value = parseFloat(user2Prefs[criterion].toString());
    
    // Calculate the absolute difference and normalize to 0-1 scale
    // Since our weights are on a 0-1 scale, the max difference is 1
    const diff = Math.abs(user1Value - user2Value);
    const normalized = diff;
    
    // Apply compatibility levels based on normalized difference
    let compatibility = "";
    if (normalized <= 0.02) {
      compatibility = "Overwhelmingly Compatible";
    } else if (normalized <= 0.05) {
      compatibility = "Very Compatible";
    } else if (normalized <= 0.10) {
      compatibility = "Mostly Compatible";
    } else if (normalized <= 0.20) {
      compatibility = "Mixed";
    } else if (normalized <= 0.35) {
      compatibility = "Mostly Incompatible";
    } else if (normalized <= 0.40) {
      compatibility = "Not Compatible";
    } else {
      compatibility = "Overwhelmingly Not Compatible";
    }
    
    criteriaCompatibility[criterion] = {
      compatibility,
      difference: diff,
      normalized
    };
    
    // Add to weighted overall calculation
    // Use the average of both users' weights for this criterion
    const criterionWeight = (user1Value + user2Value) / 2;
    totalWeightedDiff += diff * criterionWeight;
    totalWeight += criterionWeight;
  }
  
  // Calculate overall normalized difference
  const overallNormalized = totalWeight > 0 ? totalWeightedDiff / totalWeight : 0;
  
  // Determine overall compatibility
  let overallCompatibility = "";
  if (overallNormalized <= 0.02) {
    overallCompatibility = "Overwhelmingly Compatible";
  } else if (overallNormalized <= 0.05) {
    overallCompatibility = "Very Compatible";
  } else if (overallNormalized <= 0.10) {
    overallCompatibility = "Mostly Compatible";
  } else if (overallNormalized <= 0.20) {
    overallCompatibility = "Mixed";
  } else if (overallNormalized <= 0.35) {
    overallCompatibility = "Mostly Incompatible";
  } else if (overallNormalized <= 0.40) {
    overallCompatibility = "Not Compatible";
  } else {
    overallCompatibility = "Overwhelmingly Not Compatible";
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
    criteria: criteriaCompatibility
  };
}

// Helper to get or create user rating preferences
async function getOrCreateUserPreferences(userId: number) {
  // Try to get existing preferences
  let preferences = await dbStorage.getRatingPreferences(userId);
  
  if (!preferences) {
    console.log(`Creating default preferences for user ${userId}`);
    // Create default preferences if they don't exist
    const defaults = {
      enjoyment: 0.5,
      writing: 0.5,
      themes: 0.5,
      characters: 0.5,
      worldbuilding: 0.5,
      autoAdjust: true
    };
    
    // Save the default preferences
    await dbStorage.saveRatingPreferences(userId, defaults);
    
    // Fetch the newly created preferences
    preferences = await dbStorage.getRatingPreferences(userId);
    
    // In case the save or fetch fails, use default values
    if (!preferences) {
      preferences = {
        id: 0,
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
  
  return preferences;
}

// Get user profile by username (public endpoint, no auth required)
router.get("/:username", async (req: Request, res: Response) => {
  const { username } = req.params;
  
  try {
    // Find user by username using dbStorage
    const user = await dbStorage.getUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get follower count using dbStorage
    const followerCount = await dbStorage.getFollowerCount(user.id);
    
    // Get following count using dbStorage
    const followingCount = await dbStorage.getFollowingCount(user.id);
    
    // Get user's rating preferences using dbStorage
    console.log(`Looking up rating preferences for user ${user.id} (${user.username})`);
    const ratingPreferences = await dbStorage.getRatingPreferences(user.id);
    console.log(`Rating preferences result for ${user.username}:`, ratingPreferences);
    
    // Get wishlist books
    const wishlist = await db
      .select({
        bookId: reading_status.bookId
      })
      .from(reading_status)
      .where(and(
        eq(reading_status.userId, user.id),
        eq(reading_status.isWishlisted, true)
      ));
    
    const wishlistIds = wishlist.map(item => item.bookId);
    
    // Get wishlisted books with details
    let wishlistBooks: Array<{book: typeof books.$inferSelect & {images?: typeof bookImages.$inferSelect[]}}> = [];
    if (wishlistIds.length > 0) {
      const tempBooks = await db
        .select({
          book: books,
        })
        .from(books)
        .where(inArray(books.id, wishlistIds))
        .limit(5); // Limit to 5 books for the profile page
      
      wishlistBooks = tempBooks.map(item => ({
        book: {
          ...item.book,
          images: [] // Initialize images array
        }
      }));
      
      // Get all images for wishlist books at once for better performance
      const bookImagesList = await db
        .select()
        .from(bookImages)
        .where(inArray(bookImages.bookId, wishlistIds));
      
      // Group images by book ID
      const imagesByBookId = new Map<number, typeof bookImages.$inferSelect[]>();
      bookImagesList.forEach(image => {
        if (!imagesByBookId.has(image.bookId)) {
          imagesByBookId.set(image.bookId, []);
        }
        imagesByBookId.get(image.bookId)?.push(image);
      });
      
      // Add images to books
      for (let i = 0; i < wishlistBooks.length; i++) {
        const bookId = wishlistBooks[i].book.id;
        wishlistBooks[i].book.images = imagesByBookId.get(bookId) || [];
      }
    }
    
    // Get pinned bookshelves (shared bookshelves)
    const pinnedShelves = await db.query.bookShelves.findMany({
      where: and(
        eq(bookShelves.userId, user.id),
        eq(bookShelves.isShared, true)
      ),
      orderBy: asc(bookShelves.rank),
      limit: 3 // Limit to 3 pinned shelves for the profile page
    });
    
    // Get recommended books (books with positive enjoyment rating)
    const positiveRatings = await db
      .select({
        bookId: ratings.bookId
      })
      .from(ratings)
      .where(and(
        eq(ratings.userId, user.id),
        eq(ratings.enjoyment, 1) // 1 = thumbs up
      ));
    
    const recommendedBookIds = positiveRatings.map(rating => rating.bookId);
    
    // Get recommended books with details
    let recommendedBooks: Array<{book: typeof books.$inferSelect & {images?: typeof bookImages.$inferSelect[]}}> = [];
    if (recommendedBookIds.length > 0) {
      // Get a random selection of 5 books with positive enjoyment ratings
      const randomizedIds = [...recommendedBookIds].sort(() => Math.random() - 0.5).slice(0, 5);
      
      const tempBooks = await db
        .select({
          book: books,
        })
        .from(books)
        .where(inArray(books.id, randomizedIds));
      
      recommendedBooks = tempBooks.map(item => ({
        book: {
          ...item.book,
          images: [] // Initialize images array
        }
      }));
      
      // Get all images for recommended books at once for better performance
      const bookImagesList = await db
        .select()
        .from(bookImages)
        .where(inArray(bookImages.bookId, randomizedIds));
      
      // Group images by book ID
      const imagesByBookId = new Map<number, typeof bookImages.$inferSelect[]>();
      bookImagesList.forEach(image => {
        if (!imagesByBookId.has(image.bookId)) {
          imagesByBookId.set(image.bookId, []);
        }
        imagesByBookId.get(image.bookId)?.push(image);
      });
      
      // Add images to books
      for (let i = 0; i < recommendedBooks.length; i++) {
        const bookId = recommendedBooks[i].book.id;
        recommendedBooks[i].book.images = imagesByBookId.get(bookId) || [];
      }
    }
    
    // Calculate rating compatibility for different viewing scenarios
    let compatibility = null;
    let showRatingPreferences = false;
    
    console.log("Found rating preferences for user profile:", ratingPreferences);
    
    // If the user is viewing their own profile, show them their rating preferences
    if (req.user && req.user.id === user.id) {
      console.log(`User viewing own profile: ${req.user.id}`);
      showRatingPreferences = true;
    } 
    // If an authenticated user is viewing another user's profile, calculate compatibility
    else if (req.user) {
      console.log(`Calculating compatibility between user ${req.user.id} and ${user.id}`);
      
      // Use our helper function to calculate compatibility - it will handle missing preferences
      compatibility = await calculateReadingCompatibility(req.user.id, user.id);
      console.log("Compatibility result:", compatibility);
    }
    // For non-authenticated users, don't calculate compatibility
    else {
      console.log("No authenticated user");
    }
    
    // Return complete user profile data
    console.log(`Just before sending response, rating preferences for ${user.username} are:`, ratingPreferences);
    
    const profileData = {
      username: user.username,
      displayName: user.displayName || user.username,
      profileImageUrl: user.profileImageUrl,
      bio: user.bio,
      followerCount: followerCount || 0, // dbStorage returns a number directly
      followingCount: followingCount || 0, // dbStorage returns a number directly
      ratingPreferences: ratingPreferences, // Always include rating preferences regardless of who is viewing
      compatibility, // Show compatibility for logged-in users viewing others
      wishlist: wishlistBooks,
      pinnedShelves,
      recommendedBooks
    };
    
    console.log(`Final profile data to send (focusing on ratingPreferences):`, { 
      ...profileData, 
      ratingPreferences: profileData.ratingPreferences,
      wishlist: [], // Truncate large arrays for log readability
      pinnedShelves: [],
      recommendedBooks: []
    });
    
    res.json(profileData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if current user is following a specific user
router.get("/:username/following-status", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(200).json({ isFollowing: false });
  }
  
  const { username } = req.params;
  
  try {
    // Find target user by username
    const targetUser = await dbStorage.getUserByUsername(username);
    
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if the current user is following the target user using dbStorage
    const isFollowing = await dbStorage.isFollowing(req.user.id, targetUser.id);
    
    res.json({ isFollowing });
  } catch (error) {
    console.error("Error checking following status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Follow or unfollow a user
router.post("/:username/follow", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const { username } = req.params;
  
  try {
    // Find target user by username
    const targetUser = await dbStorage.getUserByUsername(username);
    
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Prevent following yourself
    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }
    
    // Check if already following 
    const isFollowing = await dbStorage.isFollowing(req.user.id, targetUser.id);
    
    if (isFollowing) {
      // If already following, unfollow
      await dbStorage.unfollowAuthor(req.user.id, targetUser.id);
      return res.json({ success: true, action: "unfollowed" });
    } else {
      // If not following, follow
      await dbStorage.followAuthor(req.user.id, targetUser.id);
      return res.json({ success: true, action: "followed" });
    }
  } catch (error) {
    console.error("Error updating follow status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;