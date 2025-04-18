import { useState, useEffect, useMemo } from "react";
import { Book } from "@shared/schema";
import { cn } from "@/lib/utils";

// Possible lean angles in degrees
const LEAN_OPTIONS = [
  { angle: 0, probability: 0.92 },    // Straight - 92% chance
  { angle: -5, probability: 0.02 },   // Slight lean left - 2% chance
  { angle: -10, probability: 0.02 },  // Moderate lean left - 2% chance
  { angle: 5, probability: 0.02 },    // Slight lean right - 2% chance
  { angle: 10, probability: 0.02 },   // Moderate lean right - 2% chance
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

// A utility function to calculate increased width needed for leaning books
function calculateLeaningWidth(angle: number): number {
  if (angle === 0) return SPINE_WIDTH;
  
  // Using trigonometry to calculate width when tilted
  // sin(angle) * height gives the additional horizontal space needed
  const radians = Math.abs(angle) * (Math.PI / 180);
  const additionalWidth = Math.sin(radians) * SPINE_HEIGHT;
  
  return Math.ceil(SPINE_WIDTH + additionalWidth);
}

// Component to display a single book spine with appropriate rotation
function BookSpine({ book, angle, index }: BookSpineProps) {
  // Calculate the actual width needed for this book spine when leaning
  const calculatedWidth = calculateLeaningWidth(angle);
  
  // Get the grid-item image for the book spine
  const spineImageUrl = book.images?.find(img => img.imageType === "grid-item")?.imageUrl || "/images/placeholder-book.png";
  
  return (
    <div 
      className="relative inline-block"
      style={{ 
        width: `${calculatedWidth}px`,
        height: `${SPINE_HEIGHT}px`,
        // Adjust margins as needed for leaning effect
        marginLeft: angle < 0 ? `${Math.abs(angle) * 2}px` : '0px',
        marginRight: angle > 0 ? `${Math.abs(angle) * 2}px` : '0px',
      }}
    >
      <div 
        className="w-[56px] h-full transition-transform duration-300 ease-in-out"
        style={{ 
          transform: `rotate(${angle}deg)`,
          transformOrigin: angle < 0 ? 'bottom left' : angle > 0 ? 'bottom right' : 'center',
        }}
      >
        <img 
          src={spineImageUrl} 
          alt={book.title}
          className="w-full h-full object-cover"
          style={{ maxWidth: `${SPINE_WIDTH}px` }}
        />
      </div>
    </div>
  );
}

// Main BookRack component
export function BookRack({ title, books = [], isLoading, className }: BookRackProps) {
  // Create a stable book ID string for dependencies
  const bookIdsString = useMemo(() => {
    return books.map(book => book.id).join('-');
  }, [books]);
  
  // Use memo to generate random angles once when books change
  // This prevents the infinite loop we were seeing
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
  
  // Calculate total width needed for all the books - must be called on every render
  const totalShelfWidth = useMemo(() => {
    return bookAngles.reduce((total, angle, index) => {
      const calculatedWidth = calculateLeaningWidth(angle);
      // Add some margin between books
      return total + calculatedWidth + 2;
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
      
      {/* Book shelf (brown wooden texture) */}
      <div className="relative">
        {/* The books container - positioned on the shelf */}
        <div 
          className="flex items-end bg-muted/10 rounded-md p-4 h-[250px] overflow-x-auto"
          style={{ minWidth: `${Math.min(totalShelfWidth, window.innerWidth * 0.9)}px` }}
        >
          {books.map((book, index) => {
            // Get this book's angle
            const angle = bookAngles[index] || 0;
            
            // Use a unique key combining book ID and index
            const key = `${book.id}-${index}`;
            
            return (
              <BookSpine 
                key={key}
                book={book} 
                angle={angle}
                index={index}
              />
            );
          })}
        </div>
        
        {/* The wooden shelf */}
        <div className="h-3 w-full bg-amber-800"></div>
      </div>
    </section>
  );
}