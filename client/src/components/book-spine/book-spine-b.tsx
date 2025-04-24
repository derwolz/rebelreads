import { useState, useMemo, useCallback, useRef, useEffect} from "react";
import { calculateLeaningGeometry, SPINE_WIDTH, SPINE_HEIGHT, BookSpineProps } from "./constants";

import { cn } from "@/lib/utils";


// BookSpineA - Version with colored trim and featured badge
export function BookSpineB({book, 
                           angle, 
                           index, 
                           className,
                           onClick,
                           onHover}:BookSpineProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate geometric properties for this book spine
  const { width, offset } = useMemo(() => {
    return calculateLeaningGeometry(angle);
  }, [angle]);
  const [trailElements, setTrailElements] = useState<React.ReactNode[]>([]);


  // Generate pixel trails that follow the traveler
  useEffect(() => {
    if (book.promoted) {
      // Create multiple trail elements with different delays
      const trailCount = 20; // Number of trail elements
      const newTrailElements = [];

      for (let i = 0; i < trailCount; i++) {
        // Calculate delays for animation synchronization
        const animationDelay = i * 0.010; // seconds between trails

        newTrailElements.push(
          <div 
            key={`trail-${i}`}
            className="pixel-trail"
            style={{
              animationDelay: `${animationDelay}s`,
              // Each trail element follows the pixel but with delay
              // The animation-delay of the trail elements creates a trailing effect
              animationName: 'trail-fade, border-path',
              animationDuration: '0s, 6s',
              animationTimingFunction: 'linear, linear',
              animationIterationCount: 'infinite, infinite',
              animationDirection: 'normal, normal',
              // This staggers the trail elements along the path
              animationPlayState: 'running, running',
              opacity: Math.sin(i*Math.PI*2/trailCount), // Decreasing opacity for each trail
            }}
          />
        );
      }

      setTrailElements(newTrailElements);
    }
  }, [book.promoted]);

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

  // Handle hover state

  const handleHover = useCallback((hover: boolean) => {
    setIsHovered(hover);
    if (onHover) onHover(hover);
  }, [onHover]);


  return (
    <div className="relative">
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
          {/* Gold pixel with trail - only for promoted books */}
          {book.promoted && (
            <div className="absolute inset-0 z-40 pointer-events-none">
              {/* The traveling pixel */}
              <div className="pixel-traveler" />

              {/* Trail elements */}
              {trailElements}
            </div>
          )}

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
    </div>
  );
}