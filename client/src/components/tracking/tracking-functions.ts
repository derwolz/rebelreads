import { recordLocalImpression, recordLocalClickThrough } from '../../lib/impressionStorage';

// Define the interfaces here to avoid circular dependencies
export interface ContainerInfo {
  type: string;
  id?: string;
  position?: number;
  context: string;
}

export interface TrackingMetadata {
  [key: string]: any;
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