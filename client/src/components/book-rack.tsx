import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { Book, BookImage } from "../types"; // Use the Book type from client/src/types.ts
import { cn } from "@/lib/utils";
import { BookCard } from "@/components/book-card";
import { useLocation } from "wouter";

// Possible lean angles in degrees
const LEAN_OPTIONS = [
  { angle: 0, probability: 0.88 },    // Straight - 92% chance
  { angle: -5, probability: 0.04 },   // Slight lean left - 2% chance
  { angle: -10, probability: 0.04 },  // Moderate lean left - 2% chance
  { angle: 5, probability: 0.04 },    // Slight lean right - 2% chance
  { angle: 10, probability: 0.04 },   // Moderate lean right - 2% chance
];

// Original dimensions of the book spine images
const SPINE_WIDTH = 56;
const SPINE_HEIGHT = 256;

// Interface for BookRack component props
interface BookRackProps {
  title: string;
  books?: Book[];
  isLoading: boolean;
  className?: string;
}

interface BookSpineProps {
  book: Book;
  angle: number;
  index: number;
}

// Calculate the geometric properties for a leaning book
function calculateLeaningGeometry(angle: number) {
  if (angle === 0) {
    return {
      width: SPINE_WIDTH,
      offset: 0,
    };
  }
  
  // Convert angle to radians for trigonometry calculations
  const radians = Math.abs(angle) * (Math.PI / 180);
  
  // Calculate additional width needed when book is leaning
  // sin(angle) * height gives the additional horizontal space needed
  const additionalWidth = Math.sin(radians) * SPINE_HEIGHT;
  const totalWidth = Math.ceil(SPINE_WIDTH + additionalWidth);
  
  // Calculate the offset needed to center the book
  // If leaning left (negative angle), we need positive offset (to the right)
  // If leaning right (positive angle), we need negative offset (to the left)
  const offset = angle < 0 
    ? additionalWidth / 2  // Move right for left lean
    : -additionalWidth / 2; // Move left for right lean
  
  return {
    width: totalWidth,
    offset,
  };
}

// Component to display a single book spine with appropriate rotation
function BookSpine({ book, angle, index, hoveredIndex, onHover }: BookSpineProps) {
  // Calculate geometric properties for this book spine
  const { width, offset } = useMemo(() => {
    return calculateLeaningGeometry(angle);
  }, [angle]);
  const [trailElements, setTrailElements] = useState<React.ReactNode[]>([]);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  
  // Get the book images
  const spineImageUrl = book.images?.find(img => img.imageType === "spine")?.imageUrl || "/images/placeholder-book.png";
  
  // Determine if this book is being hovered
  const isHovered = hoveredIndex === index;
  
  // Reference to the timeout for delayed actions
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate pixel trails that follow the traveler
  useEffect(() => {
    if (book.promoted) {
      // Create multiple trail elements with different delays
      const trailCount = 40; // Number of trail elements
      const newTrailElements = [];

      for (let i = 0; i < trailCount; i++) {
        // Calculate delays for animation synchronization
        const animationDelay = i * 0.006; // seconds between trails

        newTrailElements.push(
          <div 
            key={`trail-${i}`}
            className="pixel-trail"
            style={{
              animationDelay: `${animationDelay}s`,
              // Each trail element follows the pixel but with delay
              // The animation-delay of the trail elements creates a trailing effect
              animationName: 'trail-fade, border-path',
              animationDuration: '0s, 5s',
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
  
  // Handle mouse enter - notify parent and set timer for card display
  const handleMouseEnter = useCallback(() => {
    // Check if we've recently completed a drag operation
    const lastDragTimeStr = localStorage.getItem('lastDragTime');
    const currentTime = Date.now();
    const dragCooldownPeriod = 500; // ms
    
    if (lastDragTimeStr) {
      const lastDragTime = parseInt(lastDragTimeStr, 10);
      
      // If we're still within the cooldown period after dragging, don't activate hover
      if (currentTime - lastDragTime < dragCooldownPeriod) {
        return;
      }
    }
    
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
  
  // Handle mouse leave - clear hover state only if context menu isn't open
  const handleMouseLeave = useCallback(() => {
    if (isContextMenuOpen) {
      // Don't clear hover if context menu is open
      return;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    onHover(null, false);
  }, [onHover, isContextMenuOpen]);
  
  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Handle context menu events
  const handleContextMenuOpen = useCallback(() => {
    setIsContextMenuOpen(true);
    // Ensure the book card is visible when context menu opens
    onHover(index, true);
  }, [index, onHover]);
  
  const handleContextMenuClose = useCallback(() => {
    setIsContextMenuOpen(false);
    // Optional: could delay this to prevent flickering if user reopens menu quickly
    setTimeout(() => {
      if (!isHovered) {
        onHover(null, false);
      }
    }, 300);
  }, [isHovered, onHover]);
  
  // Check if we should show the book card
  const showBookCard = (isHovered && hoveredIndex !== null) || isContextMenuOpen;
  
  return (
    <div 
      className="relative group inline-block"
      style={{ 
        width: `${width}px`,
        height: `${SPINE_HEIGHT}px`,
       
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Book Spine */}
      <div 
        className="absolute w-[56px] h-full transition-all duration-300 ease-in-out border border-muted/40"
        style={{ 
          transform: `translateX(${offset}px) rotate(${angle}deg) ${isHovered ? 'scale(1.05)' : ''}`,
          transformOrigin: angle < 0 ? 'bottom left' : angle > 0 ? 'bottom right' : 'center',
          left: `${(width - SPINE_WIDTH) / 2}px`, // Center the book in its container
         
        }}
      >
        {/* Gold pixel with trail - only for promoted books */}
        {book.promoted && (
          <div className="absolute inset-0 z-10 pointer-events-none">
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
      
      {/* Book Card (shown on hover after delay) - using the existing BookCard component */}
      {showBookCard && (
        <div 
          className="absolute bottom-0 animate-fade-in-from-left ease-in-out"
          style={{
            transform: 'translateX(-50%) translateY(50%) ',
            zIndex: 20, // Lower than WhatsHot sidebar but higher than regular books
            width: '256px', // Match the BookCard's width
          }}
          // Add event listener for context menu to keep the card visible
          onContextMenu={() => handleContextMenuOpen()}
        >
          <div 
            onContextMenuCapture={() => handleContextMenuOpen()}
            className="custom-context-menu-wrapper"
          >
            <BookCard 
              book={book} 
              onContextMenuOpen={handleContextMenuOpen}
              onContextMenuClose={handleContextMenuClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Update BookSpineProps to include the hover state management
interface BookSpineProps {
  book: Book;
  angle: number;
  index: number;
  hoveredIndex: number | null;
  onHover: (index: number | null, showCard: boolean) => void;
}

// Main BookRack component
export function BookRack({ title, books = [], isLoading, className }: BookRackProps) {
  // State to track which book is being hovered
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // State to track if the book card is shown (after delay)
  const [showingCard, setShowingCard] = useState<boolean>(false);
  
  // State for the drag carousel effect
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Reference to the scrollable container
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle hover events from child BookSpine components
  const handleBookHover = useCallback((index: number | null, showCard: boolean) => {
    if (!isDragging) { // Only handle hover if not dragging
      setHoveredIndex(index);
      setShowingCard(showCard);
    }
  }, [isDragging]);
  
  // Create a stable book ID string for dependencies
  const bookIdsString = useMemo(() => {
    return books.map(book => book.id).join('-');
  }, [books]);
  
  // Generate random angles once when books change
  const bookAngles = useMemo(() => {
    if (!books || books.length === 0) return [];
    
    const angles: number[] = [];
    
    // Generate a random angle for each book based on probabilities
    for (let i = 0; i < books.length; i++) {
      // Start with a random angle based on the probability distribution
      let randomValue = Math.random();
      let cumulativeProbability = 0;
      let selectedAngle = 0;
      
      for (const option of LEAN_OPTIONS) {
        cumulativeProbability += option.probability;
        if (randomValue <= cumulativeProbability) {
          selectedAngle = option.angle;
          break;
        }
      }
      
      // Check if neighbors are already leaning
      const prevAngle = i > 0 ? angles[i - 1] : null;
      
      // If this book would lean and the previous book is leaning, make it straight
      if (selectedAngle !== 0 && prevAngle !== null && prevAngle !== 0) {
        selectedAngle = 0;
      }
      
      // Store the final selected angle
      angles.push(selectedAngle);
      
      // Check forward to ensure the next book will be straight if this one leans
      if (selectedAngle !== 0 && i + 1 < books.length) {
        // Pre-assign the next book to be straight
        angles.push(0);
        i++; // Skip the next book since we've already assigned it
      }
    }
    
    return angles;
  }, [bookIdsString]);
  
  // Calculate total width needed for all the books
  const totalShelfWidth = useMemo(() => {
    return bookAngles.reduce((total, angle) => {
      const { width } = calculateLeaningGeometry(angle);
      // Add a small gap between books
      return total + width + 2;
    }, 0);
  }, [bookAngles]);
  
  // Track if we've moved during dragging (to distinguish between a click and a drag)
  const [hasMoved, setHasMoved] = useState(false);
  
  // Mouse and touch event handlers for drag-scrolling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setHasMoved(false); // Reset the movement tracker
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  }, []);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length === 0) return;
    setIsDragging(true);
    setHasMoved(false); // Reset the movement tracker
    setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const distance = x - startX;
    
    // Only consider it a move if we've moved more than a few pixels
    if (Math.abs(distance) > 5) {
      setHasMoved(true);
    }
    
    containerRef.current.scrollLeft = scrollLeft - distance;
  }, [isDragging, startX, scrollLeft]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current || e.touches.length === 0) return;
    const x = e.touches[0].pageX - containerRef.current.offsetLeft;
    const distance = x - startX;
    
    // Only consider it a move if we've moved more than a few pixels
    if (Math.abs(distance) > 5) {
      setHasMoved(true);
    }
    
    containerRef.current.scrollLeft = scrollLeft - distance;
  }, [isDragging, startX, scrollLeft]);
  
  const handleMouseUp = useCallback(() => {
    // If we dragged (not just clicked), prevent book hovering on mouse up
    if (hasMoved) {
      // Clear any current hover state
      setHoveredIndex(null);
      setShowingCard(false);
      
      // Disable hover events briefly to prevent accidental activations
      const disableHoverTime = 500; // ms
      const currentTime = Date.now();
      
      // Store the time of the last drag
      localStorage.setItem('lastDragTime', currentTime.toString());
    }
    
    setIsDragging(false);
  }, [hasMoved, hoveredIndex]);
  
  const handleTouchEnd = useCallback(() => {
    // If we swiped (not just tapped), prevent book hovering
    if (hasMoved) {
      setHoveredIndex(null);
      setShowingCard(false);
    }
    
    setIsDragging(false);
  }, [hasMoved]);
  
  // Add event listeners to window for mouseup and touchend
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseUp, handleTouchEnd]);
  
  // Skeleton placeholder when loading
  if (isLoading) {
    return (
      <section className={cn("mb-12 relative", className)}>
        <h2 className="text-3xl font-bold mb-6">{title}</h2>
        <div className="flex gap-1 bg-muted/30 rounded-md p-4 h-[250px] w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-muted h-[212px] w-[56px] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }
  
  // No books available
  if (!books || books.length === 0) {
    return (
      <section className={cn("mb-12 relative", className)}>
        <h2 className="text-3xl font-bold mb-6">{title}</h2>
        <div className="flex items-center justify-center bg-muted/30 rounded-md p-4 h-[250px]">
          <p className="text-muted-foreground">No books available</p>
        </div>
      </section>
    );
  }
  
  return (
    <section className={cn("mb-12 relative w-full", className)}>
      <h2 className="text-3xl font-bold mb-6">{title}</h2>
      
      {/* Book shelf */}
      <div className="relative w-full">
        {/* The books container - positioned on the shelf */}
        <div 
          className={`flex items-end bg-muted/10 rounded-md h-[266px]  scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{ 
            overscrollBehavior: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div 
            className="flex items-center" 
            style={{ 
              width: `${totalShelfWidth}px`, 
              minWidth: totalShelfWidth > windowWidth ? `${totalShelfWidth}px` : '100%',
              pointerEvents: isDragging ? 'none' : 'auto' // Disable pointer events during drag
            }}
          >
            {books.map((book, index) => {
              // Get this book's angle
              const angle = bookAngles[index] || 0;
              
              // Calculate the position shift based on hovered index
              let positionShift = 0;
              
              if (hoveredIndex !== null && showingCard && !isDragging) {
                // When a book is hovered and the card is shown (and not dragging):
                // Books to the left of the hovered book shift left
                if (index < hoveredIndex) {
                  positionShift = -150; // shift left by 150px
                }
                // Books to the right of the hovered book shift right
                else if (index > hoveredIndex) {
                  positionShift = 150; // shift right by 150px
                }
              }
              
              // Use a unique key combining book ID and index
              const key = `${book.id}-${index}`;
              
              return (
                <div
                  key={key}
                  className={`transition-transform duration-300 ease-in-out`}
                  style={{ 
                    transform: `translateX(${positionShift}px)`,
                    zIndex: (hoveredIndex !== null && showingCard) ? 0 : 1
                  }}
                >
                  <BookSpine 
                    book={book} 
                    angle={angle}
                    index={index}
                    hoveredIndex={hoveredIndex}
                    onHover={handleBookHover}
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        {/* The shelf */}
        <div className="border-t border-foreground/30 bg-gradient-to-b from-foreground/20 to-background w-full h-2"></div>
        
        {/* Visual indicator for scrollable content */}
        {totalShelfWidth > windowWidth && (
          <div className="flex justify-center mt-2">
            <div className="text-xs text-muted-foreground">
              <span>← Drag to see more books →</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}