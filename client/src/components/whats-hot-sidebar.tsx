import { Book, Rating, RatingPreferences, calculateWeightedRating, DEFAULT_RATING_WEIGHTS } from "@shared/schema";
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

  // Fetch ratings for this specific book
  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${book.id}/ratings`],
  });

  // Fetch user's rating preferences
  const { data: ratingPreferences } = useQuery<RatingPreferences>({
    queryKey: ["/api/rating-preferences"],
  });

  // Simple direct calculation of average rating
  const calculateSimpleAverageRating = () => {
    if (!ratings || ratings.length === 0) {
      return 0;
    }
    
    // First compute total and count across all dimensions
    let totalSum = 0;
    let totalCount = 0;
    
    // For each rating, add up all dimensions
    for (const rating of ratings) {
      // Sum all non-null rating values
      if (rating.enjoyment) {
        totalSum += rating.enjoyment;
        totalCount++;
      }
      if (rating.writing) {
        totalSum += rating.writing;
        totalCount++;
      }
      if (rating.themes) {
        totalSum += rating.themes;
        totalCount++;
      }
      if (rating.characters) {
        totalSum += rating.characters;
        totalCount++;
      }
      if (rating.worldbuilding) {
        totalSum += rating.worldbuilding;
        totalCount++;
      }
    }
    
    // Calculate simple average
    return totalCount > 0 ? totalSum / totalCount : 0;
  };
  
  // Get simple average rating (fallback mechanism)
  const simpleAverage = calculateSimpleAverageRating();

  // Weighted calculation with fallback to simple average
  const calculateWeightedAverage = () => {
    if (!ratings || ratings.length === 0 || !ratingPreferences) {
      return simpleAverage;
    }
    
    // Calculate individual dimension averages
    const dimensionAverages = {
      enjoyment: 0,
      writing: 0,
      themes: 0,
      characters: 0,
      worldbuilding: 0
    };
    
    const dimensionCounts = {
      enjoyment: 0,
      writing: 0,
      themes: 0,
      characters: 0,
      worldbuilding: 0
    };
    
    // Get sum for each dimension
    for (const rating of ratings) {
      if (rating.enjoyment) {
        dimensionAverages.enjoyment += rating.enjoyment;
        dimensionCounts.enjoyment++;
      }
      if (rating.writing) {
        dimensionAverages.writing += rating.writing;
        dimensionCounts.writing++;
      }
      if (rating.themes) {
        dimensionAverages.themes += rating.themes;
        dimensionCounts.themes++;
      }
      if (rating.characters) {
        dimensionAverages.characters += rating.characters;
        dimensionCounts.characters++;
      }
      if (rating.worldbuilding) {
        dimensionAverages.worldbuilding += rating.worldbuilding;
        dimensionCounts.worldbuilding++;
      }
    }
    
    // Calculate averages
    dimensionAverages.enjoyment = dimensionCounts.enjoyment > 0 ? 
      dimensionAverages.enjoyment / dimensionCounts.enjoyment : 0;
    dimensionAverages.writing = dimensionCounts.writing > 0 ? 
      dimensionAverages.writing / dimensionCounts.writing : 0;
    dimensionAverages.themes = dimensionCounts.themes > 0 ? 
      dimensionAverages.themes / dimensionCounts.themes : 0;
    dimensionAverages.characters = dimensionCounts.characters > 0 ? 
      dimensionAverages.characters / dimensionCounts.characters : 0;
    dimensionAverages.worldbuilding = dimensionCounts.worldbuilding > 0 ? 
      dimensionAverages.worldbuilding / dimensionCounts.worldbuilding : 0;
    
    // Apply weights from preferences
    let weightedSum = 0;
    let totalWeight = 0;
    
    if (ratingPreferences.enjoyment && dimensionCounts.enjoyment > 0) {
      weightedSum += dimensionAverages.enjoyment * parseFloat(ratingPreferences.enjoyment);
      totalWeight += parseFloat(ratingPreferences.enjoyment);
    }
    if (ratingPreferences.writing && dimensionCounts.writing > 0) {
      weightedSum += dimensionAverages.writing * parseFloat(ratingPreferences.writing);
      totalWeight += parseFloat(ratingPreferences.writing);
    }
    if (ratingPreferences.themes && dimensionCounts.themes > 0) {
      weightedSum += dimensionAverages.themes * parseFloat(ratingPreferences.themes);
      totalWeight += parseFloat(ratingPreferences.themes);
    }
    if (ratingPreferences.characters && dimensionCounts.characters > 0) {
      weightedSum += dimensionAverages.characters * parseFloat(ratingPreferences.characters);
      totalWeight += parseFloat(ratingPreferences.characters);
    }
    if (ratingPreferences.worldbuilding && dimensionCounts.worldbuilding > 0) {
      weightedSum += dimensionAverages.worldbuilding * parseFloat(ratingPreferences.worldbuilding);
      totalWeight += parseFloat(ratingPreferences.worldbuilding);
    }
    
    // Return weighted average or simple average if no weights applied
    return totalWeight > 0 ? weightedSum / totalWeight : simpleAverage;
  };
  
  // Final average rating calculation
  const averageRating = calculateWeightedAverage();

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
    
    // Use secure anti-scraping URL format instead of the traditional ID-based URL
    if (book.authorName) {
      navigate(`/book-details?authorName=${encodeURIComponent(book.authorName)}&bookTitle=${encodeURIComponent(book.title)}`);
    } else {
      // Fall back to traditional format if author name is missing
      navigate(`/books/${book.id}`);
    }
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
        <div className="flex items-center text-accent gap-1 mt-1">
          {/* Direct inline implementation of stars for maximum control */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((starNum) => (
              <Star
                key={starNum}
                className="w-3.5 h-3.5 text-gray-400"
                style={{ 
                  fill: starNum <= Math.round(averageRating) ? '#8b5cf6' : 'none',
                  color: starNum <= Math.round(averageRating) ? '#8b5cf6' : '#9ca3af' 
                }}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground ml-1">
            {ratings?.length ? `(${averageRating.toFixed(1)})` : "No ratings"}
          </span>
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