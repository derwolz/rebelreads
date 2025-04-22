import { useState, useEffect, useRef } from 'react';
import { useTracking } from '../hooks/use-tracking';
import { BookCard } from './book-card';
import { Book } from "../types";

export interface TrackedBookCardProps {
  book: Book;
  containerType: string;
  containerId?: string;
  position?: number;
  taxonomicScore?: number;
  matchingTaxonomies?: number;
}

/**
 * A wrapped version of BookCard that includes tracking functionality
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
 * @param taxonomicScore - Optional taxonomic score for recommendations
 * @param matchingTaxonomies - Optional count of matching taxonomies
 */
export function TrackedBookCard({
  book,
  containerType,
  containerId,
  position,
  taxonomicScore,
  matchingTaxonomies
}: TrackedBookCardProps) {
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
        trackImpression(book.id, 'book-card', position);
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
      trackHover(book.id, 'book-card', position);
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
    trackCardClick(book.id, 'book-card', position);
  };

  return (
    <div 
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <BookCard 
        book={book} 
        taxonomicScore={taxonomicScore} 
        matchingTaxonomies={matchingTaxonomies} 
      />
    </div>
  );
}