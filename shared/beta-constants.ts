// Define beta feature constants

// Beta end date (mm/dd/yyyy) 
export const BETA_END_DATE = "12/31/2025"; // December 31, 2025

// Get the beta end date as a Date object
export function getBetaEndDate(): Date {
  return new Date(BETA_END_DATE);
}

// Check if a date is before the beta end date
export function isBeforeBetaEnd(date: Date): boolean {
  return date < getBetaEndDate();
}