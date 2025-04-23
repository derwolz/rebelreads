import React from 'react';
import { TrackedGridItemComponent } from './tracking/tracked-book-components';
import { BookGridCard } from './book-grid-card';

// Define the Book type with just the required properties
interface BookWithId {
  id: number;
  [key: string]: any; // Allow all other properties
}

interface TrackedBookGridCardProps {
  book: BookWithId;
  containerType: string;
  containerId?: string;
  position?: number;
  className?: string;
}

/**
 * A wrapped version of BookGridCard with tracking capabilities
 * 
 * This component tracks:
 * - Impressions when card is visible for 500ms
 * - Hover events after 300ms of hovering
 * - Click events
 */
export function TrackedBookGridCard({
  book,
  containerType,
  containerId,
  position,
  className
}: TrackedBookGridCardProps) {
  return (
    <TrackedGridItemComponent
      book={book}
      containerType={containerType}
      containerId={containerId}
      position={position}
      className={className}
    >
      <BookGridCard book={book as any} />
    </TrackedGridItemComponent>
  );
}