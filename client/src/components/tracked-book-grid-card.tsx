import { useState, useEffect, useRef } from 'react';
import { useTracking } from '../hooks/use-tracking';
import { BookGridCard } from './book-grid-card';
import { Book } from "../types";

export interface TrackedBookGridCardProps {
  book: Book;
  containerType: string;
  containerId?: string;
  position?: number;
}

/**
 * A wrapped version of BookGridCard that includes enhanced tracking functionality
 * 
 * This component handles tracking:
 * - Impressions (when the card is visible for at least 500ms)
 * - Hover events (when the card is hovered for at least 300ms)
 * - Click events (when the card is clicked)
 * 
 * @param book - The book to display
 * @param containerType - Type of container this card is in ('carousel', 'book-rack', 'grid', etc.)
 * @param containerId - Optional ID of the container
 * @param position - Optional position within the container (index)
 */
export function TrackedBookGridCard({
  book,
  containerType,
  containerId,
  position
}: TrackedBookGridCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Use our custom tracking hook
  const {
    trackImpression,
    trackHover,
    trackCardClick
  } = useTracking(containerType, containerId);

  // Set up intersection observer to track when the card becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }, // Card must be 50% visible to count
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Record impression when card is visible for 500ms (debounced)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isVisible && !hasRecordedImpression) {
      timeoutId = setTimeout(() => {
        trackImpression(book.id, 'grid-item', position);
        setHasRecordedImpression(true);
      }, 500);
    }
    
    return () => clearTimeout(timeoutId);
  }, [isVisible, hasRecordedImpression, book.id, trackImpression, position]);

  // Handle hover events with a 300ms delay to avoid accidental hovers
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
    }
    
    hoverTimerRef.current = window.setTimeout(() => {
      trackHover(book.id, 'grid-item', position);
    }, 300);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Handle card click (will be recorded before navigation)
  const handleCardClick = () => {
    trackCardClick(book.id, 'grid-item', position);
  };

  return (
    <div 
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <BookGridCard book={book} />
    </div>
  );
}