import { ZodError } from "zod";

/**
 * Format a Zod validation error into a user-friendly object
 * 
 * @param error The ZodError to format
 * @returns An object with field names as keys and error messages as values
 */
export function formatZodError(error: ZodError) {
  const formattedErrors: Record<string, string> = {};
  
  for (const issue of error.errors) {
    const path = issue.path.join('.');
    // If the path is empty (error on the whole object), use a special key
    const key = path || '_general';
    formattedErrors[key] = issue.message;
  }
  
  return formattedErrors;
}