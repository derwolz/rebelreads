import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Book } from "../../types";
import { calculateLeaningGeometry, SPINE_WIDTH, SPINE_HEIGHT } from "./constants";
import { cn } from "@/lib/utils";

// Base interface for BookSpine props
export interface BookSpineProps {
  book: Book;
  angle: number;
  index?: number;
  className?: string;
  onClick?: (book: Book) => void;
  onHover?: (isHovered: boolean) => void;
}

export function BookSpineBase({ 
  book, 
  angle, 
  index, 
  className,
  onClick,
  onHover
}: BookSpineProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate geometric properties for this book spine
  const { width, offset } = useMemo(() => {
    return calculateLeaningGeometry(angle);
  }, [angle]);
  
  // Get the book spine image
  const spineImageUrl = book.images?.find(img => img.imageType === "spine")?.imageUrl || "/images/placeholder-book.png";
  
  // Handle mouse enter
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (onHover) onHover(true);
  }, [onHover]);
  
  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (onHover) onHover(false);
  }, [onHover]);
  
  // Handle click
  const handleClick = useCallback(() => {
    if (onClick) onClick(book);
  }, [onClick, book]);
  
  return (
    <div 
      className={cn(
        "relative cursor-pointer", 
        className
      )}
      style={{ 
        width: `${width}px`,
        height: `${SPINE_HEIGHT}px`,
        zIndex: isHovered ? 10 : 1,
      }}
      onClick={handleClick}
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