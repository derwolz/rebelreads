import { Request, Response, NextFunction } from 'express';
import { dbStorage } from '../storage';

/**
 * Middleware to require seller authentication
 * This ensures only authenticated sellers can access seller-only routes
 */
export async function requireSeller(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if the user is a seller using the storage method
    const isUserSeller = await dbStorage.isUserSeller(req.user!.id);
    
    if (!isUserSeller) {
      return res.status(403).json({ error: 'Seller access required' });
    }

    next();
  } catch (error) {
    console.error('Error verifying seller status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to get seller information and attach it to the request
 * Useful for routes that need seller info but don't necessarily require seller status
 */
export async function attachSellerInfo(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return next();
    }

    // Get seller info if the user is a seller
    const sellerInfo = await dbStorage.getSellerByUserId(req.user!.id);
    
    // Attach seller info to the request object
    req.sellerInfo = sellerInfo || null;
    
    next();
  } catch (error) {
    console.error('Error getting seller info:', error);
    // Don't block the request on error, just continue
    next();
  }
}