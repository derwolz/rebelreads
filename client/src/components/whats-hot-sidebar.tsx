import { Book } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { StarRating } from "@/components/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { recordLocalImpression, recordLocalClickThrough } from "@/lib/impressionStorage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

// Extended interface to include popularity data
interface PopularBook extends Book {
  sigmoidValue: string;
  popularRank: number;
  firstRankedAt: string;
  ratingCount?: number;
}

function BookItemSkeleton() {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
      <Skeleton className="w-12 h-16 flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

interface PopularityFilterOptions {
  period: "day" | "week" | "month";
}

function PopularityFilter({ activePeriod, onChange }: { 
  activePeriod: "day" | "week" | "month",
  onChange: (period: "day" | "week" | "month") => void 
}) {
  return (
    <div className="flex text-xs mb-4 space-x-1">
      <Button 
        variant={activePeriod === "day" ? "default" : "outline"} 
        size="sm" 
        className="px-2 py-0.5 h-auto text-xs rounded"
        onClick={() => onChange("day")}
      >
        Day
      </Button>
      <Button 
        variant={activePeriod === "week" ? "default" : "outline"} 
        size="sm" 
        className="px-2 py-0.5 h-auto text-xs rounded"
        onClick={() => onChange("week")}
      >
        Week
      </Button>
      <Button 
        variant={activePeriod === "month" ? "default" : "outline"} 
        size="sm" 
        className="px-2 py-0.5 h-auto text-xs rounded"
        onClick={() => onChange("month")}
      >
        Month
      </Button>
    </div>
  );
}

// Mini book card component with impression and click tracking
function MiniBookCard({ book, rank }: { book: PopularBook, rank: number }) {
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);

  // Set up intersection observer to track when the card becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }, // Card must be 50% visible to count
    );

    const element = document.getElementById(`mini-book-${book.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [book.id]);

  // Record impression when card becomes visible
  useEffect(() => {
    if (isVisible && !hasRecordedImpression) {
      // Use local storage for impression tracking
      recordLocalImpression(
        book.id,
        "mini",
        window.location.pathname
      );
      setHasRecordedImpression(true);
    }
  }, [isVisible, hasRecordedImpression, book.id]);

  const handleClick = () => {
    // Record impression with card-click type (weighted at 0.5)
    recordLocalImpression(
      book.id,
      "mini",
      window.location.pathname,
      "card-click" 
    );
    
    // Also record click-through for traditional tracking
    recordLocalClickThrough(
      book.id,
      "mini",
      window.location.pathname
    );
    
    navigate(`/books/${book.id}`);
  };


  
  return (
    <div 
      id={`mini-book-${book.id}`}
      className="flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors group hover:bg-muted/30 border-b border-border/40 pb-3 last:border-0"
      onClick={handleClick}
    >
      <div className="font-bold text-sm w-5 h-5 bg-muted-foreground/10 rounded-full flex items-center justify-center text-muted-foreground">{rank}</div>
      <img 
        src={book.images?.find(img => img.imageType === "mini")?.imageUrl || "/images/placeholder-book.png"} 
        alt={book.title} 
        className="w-11 h-16 object-cover rounded flex-shrink-0 group-hover:scale-105 transition-transform duration-300" 
      />
      <div className="overflow-hidden pt-0.5">
        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{book.title}</h3>
        <div className="flex items-center gap-1 mt-0.5">
          <p className="text-xs text-muted-foreground line-clamp-1 mr-1">{book.authorName}</p>
         
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-3 ${i < Math.min(Math.ceil(Math.random() * 5), 5) ? 'text-yellow-500' : 'text-muted-foreground/20'}`}
              >
                ★
              </div>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground ml-1">{Math.ceil(Math.random() * 1000)}</span>
        </div>
      </div>
    </div>
  );
}

export function WhatsHotSidebar() {
  const [, navigate] = useLocation();
  const [periodFilter, setPeriodFilter] = useState<"day" | "week" | "month">("day");
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Fetch popular books from our new API endpoint
  const { data: popularBooks, isLoading } = useQuery<PopularBook[]>({
    queryKey: ["/api/popular-books", periodFilter],
    staleTime: 1000 * 60 * 60, // 1 hour - since these are calculated daily
  });

  // Toggle the minimized state
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`fixed z-40 transition-all duration-300 ease-in-out ${
      isMinimized 
        ? 'w-16 right-4 bottom-4' 
        : 'w-[90vw] sm:w-[350px] right-4 bottom-4 max-h-[70vh] overflow-hidden'
    }`}>
      <div className={`bg-muted/10 shadow-lg p-4 rounded-lg border border-border/20 backdrop-blur-sm ${
        isMinimized ? 'bg-primary/10' : 'bg-background/95'
      }`}>
        {/* Header with minimize button */}
        <div className="flex items-center justify-between mb-2">
          {!isMinimized && (
            <>
              <h2 className="text-lg font-medium">What's Hot</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 h-8 w-8 p-0" 
                onClick={toggleMinimize}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}
          {isMinimized && (
            <Button
              variant="ghost"
              className="w-full flex items-center justify-center"
              onClick={toggleMinimize}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="ml-1 sr-only">Expand</span>
            </Button>
          )}
        </div>
        
        {/* Content - shown only when not minimized */}
        {!isMinimized && (
          <>
            <PopularityFilter 
              activePeriod={periodFilter} 
              onChange={setPeriodFilter} 
            />
            
            <div className="space-y-1 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <BookItemSkeleton key={i} />
                ))
              ) : popularBooks?.length ? (
                popularBooks.slice(0, 5).map((book, index) => (
                  <MiniBookCard 
                    key={book.id} 
                    book={book} 
                    rank={index + 1} 
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No popular books available</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}