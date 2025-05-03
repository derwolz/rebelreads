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
import { z } from "zod";

const router = Router();

// Helper to calculate reading compatibility between two users
async function calculateReadingCompatibility(user1Id: number, user2Id: number) {
  // Get both users' rating preferences
  let user1Prefs = await db.query.rating_preferences.findFirst({
    where: eq(rating_preferences.userId, user1Id)
  });
  
  let user2Prefs = await db.query.rating_preferences.findFirst({
    where: eq(rating_preferences.userId, user2Id)
  });
  
  console.log("User 1 preferences:", user1Prefs);
  console.log("User 2 preferences:", user2Prefs);
  
  // Create default preferences if they don't exist
  if (!user1Prefs) {
    console.log(`Creating default preferences for user ${user1Id}`);
    const defaults = {
      userId: user1Id,
      enjoyment: 0.5,
      writing: 0.5,
      themes: 0.5,
      characters: 0.5,
      worldbuilding: 0.5,
      autoAdjust: true
    };
    
    await db.insert(rating_preferences).values(defaults);
    user1Prefs = defaults;
  }
  
  if (!user2Prefs) {
    console.log(`Creating default preferences for user ${user2Id}`);
    const defaults = {
      userId: user2Id,
      enjoyment: 0.5,
      writing: 0.5,
      themes: 0.5,
      characters: 0.5,
      worldbuilding: 0.5,
      autoAdjust: true
    };
    
    await db.insert(rating_preferences).values(defaults);
    user2Prefs = defaults;
  }
  
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

// Get user profile by username (public endpoint, no auth required)
router.get("/:username", async (req: Request, res: Response) => {
  const { username } = req.params;
  
  try {
    // Find user by username
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get follower count
    const followerCount = await db
      .select({ count: count() })
      .from(followers)
      .where(and(
        eq(followers.followingId, user.id),
        eq(followers.deletedAt, null as any)
      ));
    
    // Get following count
    const followingCount = await db
      .select({ count: count() })
      .from(followers)
      .where(and(
        eq(followers.followerId, user.id),
        eq(followers.deletedAt, null as any)
      ));
    
    // Get user's rating preferences
    const ratingPreferences = await db.query.rating_preferences.findFirst({
      where: eq(rating_preferences.userId, user.id)
    });
    
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
    let wishlistBooks: Array<{book: typeof books.$inferSelect & {coverImage?: typeof bookImages.$inferSelect}}> = [];
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
          ...item.book
        }
      }));
      
      // Get images for wishlist books
      for (let i = 0; i < wishlistBooks.length; i++) {
        const bookCoverImage = await db.query.bookImages.findFirst({
          where: and(
            eq(bookImages.bookId, wishlistBooks[i].book.id),
            eq(bookImages.imageType, "book-card")
          )
        });
        
        if (bookCoverImage) {
          wishlistBooks[i].book.coverImage = bookCoverImage;
        }
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
    let recommendedBooks: Array<{book: typeof books.$inferSelect & {coverImage?: typeof bookImages.$inferSelect}}> = [];
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
          ...item.book
        }
      }));
      
      // Get images for recommended books
      for (let i = 0; i < recommendedBooks.length; i++) {
        const bookCoverImage = await db.query.bookImages.findFirst({
          where: and(
            eq(bookImages.bookId, recommendedBooks[i].book.id),
            eq(bookImages.imageType, "book-card")
          )
        });
        
        if (bookCoverImage) {
          recommendedBooks[i].book.coverImage = bookCoverImage;
        }
      }
    }
    
    // Calculate rating compatibility if the request is from a different authenticated user
    let compatibility = null;
    if (req.user && req.user.id !== user.id) {
      console.log(`Calculating compatibility between user ${req.user.id} and ${user.id}`);
      compatibility = await calculateReadingCompatibility(req.user.id, user.id);
      console.log("Compatibility result:", compatibility);
    } else if (req.user) {
      console.log(`User viewing own profile or not authenticated: ${req.user.id}, target: ${user.id}`);
    } else {
      console.log("No authenticated user");
    }
    
    // Return complete user profile data
    const profileData = {
      username: user.username,
      displayName: user.displayName || user.username,
      profileImageUrl: user.profileImageUrl,
      bio: user.bio,
      followerCount: followerCount[0]?.count || 0,
      followingCount: followingCount[0]?.count || 0,
      ratingPreferences: compatibility ? null : ratingPreferences, // Only show preferences to the owner
      compatibility, // Only for logged-in users viewing others
      wishlist: wishlistBooks,
      pinnedShelves,
      recommendedBooks
    };
    
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
    const targetUser = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if the current user is following the target user
    const followRecord = await db.query.followers.findFirst({
      where: and(
        eq(followers.followerId, req.user.id),
        eq(followers.followingId, targetUser.id),
        eq(followers.deletedAt, null as any)
      )
    });
    
    res.json({ isFollowing: !!followRecord });
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
    const targetUser = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Prevent following yourself
    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }
    
    // Check if already following
    const existingFollow = await db.query.followers.findFirst({
      where: and(
        eq(followers.followerId, req.user.id),
        eq(followers.followingId, targetUser.id)
      )
    });
    
    if (existingFollow) {
      if (existingFollow.deletedAt) {
        // If previously unfollowed, reactivate by removing deletedAt
        await db
          .update(followers)
          .set({ deletedAt: null })
          .where(eq(followers.id, existingFollow.id));
        
        return res.json({ success: true, action: "followed" });
      } else {
        // If already following, mark as unfollowed
        await db
          .update(followers)
          .set({ deletedAt: new Date() })
          .where(eq(followers.id, existingFollow.id));
        
        return res.json({ success: true, action: "unfollowed" });
      }
    } else {
      // Create new follow record
      await db
        .insert(followers)
        .values({
          followerId: req.user.id,
          followingId: targetUser.id
        });
      
      return res.json({ success: true, action: "followed" });
    }
  } catch (error) {
    console.error("Error updating follow status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;