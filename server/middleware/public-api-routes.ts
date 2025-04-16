/**
 * List of API route patterns that should be publicly accessible without authentication
 * Used in auth middleware to bypass authentication checks for these routes
 * 
 * Format: 
 * - String paths match exactly ('/api/books')
 * - RegExp patterns allow more flexible matching (e.g., all book routes or paths with IDs)
 */
export const publicApiRoutes = [
  // Public endpoints from auth.ts
  '/api/register',
  '/api/login',
  '/api/logout',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/public/verify-seller-code',
  '/api/system-debug',
  
  // Public data access endpoints
  '/api/beta/status',
  
  // Landing page and analytics routes
  '/api/landing',
  '/api/signup-interest',
  
  // Public book access without authentication
  '/api/popular-books',
  
  // Book catalog routes for public viewing
  new RegExp('^\/api\/books(\/\\d+)?(\/ratings|\/reading-status|\/taxonomies)?$'),
  new RegExp('^\/api\/genres.*$'),
  
  // Public system status routes
  '/api/health',
  
  // Make nonexistent-endpoint public for testing
  '/api/nonexistent-endpoint',
];

/**
 * Checks if a path matches any of the public API routes
 * 
 * @param path The path to check
 * @returns True if the path should be publicly accessible
 */
export function isPublicApiRoute(path: string): boolean {
  // Check exact string matches
  if (publicApiRoutes.some(route => 
      typeof route === 'string' && 
      (route === path || path.startsWith(route + '/'))
  )) {
    return true;
  }
  
  // Check regex patterns
  if (publicApiRoutes.some(route => 
      route instanceof RegExp && route.test(path)
  )) {
    return true;
  }
  
  return false;
}