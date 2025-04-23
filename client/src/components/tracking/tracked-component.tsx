import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useTracking } from '../../hooks/use-tracking';

export interface TrackingMetadata {
  [key: string]: any;
}

export interface TrackedComponentProps {
  /** The ID of the book being tracked */
  itemId: number;
  /** The type of component being tracked (e.g., 'book-card', 'spine', 'grid-item', 'mini-card', 'hero-ad', 'vertical-ad', 'horizontal-ad') */
  componentType: string;
  /** The type of container this component is in (e.g., 'carousel', 'book-rack', 'grid', 'book-shelf', etc) */
  containerType: string;
  /** Optional ID of the container */
  containerId?: string;
  /** Optional position within the container (index) */
  position?: number;
  /** Optional additional metadata */
  metadata?: TrackingMetadata;
  /** The component to be wrapped with tracking */
  children: ReactNode;
  /** Whether to track hover events */
  trackHover?: boolean;
  /** Whether to track click events */
  trackClick?: boolean;
  /** Whether to track impressions */
  trackImpression?: boolean;
  /** Optional className to pass to the wrapper div */
  className?: string;
}

/**
 * A generic tracked component wrapper that can be used with any UI component
 * 
 * This component handles:
 * - Impressions (when the component is visible for at least 500ms)
 * - Hover events (when the component is hovered for at least 300ms)
 * - Click events (when the component is clicked)
 */
export function TrackedComponent({
  itemId,
  componentType,
  containerType,
  containerId,
  position,
  metadata,
  children,
  trackHover = true,
  trackClick = true,
  trackImpression = true,
  className
}: TrackedComponentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  // Use our custom tracking hook
  const {
    trackImpression: trackImpressionFn,
    trackHover: trackHoverFn,
    trackCardClick
  } = useTracking(containerType, containerId);

  // Set up intersection observer to track when the component becomes visible
  useEffect(() => {
    if (!trackImpression) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }, // Component must be 50% visible to count
    );

    if (componentRef.current) {
      observer.observe(componentRef.current);
    }

    return () => observer.disconnect();
  }, [trackImpression]);

  // Record impression when component is visible for 500ms (debounced)
  useEffect(() => {
    if (!trackImpression) return;
    
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (isVisible && !hasRecordedImpression) {
      timeoutId = setTimeout(() => {
        trackImpressionFn(itemId, componentType, position, 'view', metadata);
        setHasRecordedImpression(true);
      }, 500);
    }
    
    return () => clearTimeout(timeoutId);
  }, [isVisible, hasRecordedImpression, itemId, componentType, position, metadata, trackImpressionFn, trackImpression]);

  // Handle hover events with a 300ms delay to avoid accidental hovers
  const handleMouseEnter = () => {
    if (!trackHover) return;
    
    setIsHovering(true);
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
    }
    
    hoverTimerRef.current = setTimeout(() => {
      trackHoverFn(itemId, componentType, position, metadata);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (!trackHover) return;
    
    setIsHovering(false);
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Handle component click (will be recorded before navigation)
  const handleClick = () => {
    if (!trackClick) return;
    
    trackCardClick(itemId, componentType, position, metadata);
  };

  return (
    <div 
      ref={componentRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}