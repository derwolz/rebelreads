import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { Book, BookImage } from "../types"; // Use the Book type from client/src/types.ts
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useWindowSize } from "@/hooks/use-window-size";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { recordLocalImpression, recordLocalClickThrough } from "@/lib/impressionStorage";

// Helper function to get a random height for book spines
function getRandomHeight() {
  // Return a height between 80% and 100% of the standard height
  return 140 + Math.floor(Math.random() * 30);
}

// Helper function to get a random color for book spines
function getRandomSpineColor() {
  // Generate colors that work well for book spines
  const colors = [
    "bg-primary/90", "bg-primary/70", "bg-primary/60", 
    "bg-primary-foreground", "bg-muted-foreground",
    "bg-amber-800", "bg-amber-700", "bg-amber-600", 
    "bg-zinc-800", "bg-zinc-700", "bg-zinc-600",
    "bg-slate-800", "bg-slate-700", "bg-slate-600",
    "bg-red-900", "bg-red-800", "bg-red-700",
    "bg-green-900", "bg-green-800", "bg-green-700",
    "bg-blue-900", "bg-blue-800", "bg-blue-700",
    "bg-indigo-900", "bg-indigo-800", "bg-indigo-700",
    "bg-purple-900", "bg-purple-800", "bg-purple-700",
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// Function to generate a book spine element
function BookSpine({ 
  book, 
  onClick,
  index
}: { 
  book: Book, 
  onClick: (bookId: number) => void,
  index: number
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);
  const [hasRecordedDetailExpand, setHasRecordedDetailExpand] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Memo-ize these values so they don't change on re-renders
  const height = useMemo(() => getRandomHeight(), []);
  const spineColor = useMemo(() => getRandomSpineColor(), []);
  const spineWidth = useMemo(() => 36 + Math.floor(Math.random() * 20), []);
  
  // Set up intersection observer to track when the spine becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }, // Spine must be 50% visible to count
    );

    const element = document.getElementById(`book-spine-${book.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [book.id]);

  // Record impression when spine becomes visible
  useEffect(() => {
    if (isVisible && !hasRecordedImpression) {
      // Store impression in local storage
      recordLocalImpression(book.id, "book_rack", window.location.pathname);
      setHasRecordedImpression(true);
    }
  }, [isVisible, hasRecordedImpression, book.id]);

  // Handle hover state for "detail-expand" impression type
  useEffect(() => {
    if (isHovering && !hasRecordedDetailExpand) {
      // Start a timer for 300ms (0.3 seconds)
      hoverTimerRef.current = setTimeout(() => {
        // After 0.3 seconds of continuous hovering, record a "detail-expand" impression
        recordLocalImpression(
          book.id,
          "book_rack",
          window.location.pathname,
          "detail-expand",
        );
        setHasRecordedDetailExpand(true);
      }, 300);
    } else if (!isHovering && hoverTimerRef.current) {
      // Clear the timer if user stops hovering before 0.3 seconds
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // Clean up timer when component unmounts
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [isHovering, hasRecordedDetailExpand, book.id]);

  const handleClick = () => {
    // Record click-through in local storage before calling the onClick handler
    recordLocalClickThrough(book.id, "book_rack", window.location.pathname);
    onClick(book.id);
  };

  // Generate text orientation - most books have vertical text, but some have horizontal
  const textOrientation = useMemo(() => {
    return Math.random() > 0.8 ? "horizontal" : "vertical";
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            id={`book-spine-${book.id}`}
            className={cn(
              "mx-0.5 cursor-pointer transition-all duration-300 ease-in-out hover:scale-y-105 hover:-translate-y-1",
              spineColor
            )}
            style={{ 
              height: `${height}px`,
              width: `${spineWidth}px`,
              marginTop: "auto"
            }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className={cn(
              "h-full w-full flex items-center justify-center p-1 bg-gradient-to-r from-black/5 to-white/10",
              textOrientation === "vertical" ? "writing-vertical" : ""
            )}>
              <p className={cn(
                "text-xs font-medium text-white truncate",
                textOrientation === "vertical" ? "vertical-text" : ""
              )}>
                {book.title}
              </p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] p-2 z-50">
          <p className="font-bold">{book.title}</p>
          <p className="text-sm opacity-90">{book.authorName}</p>
          <p className="text-xs mt-1 opacity-75">
            {book.description.length > 100
              ? `${book.description.slice(0, 100)}...`
              : book.description}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// BookRack skeleton for loading state
function BookRackSkeleton() {
  // Generate a set of random spine widths for the skeleton
  const spineWidths = useMemo(() => {
    return Array.from({ length: 20 }, () => 36 + Math.floor(Math.random() * 20));
  }, []);

  return (
    <div className="flex items-end h-48 w-full bg-muted/30 rounded-md">
      {spineWidths.map((width, i) => (
        <Skeleton 
          key={i} 
          className="h-36 mx-0.5" 
          style={{ 
            width: `${width}px`,
            height: `${120 + Math.floor(Math.random() * 30)}px` 
          }} 
        />
      ))}
    </div>
  );
}

interface BookRackProps {
  title: string;
  books?: Book[];
  isLoading: boolean;
  className?: string;
}

export function BookRack({ title, books, isLoading, className }: BookRackProps) {
  const { width: windowWidth } = useWindowSize();
  const [, navigate] = useLocation();

  const handleBookClick = useCallback((bookId: number) => {
    navigate(`/books/${bookId}`);
  }, [navigate]);

  return (
    <section className={cn("my-8", className)}>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      
      <div className="w-full relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/20 pointer-events-none" />

        <ScrollArea className="w-full h-full max-w-full">
          <div className="flex items-end h-48 min-w-full">
            {isLoading ? (
              <BookRackSkeleton />
            ) : (
              <>
                {/* Left bookend */}
                <div className="h-40 w-4 bg-zinc-800 mr-2" />
                
                {books?.map((book, index) => (
                  <BookSpine 
                    key={book.id} 
                    book={book} 
                    onClick={handleBookClick}
                    index={index}
                  />
                ))}
                
                {/* Right bookend */}
                <div className="h-40 w-4 bg-zinc-800 ml-2" />
              </>
            )}
          </div>
        </ScrollArea>
        
        {/* Shelf base */}
        <div className="h-2 w-full bg-zinc-900 mt-0.5" />
        <div className="h-6 w-full bg-zinc-800" />
      </div>
    </section>
  );
}

// Add the CSS needed for vertical text in book spines
// This will be added to the global CSS when this component is imported
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .writing-vertical {
      writing-mode: vertical-rl;
      text-orientation: mixed;
    }
    
    .vertical-text {
      transform: rotate(180deg);
    }
  `;
  document.head.appendChild(style);
}