/**
 * Centralized tracking utilities for enhanced analytics
 * 
 * These utilities help standardize tracking across different components
 * by ensuring container metadata is consistently captured.
 */
import { recordLocalImpression, recordLocalClickThrough } from '../../lib/impressionStorage';

/**
 * Interface for container information used in tracking
 */
export interface ContainerInfo {
  type: string;        // Type of container: 'carousel', 'book-rack', 'grid', 'book-shelf', 'wishlist'
  id?: string;         // Optional ID of the container
  position?: number;   // Position of the item within the container (index)
  context: string;     // Page or route context: '/home', '/author-page', etc.
}

/**
 * Interface for additional metadata that can be tracked
 */
export interface TrackingMetadata {
  [key: string]: any;  // Additional tracking data
}

/**
 * Track a book impression with container information
 * 
 * @param bookId - ID of the book being tracked
 * @param source - Source component type: 'book-card', 'spine-book', 'grid-item', 'mini-card'
 * @param containerInfo - Information about the container
 * @param type - Type of impression: 'view', 'detail-expand', 'card-click', 'referral-click'
 * @param metadata - Optional additional metadata
 */
export function trackBookImpression(
  bookId: number,
  source: string,
  containerInfo: ContainerInfo,
  type: string = 'view',
  metadata?: TrackingMetadata
): void {
  recordLocalImpression(
    bookId,
    source,
    containerInfo.context,
    type,
    containerInfo.position,
    containerInfo.type,
    containerInfo.id,
    metadata
  );
}

/**
 * Track a book click-through with container information
 * 
 * @param bookId - ID of the book being tracked
 * @param source - Source component type that was clicked
 * @param containerInfo - Information about the container
 * @param referrer - Previous page or context
 * @param metadata - Optional additional metadata
 */
export function trackBookClickThrough(
  bookId: number,
  source: string,
  containerInfo: ContainerInfo,
  referrer: string,
  metadata?: TrackingMetadata
): void {
  recordLocalClickThrough(
    bookId,
    source,
    referrer,
    containerInfo.position,
    containerInfo.type,
    containerInfo.id,
    metadata
  );
}

/**
 * Create a pre-configured container info object
 * 
 * @param type - Type of container
 * @param context - Page context/route
 * @param id - Optional container ID
 * @returns ContainerInfo object
 */
export function createContainerInfo(
  type: string,
  context: string,
  id?: string
): ContainerInfo {
  return {
    type,
    context,
    id
  };
}