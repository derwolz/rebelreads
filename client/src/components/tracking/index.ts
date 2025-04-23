// Export all tracking types and components

/**
 * Information about the container of a tracked element
 */
export interface ContainerInfo {
  /** Type of container: 'carousel', 'book-rack', 'grid', 'book-shelf', 'wishlist' */
  type: string;
  /** Optional ID of the container */
  id?: string;
  /** Optional position in container (index) */
  position?: number;
  /** Page context/route */
  context: string;
}

/**
 * Additional metadata for tracking
 */
export interface TrackingMetadata {
  [key: string]: any;
}

// Export all the tracked components
export * from './tracked-component';
export * from './tracked-book-components';