import { Request, Response, NextFunction } from 'express';
import { dbStorage } from '../storage';

export async function requireAuthor(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if the user is an author using the new AuthorStorage method
    const isAuthor = await dbStorage.isUserAuthor(req.user!.id);
    
    if (!isAuthor) {
      return res.status(403).json({ error: 'Author access required' });
    }

    next();
  } catch (error) {
    console.error('Error verifying author status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function requirePublisher(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if the user is a publisher using the new PublisherStorage method
    const isPublisher = await dbStorage.isUserPublisher(req.user!.id);
    
    if (!isPublisher) {
      return res.status(403).json({ error: 'Publisher access required' });
    }

    next();
  } catch (error) {
    console.error('Error verifying publisher status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}