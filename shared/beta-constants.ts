// Define beta feature constants

// Get the beta end date from environment variables
// The server will have access to process.env.BETA_END_DATE
// Format expected: mm/dd/yyyy (e.g., "12/31/2025")
export function getBetaEndDate(): Date {
  // We use this approach to make the code work in both server and client environments
  if (typeof process !== 'undefined' && process.env && process.env.BETA_END_DATE) {
    return new Date(process.env.BETA_END_DATE);
  }
  
  // Fallback for client-side or if env variable is not defined
  // Client code will get the actual date from the server response
  return new Date('12/31/2025');
}

// Check if a date is before the beta end date
export function isBeforeBetaEnd(date: Date): boolean {
  return date < getBetaEndDate();
}