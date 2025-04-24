import { useState, useMemo, useCallback } from "react";
import type { Book } from "../../types";
import { cn } from "@/lib/utils";
import { BookCard } from "@/components/book-card";
import { SpineCard } from "./spine-card";
import { LEAN_OPTIONS, calculateLeaningGeometry } from "./constants";

// Interface for BookRack component props
export interface BookRackProps {
  title?: string;
  books?: Book[];
  isLoading?: boolean;
  className?: string;
}

// BookRack component - uses the SpineCard component
export function BookRack({ title, books = [], isLoading = false, className }: BookRackProps) {
  // State to track which book is being hovered
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // State to track if the book card is shown (after delay)
  const [showingCard, setShowingCard] = useState<boolean>(false);
  
  // Handle hover events from child SpineCard components
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
    return bookAngles.reduce((total, angle, index) => {
      const { width } = calculateLeaningGeometry(angle);
      // Add a small gap between books
      return total + width + 2;
    }, 0);
  }, [bookAngles]);
  
  // Skeleton placeholder when loading
  if (isLoading) {
    return (
      <section className={cn("mb-12 relative", className)}>
        {title && <h2 className="text-3xl font-bold mb-6">{title}</h2>}
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
        {title && <h2 className="text-3xl font-bold mb-6">{title}</h2>}
        <div className="flex items-center justify-center bg-muted/30 rounded-md p-4 h-[250px]">
          <p className="text-muted-foreground">No books available</p>
        </div>
      </section>
    );
  }
  
  return (
    <section className={cn("mb-12 relative", className)}>
      {title && <h2 className="text-3xl font-bold mb-6">{title}</h2>}
      
      {/* Book shelf */}
      <div className="relative">
        {/* The books container - positioned on the shelf */}
        <div 
          className="flex items-end bg-muted/10 rounded-md h-[400px]"
          style={{ 
            minHeight: showingCard ? '400px' : '250px',
            transition: 'min-height 0.3s ease-in-out'
          }}
        >
          <div className="flex justify-center items-end p-4 mb-4" style={{ width: `${totalShelfWidth}px`, minWidth: '100%' }}>
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
                  <SpineCard 
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
        
        {/* Show book card for the hovered book */}
        {hoveredIndex !== null && showingCard && (
          <div 
            className="absolute bottom-0 transition-all duration-600 ease-in-out"
            style={{
              left: '50%',
              transform: 'translateX(-50%) translateY(30%)',
              marginBottom: '10px',
              zIndex: 50,
              width: '256px', // Match the BookCard's width
            }}
          >
            <BookCard book={books[hoveredIndex]} />
          </div>
        )}
        
        {/* The wooden shelf */}
        <div className="border-t border-foreground bg-gradient-to-b from-foreground to-background w-full h-3"></div>
      </div>
    </section>
  );
}