/**
 * Utility for managing book impressions locally before syncing with the server
 */
import { apiRequest } from "./queryClient";

// Types for locally stored impressions
export interface LocalImpression {
  bookId: number;
  source: string;         // Component type: 'book-card', 'spine-book', 'grid-item', 'mini-card'
  context: string;        // Page context/path: '/home', '/author-page', etc.
  timestamp: number;
  type?: string;          // Impression type: 'view', 'detail-expand', 'card-click', 'referral-click'
  position?: number;      // Position in container (index)
  container_type?: string; // 'carousel', 'book-rack', 'grid', 'book-shelf', 'wishlist'
  container_id?: string;   // ID of the container if applicable
  metadata?: Record<string, any>; // Additional tracking data
}

export interface LocalClickThrough {
  bookId: number;
  source: string;         // Component type that was clicked
  referrer: string;       // Previous page URL
  timestamp: number;
  position?: number;      // Position in container (index)
  container_type?: string; // 'carousel', 'book-rack', 'grid', 'book-shelf', 'wishlist'
  container_id?: string;   // ID of the container if applicable
  metadata?: Record<string, any>; // Additional tracking data
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
  context: string,
  type: string = "view", // Default type is "view"
  position?: number,
  container_type?: string,
  container_id?: string,
  metadata?: Record<string, any>
): void {
  try {
    const impressions = getStoredImpressions();
    
    // Check if this impression already exists to avoid duplicates
    // For detail-expand type, we allow multiple entries for the same book
    const exists = type !== "detail-expand" && impressions.some(
      (imp) => imp.bookId === bookId && imp.source === source && 
               imp.context === context && imp.type === type
    );
    
    if (!exists) {
      const newImpression: LocalImpression = {
        bookId,
        source,
        context,
        timestamp: Date.now(),
        type,
        position,
        container_type,
        container_id,
        metadata
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
  referrer: string,
  position?: number,
  container_type?: string,
  container_id?: string,
  metadata?: Record<string, any>
): void {
  try {
    const clickThroughs = getStoredClickThroughs();
    
    const newClickThrough: LocalClickThrough = {
      bookId,
      source,
      referrer,
      timestamp: Date.now(),
      position,
      container_type,
      container_id,
      metadata
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
        // Determine weight based on interaction type
        let weight = 1.0; // Default weight
        
        switch (impression.type) {
          case "detail-expand": // Hover/detail expand interactions
            weight = 0.25;
            break;
          case "card-click": // Book card clicks
            weight = 0.5;
            break;
          case "referral-click": // Referral link clicks
            weight = 1.0;
            break;
          default:
            weight = 1.0; // Default view impression
        }
        
        await apiRequest("POST", `/api/books/${impression.bookId}/impression`, {
          source: impression.source,
          context: impression.context,
          type: impression.type || "view",
          weight: weight,
          position: impression.position,
          container_type: impression.container_type,
          container_id: impression.container_id,
          metadata: impression.metadata || {}
        });
        processedImpressions.push(impression);
      } catch (error) {
        console.error(`Failed to sync impression for book ${impression.bookId}:`, error);
      }
    }
    
    // Process click-throughs
    for (const clickThrough of clickThroughs) {
      try {
        // Ensure metadata exists
        const metadata = clickThrough.metadata || {};
        
        // Check if this is a referral link click (external link)
        // by checking if there's a referralDomain in metadata
        const isReferral = !!metadata.referralDomain;
        
        await apiRequest("POST", `/api/books/${clickThrough.bookId}/click-through`, {
          source: clickThrough.source,
          referrer: clickThrough.referrer,
          position: clickThrough.position,
          container_type: clickThrough.container_type,
          container_id: clickThrough.container_id,
          metadata: metadata,
          isReferral: isReferral // Send flag to server to indicate if this is a referral
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