import { ZodError } from "zod";

/**
 * Formats a ZodError into a more readable format for API responses
 * @param error The ZodError to format
 * @returns An object with a field name as the key and the error message as the value
 */
export function formatZodError(error: ZodError) {
  return error.errors.reduce((acc, curr) => {
    const key = curr.path.join(".") || "form";
    acc[key] = curr.message;
    return acc;
  }, {} as Record<string, string>);
}