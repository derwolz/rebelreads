import { Request, Response, NextFunction } from 'express';

/**
 * Authentication middleware to ensure the user is logged in
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
}