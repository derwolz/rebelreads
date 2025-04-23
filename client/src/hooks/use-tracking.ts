import { useCallback } from 'react';
import { useLocation } from 'wouter';
import { 
  ContainerInfo, 
  TrackingMetadata,
  trackBookImpression, 
  trackBookClickThrough 
} from '../components/tracking/tracking-functions';

/**
 * Hook to provide tracking functions with pre-configured context
 * 
 * @param containerType - Type of container: 'carousel', 'book-rack', 'grid', 'book-shelf', 'wishlist'
 * @param containerId - Optional ID of the container
 * @returns Object with tracking utility functions
 */
export function useTracking(containerType: string, containerId?: string) {
  const [location] = useLocation();

  /**
   * Create a container info object with the current page context
   * 
   * @param position - Optional position in container (index)
   * @returns ContainerInfo object
   */
  const createContextInfo = useCallback((position?: number): ContainerInfo => {
    return {
      type: containerType,
      id: containerId,
      position,
      context: location // current page route
    };
  }, [containerType, containerId, location]);

  /**
   * Track a book impression
   * 
   * @param bookId - ID of the book
   * @param sourceComponent - Component type: 'book-card', 'spine-book', 'grid-item', 'mini-card'
   * @param position - Position in container (optional)
   * @param type - Type of impression: 'view', 'detail-expand', 'card-click', 'referral-click'
   * @param metadata - Optional additional metadata
   */
  const trackImpression = useCallback((
    bookId: number,
    sourceComponent: string,
    position?: number,
    type: string = 'view',
    metadata?: TrackingMetadata
  ) => {
    const containerInfo = createContextInfo(position);
    trackBookImpression(bookId, sourceComponent, containerInfo, type, metadata);
  }, [createContextInfo]);

  /**
   * Track a click-through (when a book card is clicked leading to a details page)
   * 
   * @param bookId - ID of the book
   * @param sourceComponent - Component type that was clicked
   * @param position - Position in container (optional)
   * @param referrer - Previous page or context (defaults to current location)
   * @param metadata - Optional additional metadata
   */
  const trackClickThrough = useCallback((
    bookId: number,
    sourceComponent: string,
    position?: number,
    referrer?: string,
    metadata?: TrackingMetadata
  ) => {
    const containerInfo = createContextInfo(position);
    trackBookClickThrough(
      bookId, 
      sourceComponent, 
      containerInfo, 
      referrer || location,
      metadata
    );
  }, [createContextInfo, location]);
  
  /**
   * Track when a referral link is clicked (with domain capture)
   * 
   * @param bookId - ID of the book
   * @param sourceComponent - Component type that was clicked
   * @param targetUrl - The URL being linked to
   * @param position - Position in container (optional)
   * @param metadata - Optional additional metadata
   */
  const trackReferralWithDomain = useCallback((
    bookId: number,
    sourceComponent: string,
    targetUrl: string,
    position?: number,
    metadata?: TrackingMetadata
  ) => {
    const containerInfo = createContextInfo(position);
    
    // Extract domain from the target URL
    let domain = '';
    try {
      const url = new URL(targetUrl);
      domain = url.hostname;
    } catch (e) {
      console.error('Invalid URL in referral tracking:', targetUrl);
      domain = 'unknown';
    }
    
    // Add domain to metadata
    const enhancedMetadata = {
      ...metadata,
      referralDomain: domain
    };
    
    trackBookClickThrough(
      bookId, 
      sourceComponent, 
      containerInfo, 
      location, // Current location as referrer
      enhancedMetadata
    );
  }, [createContextInfo, location]);

  /**
   * Track when a user hovers over a book card (detail-expand)
   * 
   * @param bookId - ID of the book
   * @param sourceComponent - Component type: 'book-card', 'spine-book', 'grid-item', 'mini-card'
   * @param position - Position in container (optional)
   * @param metadata - Optional additional metadata
   */
  const trackHover = useCallback((
    bookId: number,
    sourceComponent: string,
    position?: number,
    metadata?: TrackingMetadata
  ) => {
    trackImpression(bookId, sourceComponent, position, 'detail-expand', metadata);
  }, [trackImpression]);

  /**
   * Track when a book card is clicked
   * 
   * @param bookId - ID of the book
   * @param sourceComponent - Component type: 'book-card', 'spine-book', 'grid-item', 'mini-card'
   * @param position - Position in container (optional)
   * @param metadata - Optional additional metadata
   */
  const trackCardClick = useCallback((
    bookId: number,
    sourceComponent: string,
    position?: number,
    metadata?: TrackingMetadata
  ) => {
    trackImpression(bookId, sourceComponent, position, 'card-click', metadata);
  }, [trackImpression]);

  /**
   * Track when a referral link is clicked
   * 
   * @param bookId - ID of the book
   * @param sourceComponent - Component type: 'book-card', 'spine-book', 'grid-item', 'mini-card'
   * @param position - Position in container (optional)
   * @param metadata - Optional additional metadata
   */
  const trackReferralClick = useCallback((
    bookId: number,
    sourceComponent: string,
    position?: number,
    metadata?: TrackingMetadata
  ) => {
    trackImpression(bookId, sourceComponent, position, 'referral-click', metadata);
  }, [trackImpression]);

  return {
    trackImpression,
    trackClickThrough,
    trackHover,
    trackCardClick,
    trackReferralClick,
    trackReferralWithDomain
  };
}