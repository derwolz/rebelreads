import { useMemo } from "react";
import type { Book } from "../types";
import { cn } from "@/lib/utils";

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

// Interface for BookRackShelf component props
interface BookRackShelfProps {
  books?: Book[];
  isLoading: boolean;
  onSelectBook?: (book: Book, index: number) => void;
  selectedBookIndex?: number | null;
  className?: string;
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
function BookSpine({ 
  book, 
  angle, 
  index, 
  isSelected, 
  onSelect 
}: { 
  book: Book; 
  angle: number; 
  index: number; 
  isSelected: boolean;
  onSelect: (book: Book, index: number) => void;
}) {
  // Calculate geometric properties for this book spine
  const { width, offset } = useMemo(() => {
    return calculateLeaningGeometry(angle);
  }, [angle]);
  
  // Get the book images
  const spineImageUrl = book.images?.find(img => img.imageType === "grid-item")?.imageUrl || "/images/placeholder-book.png";
  
  return (
    <div 
      className="relative group inline-block cursor-pointer"
      style={{ 
        width: `${width}px`,
        height: `${SPINE_HEIGHT}px`,
        zIndex: isSelected ? 20 : 1,
      }}
      onClick={() => onSelect(book, index)}
    >
      {/* Book Spine */}
      <div 
        className={cn(
          "absolute w-[56px] h-full transition-all duration-300 ease-in-out",
          isSelected && "shadow-lg"
        )}
        style={{ 
          transform: `translateX(${offset}px) rotate(${angle}deg) ${isSelected ? 'scale(1.05)' : ''}`,
          transformOrigin: angle < 0 ? 'bottom left' : angle > 0 ? 'bottom right' : 'center',
          left: `${(width - SPINE_WIDTH) / 2}px`, // Center the book in its container
          boxShadow: isSelected ? '0 0 10px rgba(0, 0, 0, 0.3)' : 'none',
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

// Main BookRackShelf component
export function BookRackShelf({ books = [], isLoading, onSelectBook, selectedBookIndex = null, className }: BookRackShelfProps) {
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
  
  const handleSelectBook = (book: Book, index: number) => {
    if (onSelectBook) {
      onSelectBook(book, index);
    }
  };
  
  // Skeleton placeholder when loading
  if (isLoading) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex gap-1 bg-muted/30 rounded-md p-4 h-[250px] w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-muted h-[212px] w-[56px] animate-pulse" />
          ))}
        </div>
        <div className="border-t border-foreground bg-gradient-to-b from-foreground to-background w-full h-3"></div>
      </div>
    );
  }
  
  // No books available
  if (!books || books.length === 0) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex items-center justify-center bg-muted/30 rounded-md p-4 h-[250px]">
          <p className="text-muted-foreground">No books available</p>
        </div>
        <div className="border-t border-foreground bg-gradient-to-b from-foreground to-background w-full h-3"></div>
      </div>
    );
  }
  
  return (
    <div className={cn("relative", className)}>
      {/* Book shelf */}
      <div className="relative">
        {/* The books container - positioned on the shelf */}
        <div 
          className="flex items-end bg-muted/10 rounded-md h-[250px]"
        >
          <div className="flex justify-center items-center" style={{ width: `${totalShelfWidth}px`, minWidth: '100%' }}>
            {books.map((book, index) => {
              // Get this book's angle
              const angle = bookAngles[index] || 0;
              
              // Use a unique key combining book ID and index
              const key = `${book.id}-${index}`;
              
              return (
                <div
                  key={key}
                  className="transition-transform duration-300 ease-in-out"
                >
                  <BookSpine 
                    book={book} 
                    angle={angle}
                    index={index}
                    isSelected={selectedBookIndex === index}
                    onSelect={handleSelectBook}
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        {/* The wooden shelf */}
        <div className="border-t border-foreground bg-gradient-to-b from-foreground to-background w-full h-3"></div>
      </div>
    </div>
  );
}