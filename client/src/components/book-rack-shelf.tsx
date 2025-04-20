import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Book } from "../types";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen } from "lucide-react";

// Possible lean angles in degrees (copied from book-rack.tsx)
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

// Calculate the geometric properties for a leaning book (copied from book-rack.tsx)
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

interface BookRackShelfProps {
  books: Book[];
  isLoading?: boolean;
  selectedBookIndex?: number | null;
  onSelectBook?: (book: Book, index: number) => void;
  className?: string;
}

export function BookRackShelf({
  books,
  isLoading = false,
  selectedBookIndex = null,
  onSelectBook,
  className,
}: BookRackShelfProps) {
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const bookRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Set up books when props change
  useEffect(() => {
    setDisplayedBooks(books);
    // Reset book refs array with correct length
    bookRefs.current = books.map((_, i) => bookRefs.current[i] || null);
  }, [books]);

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

  // Book spine component
  const BookSpine = ({ book, index, angle }: { book: Book; index: number; angle: number }) => {
    // Get the appropriate book spine image
    const spineImageUrl = book.images?.find(img => img.imageType === "grid-item")?.imageUrl 
      || "/images/placeholder-book.png";

    // Calculate geometric properties for this book spine
    const { width, offset } = useMemo(() => {
      return calculateLeaningGeometry(angle);
    }, [angle]);

    // Determine if this book is being hovered
    const isHovered = hoveredIndex === index;

    const handleMouseEnter = useCallback(() => {
      setHoveredIndex(index);
    }, [index]);

    const handleMouseLeave = useCallback(() => {
      setHoveredIndex(null);
    }, []);

    return (
      <div
        ref={(el) => (bookRefs.current[index] = el)}
        className="relative cursor-pointer"
        style={{
          width: `${width}px`,
          height: `${SPINE_HEIGHT}px`,
          zIndex: isHovered ? 10 : 1,
        }}
        onClick={() => onSelectBook && onSelectBook(book, index)}
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
            opacity: hoveredIndex !== null && !isHovered ? 0.95 : 1, // Dim other books by 5% when one is hovered
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
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-52 w-full">
      <BookOpen className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
      <p className="text-muted-foreground text-sm">No books on this shelf yet</p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex space-x-4 overflow-hidden py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-52 w-14 rounded" />
      ))}
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      {isLoading ? (
        <LoadingState />
      ) : displayedBooks.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollArea className="w-full" type="scroll">
          <div className="flex space-x-1 pt-4 pb-8 justify-center items-center">
            <AnimatePresence>
              {displayedBooks.map((book, index) => {
                // Get this book's angle
                const angle = bookAngles[index] || 0;
                
                return (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <BookSpine book={book} index={index} angle={angle} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}