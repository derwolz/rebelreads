import { Request, Response, NextFunction } from "express";
import { dbStorage } from "../storage";

/**
 * Middleware to require seller authentication
 * This ensures only authenticated sellers can access seller-only routes
 */
export async function requireSeller(req: Request, res: Response, next: NextFunction) {
  try {
    // First, check if the user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Then check if the authenticated user is a seller
    const userId = req.user!.id;
    const isSeller = await dbStorage.isUserSeller(userId);

    if (!isSeller) {
      return res.status(403).json({ error: "Seller access required" });
    }

    // Get the seller information and attach it to the request
    const sellerInfo = await dbStorage.getSellerByUserId(userId);
    req.sellerInfo = sellerInfo;

    // Continue to the route handler
    return next();
  } catch (error) {
    console.error("Error in seller authentication:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware to get seller information and attach it to the request
 * Useful for routes that need seller info but don't necessarily require seller status
 */
export async function attachSellerInfo(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip if not authenticated
    if (!req.isAuthenticated()) {
      return next();
    }

    // Check if the authenticated user is a seller
    const userId = req.user!.id;
    const sellerInfo = await dbStorage.getSellerByUserId(userId);

    // Attach seller info to the request if found
    req.sellerInfo = sellerInfo;

    // Continue to the route handler
    return next();
  } catch (error) {
    console.error("Error attaching seller info:", error);
    // Don't block the request, just continue
    return next();
  }
}