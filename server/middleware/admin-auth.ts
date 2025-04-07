import { Request, Response, NextFunction } from 'express';

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // TEMPORARY: Allow user ID 16 (our new admin) for testing
  if (req.user?.id === 16) {
    console.log('Allowing admin access for user ID 16');
    return next();
  }

  // Check if the authenticated user's email matches the admin email
  // For development/testing purposes, also allow specific test accounts
  const adminEmails = [
    process.env.ADMIN_EMAIL,
    'der.wolz@gmail.com',   // Test user in the database (for development only)
    'admin@example.com',    // Fallback admin email
    'admin2@example.com'    // New admin user
  ];
  
  console.log('User email:', req.user?.email);
  console.log('Admin emails:', adminEmails);
  console.log('Is admin:', adminEmails.includes(req.user?.email));
  
  if (!adminEmails.includes(req.user?.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}
