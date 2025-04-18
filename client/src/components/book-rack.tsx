import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Book } from "@shared/schema";
import { cn } from "@/lib/utils";
import { BookCard } from "@/components/book-card";

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
const SPINE_HEIGHT = 212;

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
  
  // Get the book images
  const spineImageUrl = book.images?.find(img => img.imageType === "grid-item")?.imageUrl || "/images/placeholder-book.png";
  
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
      className="relative inline-block"
      style={{ 
        width: `${width}px`,
        height: `${SPINE_HEIGHT}px`,
        zIndex: showBookCard ? 10 : 1,
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
      </div>
      
      {/* Book Card (shown on hover after delay) - using the existing BookCard component */}
      {showBookCard && (
        <div 
          className="absolute bottom-0 transition-all duration-300 ease-in-out"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '10px',
            zIndex: 5,
            width: '256px', // Match the BookCard's width
          }}
        >
          <BookCard book={book} />
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
  
  // Handle hover events from child BookSpine components
  const handleBookHover = useCallback((index: number | null, showCard: boolean) => {
    setHoveredIndex(index);
    setShowingCard(showCard);
  }, []);
  
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
    <section className={cn("mb-12 relative", className)}>
      <h2 className="text-3xl font-bold mb-6">{title}</h2>
      
      {/* Book shelf */}
      <div className="relative">
        {/* The books container - positioned on the shelf */}
        <div 
          className="flex items-end bg-muted/10 rounded-md p-4 h-[400px] overflow-x-auto"
          style={{ 
            minHeight: showingCard ? '400px' : '250px',
            transition: 'min-height 0.3s ease-in-out'
          }}
        >
          <div className="flex" style={{ width: `${totalShelfWidth}px`, minWidth: '100%' }}>
            {books.map((book, index) => {
              // Get this book's angle
              const angle = bookAngles[index] || 0;
              
              // Calculate the position shift based on hovered index
              let positionShift = 0;
              
              if (hoveredIndex !== null && showingCard) {
                // When a book is hovered and the card is shown:
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
                  className="transition-transform duration-300 ease-in-out"
                  style={{ 
                    transform: `translateX(${positionShift}px)`,
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
        
        {/* The wooden shelf */}
        <div className="h-3 w-full bg-amber-800"></div>
      </div>
    </section>
  );
}