/**
 * Utility for managing book impressions locally before syncing with the server
 */
import { apiRequest } from "./queryClient";

// Types for locally stored impressions
export interface LocalImpression {
  bookId: number;
  source: string;
  context: string;
  timestamp: number;
}

export interface LocalClickThrough {
  bookId: number;
  source: string;
  referrer: string;
  timestamp: number;
}

// Local storage keys
const IMPRESSIONS_KEY = "book_impressions";
const CLICK_THROUGHS_KEY = "book_click_throughs";
const LAST_SYNC_KEY = "last_impression_sync";

// Get impressions from local storage
export function getStoredImpressions(): LocalImpression[] {
  try {
    const storedImpressions = localStorage.getItem(IMPRESSIONS_KEY);
    return storedImpressions ? JSON.parse(storedImpressions) : [];
  } catch (error) {
    console.error("Error retrieving impressions from local storage:", error);
    return [];
  }
}

// Get click-throughs from local storage
export function getStoredClickThroughs(): LocalClickThrough[] {
  try {
    const storedClickThroughs = localStorage.getItem(CLICK_THROUGHS_KEY);
    return storedClickThroughs ? JSON.parse(storedClickThroughs) : [];
  } catch (error) {
    console.error("Error retrieving click-throughs from local storage:", error);
    return [];
  }
}

// Record a new impression locally
export function recordLocalImpression(
  bookId: number,
  source: string,
  context: string
): void {
  try {
    const impressions = getStoredImpressions();
    
    // Check if this impression already exists to avoid duplicates
    const exists = impressions.some(
      (imp) => imp.bookId === bookId && imp.source === source && imp.context === context
    );
    
    if (!exists) {
      const newImpression: LocalImpression = {
        bookId,
        source,
        context,
        timestamp: Date.now(),
      };
      
      impressions.push(newImpression);
      localStorage.setItem(IMPRESSIONS_KEY, JSON.stringify(impressions));
    }
  } catch (error) {
    console.error("Error storing impression in local storage:", error);
  }
}

// Record a new click-through locally
export function recordLocalClickThrough(
  bookId: number,
  source: string,
  referrer: string
): void {
  try {
    const clickThroughs = getStoredClickThroughs();
    
    const newClickThrough: LocalClickThrough = {
      bookId,
      source,
      referrer,
      timestamp: Date.now(),
    };
    
    clickThroughs.push(newClickThrough);
    localStorage.setItem(CLICK_THROUGHS_KEY, JSON.stringify(clickThroughs));
    
    // Immediately sync click-throughs when they happen
    // This ensures we don't lose data if the user quickly navigates away
    syncWithServer().catch(console.error);
  } catch (error) {
    console.error("Error storing click-through in local storage:", error);
  }
}

// Clear processed impressions and click-throughs
export function clearProcessedData(
  processedImpressions: LocalImpression[],
  processedClickThroughs: LocalClickThrough[]
): void {
  try {
    // Remove processed impressions
    let impressions = getStoredImpressions();
    impressions = impressions.filter((imp) => 
      !processedImpressions.some(
        (processed) => 
          processed.bookId === imp.bookId && 
          processed.source === imp.source && 
          processed.context === imp.context && 
          processed.timestamp === imp.timestamp
      )
    );
    localStorage.setItem(IMPRESSIONS_KEY, JSON.stringify(impressions));
    
    // Remove processed click-throughs
    let clickThroughs = getStoredClickThroughs();
    clickThroughs = clickThroughs.filter((click) => 
      !processedClickThroughs.some(
        (processed) => 
          processed.bookId === click.bookId && 
          processed.source === click.source && 
          processed.referrer === click.referrer && 
          processed.timestamp === click.timestamp
      )
    );
    localStorage.setItem(CLICK_THROUGHS_KEY, JSON.stringify(clickThroughs));
    
    // Update the last sync timestamp
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error("Error clearing processed data from local storage:", error);
  }
}

// Sync local data with the server
export async function syncWithServer(): Promise<void> {
  try {
    const impressions = getStoredImpressions();
    const clickThroughs = getStoredClickThroughs();
    
    if (impressions.length === 0 && clickThroughs.length === 0) {
      return;
    }
    
    const processedImpressions: LocalImpression[] = [];
    const processedClickThroughs: LocalClickThrough[] = [];
    
    // Process impressions
    for (const impression of impressions) {
      try {
        await apiRequest("POST", `/api/books/${impression.bookId}/impression`, {
          source: impression.source,
          context: impression.context,
        });
        processedImpressions.push(impression);
      } catch (error) {
        console.error(`Failed to sync impression for book ${impression.bookId}:`, error);
      }
    }
    
    // Process click-throughs
    for (const clickThrough of clickThroughs) {
      try {
        await apiRequest("POST", `/api/books/${clickThrough.bookId}/click-through`, {
          source: clickThrough.source,
          referrer: clickThrough.referrer,
        });
        processedClickThroughs.push(clickThrough);
      } catch (error) {
        console.error(`Failed to sync click-through for book ${clickThrough.bookId}:`, error);
      }
    }
    
    // Clear processed data
    clearProcessedData(processedImpressions, processedClickThroughs);
  } catch (error) {
    console.error("Error syncing with server:", error);
  }
}

// Setup periodic sync (e.g., every 5 minutes)
export function setupPeriodicSync(intervalMinutes = 5): () => void {
  const intervalId = setInterval(() => {
    syncWithServer().catch(console.error);
  }, intervalMinutes * 60 * 1000);
  
  // Return a cleanup function
  return () => clearInterval(intervalId);
}