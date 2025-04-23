import React from 'react';
import { TrackedBookCardComponent } from './tracking/tracked-book-components';
import { BookCard } from './book-card';

// Define the Book type with just the required properties
interface BookWithId {
  id: number;
  [key: string]: any; // Allow all other properties
}

interface TrackedBookCardProps {
  book: BookWithId;
  containerType: string;
  containerId?: string;
  position?: number;
  taxonomicScore?: number;
  matchingTaxonomies?: number;
  className?: string;
}

/**
 * A wrapped version of BookCard with tracking capabilities
 * 
 * This component tracks:
 * - Impressions when card is visible for 500ms
 * - Hover events after 300ms of hovering
 * - Click events
 */
export function TrackedBookCard({
  book,
  containerType,
  containerId,
  position,
  taxonomicScore,
  matchingTaxonomies,
  className
}: TrackedBookCardProps) {
  return (
    <TrackedBookCardComponent
      book={book}
      containerType={containerType}
      containerId={containerId}
      position={position}
      className={className}
    >
      <BookCard 
        book={book as any} 
        taxonomicScore={taxonomicScore}
        matchingTaxonomies={matchingTaxonomies}
      />
    </TrackedBookCardComponent>
  );
}