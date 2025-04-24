import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Book } from "../types";
import { BookCard } from "@/components/book-card";
import { BookSpineA, BookSpineB, LEAN_OPTIONS, calculateLeaningGeometry } from "@/components/book-spine";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Constants for the book rack
const SPINE_WIDTH = 56;
const SPINE_HEIGHT = 256;

// Book rack test page with A/B test configuration
export default function BookSpineTest() {
  // State for the book rack hover interactions
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showingCard, setShowingCard] = useState<boolean>(false);
  
  // Fetch books for testing
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ['/api/genres/view/2'],
  });

  // Generate random angles for the books
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
  }, [books]);
  
  // Calculate total width needed for all the books
  const totalShelfWidth = useMemo(() => {
    if (!books || !bookAngles.length) return 0;
    
    return bookAngles.reduce((total, angle, index) => {
      const { width } = calculateLeaningGeometry(angle);
      // Add a small gap between books
      return total + width + 2;
    }, 0);
  }, [bookAngles, books]);
  
  // Handle hover events for BookSpine components
  const handleBookHover = useCallback((index: number | null, showCard: boolean) => {
    setHoveredIndex(index);
    setShowingCard(showCard);
  }, []);

  if (isLoading || !books) {
    return (
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Book Spine Test</h1>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Book Spine Test</h1>
      <p className="mb-6 text-muted-foreground">
        This page demonstrates the BookRack component with A/B test configuration for spine variants.
      </p>
      
      <Tabs defaultValue="a" className="mb-8">
        <TabsList>
          <TabsTrigger value="a">BookRack with Spine A</TabsTrigger>
          <TabsTrigger value="b">BookRack with Spine B</TabsTrigger>
        </TabsList>
        
        <TabsContent value="a" className="p-4">
          <h2 className="text-2xl font-bold mb-4">BookRack with Spine A</h2>
          <p className="mb-4 text-muted-foreground">
            BookRack with Spine A variant - features colored trim and a featured badge for promoted books.
          </p>
          
          {/* Book Rack A Implementation */}
          <div className="relative mb-12">
            {/* The books container with slide effect */}
            <div 
              className="flex items-end bg-muted/10 rounded-md"
              style={{ 
                minHeight: showingCard ? '400px' : '300px',
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
                  
                  // Handle hover for this specific spine
                  const handleSpineHover = (isHovered: boolean) => {
                    if (isHovered) {
                      // First update without the card
                      handleBookHover(index, false);
                      
                      // Then after a delay, update to show the card
                      setTimeout(() => {
                        if (hoveredIndex === index) { // Only if still hovering this book
                          handleBookHover(index, true);
                        }
                      }, 300);
                    } else {
                      handleBookHover(null, false);
                    }
                  };
                  
                  return (
                    <div
                      key={`spine-a-${book.id}-${index}`}
                      className="transition-transform duration-300 ease-in-out"
                      style={{ 
                        transform: `translateX(${positionShift}px)`,
                      }}
                    >
                      <BookSpineA 
                        book={book} 
                        angle={angle}
                        index={index}
                        onHover={handleSpineHover}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Show book card for the hovered book */}
            {hoveredIndex !== null && showingCard && books[hoveredIndex] && (
              <div 
                className="absolute bottom-0 transition-all duration-600 ease-in-out z-50"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%) translateY(30%)',
                  marginBottom: '10px',
                }}
              >
                <BookCard book={books[hoveredIndex]} />
              </div>
            )}
            
            {/* The wooden shelf */}
            <div className="border-t border-foreground bg-gradient-to-b from-foreground to-background w-full h-3"></div>
          </div>
        </TabsContent>
        
        <TabsContent value="b" className="p-4">
          <h2 className="text-2xl font-bold mb-4">BookRack with Spine B</h2>
          <p className="mb-4 text-muted-foreground">
            BookRack with Spine B variant - features rating indicator and glow effect on hover.
          </p>
          
          {/* Book Rack B Implementation */}
          <div className="relative mb-12">
            {/* The books container with slide effect */}
            <div 
              className="flex items-end bg-muted/10 rounded-md"
              style={{ 
                minHeight: showingCard ? '400px' : '300px',
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
                  
                  // Handle hover for this specific spine
                  const handleSpineHover = (isHovered: boolean) => {
                    if (isHovered) {
                      // First update without the card
                      handleBookHover(index, false);
                      
                      // Then after a delay, update to show the card
                      setTimeout(() => {
                        if (hoveredIndex === index) { // Only if still hovering this book
                          handleBookHover(index, true);
                        }
                      }, 300);
                    } else {
                      handleBookHover(null, false);
                    }
                  };
                  
                  return (
                    <div
                      key={`spine-b-${book.id}-${index}`}
                      className="transition-transform duration-300 ease-in-out"
                      style={{ 
                        transform: `translateX(${positionShift}px)`,
                      }}
                    >
                      <BookSpineB 
                        book={book} 
                        angle={angle}
                        index={index}
                        onHover={handleSpineHover}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Show book card for the hovered book */}
            {hoveredIndex !== null && showingCard && books[hoveredIndex] && (
              <div 
                className="absolute bottom-0 transition-all duration-600 ease-in-out z-50"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%) translateY(30%)',
                  marginBottom: '10px',
                }}
              >
                <BookCard book={books[hoveredIndex]} />
              </div>
            )}
            
            {/* The wooden shelf */}
            <div className="border-t border-foreground bg-gradient-to-b from-foreground to-background w-full h-3"></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}