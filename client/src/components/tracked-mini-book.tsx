import React from 'react';
import { TrackedMiniCardComponent } from './tracking/tracked-book-components';
import { useLocation } from 'wouter';

// Define a generic book type with required properties
interface BookWithId {
  id: number;
  title: string;
  authorName?: string;
  images?: Array<{imageType: string, imageUrl: string}>;
  [key: string]: any; // Allow all other properties
}

interface TrackedMiniBookProps {
  book: BookWithId;
  rank: number;
  containerType: string;
  containerId?: string;
  position?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * A tracked mini book card component typically used in sidebars or rankings
 * 
 * This component tracks:
 * - Impressions when card is visible
 * - Click events
 */
export function TrackedMiniBook({
  book,
  rank,
  containerType,
  containerId,
  position,
  className,
  onClick
}: TrackedMiniBookProps) {
  const [, navigate] = useLocation();
  
  // Default click handler if none provided
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Use secure anti-scraping URL format instead of the traditional ID-based URL
      if (book.authorName) {
        navigate(`/book-details?authorName=${encodeURIComponent(book.authorName)}&bookTitle=${encodeURIComponent(book.title)}`);
      } else {
        // Fall back to traditional format if author name is missing
        navigate(`/books/${book.id}`);
      }
    }
  };
  
  return (
    <TrackedMiniCardComponent
      book={book as any}
      containerType={containerType}
      containerId={containerId}
      position={position}
      className={className || "flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors group hover:bg-muted/30 border-b border-border/40 pb-3 last:border-0"}
    >
      <div 
        className="flex items-start gap-3 w-full cursor-pointer"
        onClick={handleClick}
      >
        <div className="font-bold text-sm w-5 h-5 bg-muted-foreground/10 rounded-full flex items-center justify-center text-muted-foreground">
          {rank}
        </div>
        <img 
          src={book.images?.find(img => img.imageType === "mini")?.imageUrl || "/images/placeholder-book.png"} 
          alt={book.title} 
          className="w-11 h-16 object-cover rounded flex-shrink-0 group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="overflow-hidden pt-0.5">
          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{book.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{book.authorName}</p>
        </div>
      </div>
    </TrackedMiniCardComponent>
  );
}