import React, { useMemo } from 'react';
import { TrackedSpineComponent } from './tracking/tracked-book-components';
import { cn } from "@/lib/utils";

// Define a generic book type with required properties
interface BookWithId {
  id: number;
  title: string;
  images?: Array<{imageType: string, imageUrl: string}>;
  [key: string]: any; // Allow all other properties
}

interface TrackedBookSpineProps {
  book: BookWithId;
  angle: number;
  index: number;
  hoveredIndex: number | null;
  onHover: (index: number | null, showCard: boolean) => void;
  containerType: string;
  containerId?: string;
  className?: string;
}

// Helper function to calculate leaning geometry
function calculateLeaningGeometry(angle: number) {
  // Convert angle to radians
  const radians = (angle * Math.PI) / 180;
  
  // Calculate width change due to leaning (using cosine)
  const width = Math.cos(radians) * 56;
  
  // Calculate lateral offset due to leaning (using sine)
  const offset = Math.sin(radians) * 56;
  
  return { width, offset };
}

/**
 * A tracked book spine component that includes tracking for impressions and hover events
 */
export function TrackedBookSpine({
  book,
  angle,
  index,
  hoveredIndex,
  onHover,
  containerType,
  containerId,
  className
}: TrackedBookSpineProps) {
  // Calculate geometric properties for this book spine
  const { width, offset } = useMemo(() => {
    return calculateLeaningGeometry(angle);
  }, [angle]);
  
  // Get the book images
  const spineImageUrl = book.images?.find(img => img.imageType === "spine")?.imageUrl || "/images/placeholder-book.png";
  
  // Determine if this book is being hovered
  const isHovered = hoveredIndex === index;
  
  // Handle mouse enter - notify parent and set timer for card display
  const handleMouseEnter = () => {
    // First just notify that this book is hovered (for scaling effect)
    onHover(index, false);
    
    // After a short delay, notify that we want to show the card
    // This is handled by the parent component via onHover callback
  };
  
  // Handle mouse leave - clear hover state
  const handleMouseLeave = () => {
    onHover(null, false);
  };
  
  return (
    <TrackedSpineComponent
      book={book as any}
      containerType={containerType}
      containerId={containerId}
      position={index}
      className={cn(
        "flex relative",
        isHovered ? "z-10" : "z-0",
        className
      )}
    >
      <div
        className={cn(
          "h-[212px] relative transform transition-all duration-300 origin-bottom",
          isHovered ? "scale-105" : ""
        )}
        style={{ 
          width: `${width}px`,
          transform: `translateX(${offset}px) rotate(${angle}deg)`,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={spineImageUrl}
          alt={book.title}
          className="h-full w-full rounded-t object-cover"
        />
      </div>
    </TrackedSpineComponent>
  );
}