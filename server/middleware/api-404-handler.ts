import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle non-existent API routes (404 Not Found)
 * This should be registered after all other API routes but before the catch-all route
 */
export function api404Handler(req: Request, res: Response, next: NextFunction) {
  // Skip if it's not an API route or response headers already sent
  if (!req.path.startsWith('/api/') || res.headersSent) {
    return next();
  }
  
  // Skip if the route is already processed by another handler
  if (req.route) {
    return next();
  }
  
  // If we get here, it means the API route doesn't exist
  // Return a standardized 404 JSON response
  console.warn(`API 404 (handler): ${req.method} ${req.path}`);
  return res.status(404).json({ 
    error: "Not Found",
    message: `The requested API endpoint ${req.path} does not exist`
  });
}

/**
 * Middleware to handle method not allowed (405) for API routes
 * This can be used on specific routes that only support certain methods
 */
export function apiMethodNotAllowed(allowedMethods: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (allowedMethods.includes(req.method)) {
      return next();
    }
    
    res.setHeader('Allow', allowedMethods.join(', '));
    return res.status(405).json({
      error: "Method Not Allowed", 
      message: `The ${req.method} method is not supported for this endpoint`
    });
  };
}