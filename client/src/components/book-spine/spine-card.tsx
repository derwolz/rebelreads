import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { Book } from "../../types";
import { cn } from "@/lib/utils";
import { SPINE_WIDTH, SPINE_HEIGHT, calculateLeaningGeometry } from "./constants";

// SpineCard component props interface
export interface SpineCardProps {
  book: Book;
  angle: number;
  index: number;
  hoveredIndex: number | null;
  onHover: (index: number | null, showCard: boolean) => void;
}

// SpineCard component - extracted from the BookRack component
export function SpineCard({ book, angle, index, hoveredIndex, onHover }: SpineCardProps) {
  // Calculate geometric properties for this book spine
  const { width, offset } = useMemo(() => {
    return calculateLeaningGeometry(angle);
  }, [angle]);
  
  // Get the book images
  const spineImageUrl = book.images?.find(img => img.imageType === "spine")?.imageUrl || "/images/placeholder-book.png";
  
  // Determine if this book is being hovered
  const isHovered = hoveredIndex === index;
  
  // Reference to the timeout for delayed actions
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle mouse enter - notify parent and set timer for card display
  const handleMouseEnter = useCallback(() => {
    // First just notify that this book is hovered (for scaling effect)
    onHover(index, false);
    
    // Set a timer to show the card after a delay
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      // After delay, notify that we want to show the card
      onHover(index, true);
    }, 300);
  }, [index, onHover]);
  
  // Handle mouse leave - clear hover state
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    onHover(null, false);
  }, [onHover]);
  
  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Check if we should show the book card
  const showBookCard = isHovered && hoveredIndex !== null;
  
  return (
    <div 
      className="relative group inline-block"
      style={{ 
        width: `${width}px`,
        height: `${SPINE_HEIGHT}px`,
        zIndex: showBookCard ? 0 : 1,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Book Spine */}
      <div 
        className="absolute w-[56px] h-full transition-all duration-300 ease-in-out"
        style={{ 
          transform: `translateX(${offset}px) rotate(${angle}deg) ${isHovered ? 'scale(1.05)' : ''}`,
          transformOrigin: angle < 0 ? 'bottom left' : angle > 0 ? 'bottom right' : 'center',
          left: `${(width - SPINE_WIDTH) / 2}px`, // Center the book in its container
          zIndex: showBookCard ? 11 : 1, // Keep spine above card
        }}
      >
        <img 
          src={spineImageUrl} 
          alt={book.title}
          className="w-full h-full object-cover"
          style={{ maxWidth: `${SPINE_WIDTH}px` }}
        />
        {/* Shadow overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-70 pointer-events-none"
          style={{ maxWidth: `${SPINE_WIDTH}px`}}
        />
      </div>
    </div>
  );
}