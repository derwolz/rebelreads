import {
  Book,
  Rating,
  calculateWeightedRating,
  DEFAULT_RATING_WEIGHTS,
  RatingPreferences,
} from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import { WishlistButton } from "./wishlist-button";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { recordLocalImpression, recordLocalClickThrough } from "@/lib/impressionStorage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Position-based weights for rating criteria
const POSITION_WEIGHTS = [0.35, 0.25, 0.2, 0.12, 0.08];

// Helper function to get weight percentage for a criteria based on stored weights
function getWeightPercentage(
  criteriaName: string,
  prefs?: RatingPreferences,
): string {
  if (!prefs) {
    // Use default weights if no user preferences
    return `${(DEFAULT_RATING_WEIGHTS[criteriaName as keyof typeof DEFAULT_RATING_WEIGHTS] * 100).toFixed(0)}%`;
  }

  // If we have individual weights columns, use those directly
  if (prefs[criteriaName as keyof RatingPreferences] !== undefined) {
    // Convert any string values to numbers for percentage calculation
    const value = prefs[criteriaName as keyof RatingPreferences];
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    return `${(Number(numericValue) * 100).toFixed(0)}%`;
  }

  // Fall back to default weights if we don't have the specific property
  return `${(DEFAULT_RATING_WEIGHTS[criteriaName as keyof typeof DEFAULT_RATING_WEIGHTS] * 100).toFixed(0)}%`;
}

// Helper function to check if a book is new (published within last 7 days)
function isNewBook(book: Book) {
  if (!book.publishedDate) return false;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return new Date(book.publishedDate) > oneWeekAgo;
}

export function BookGridCard({ book }: { book: Book }) {
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);
  const [hasRecordedDetailExpand, setHasRecordedDetailExpand] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${book.id}/ratings`],
  });

  // Fetch user's rating preferences
  const { data: ratingPreferences } = useQuery<RatingPreferences>({
    queryKey: ["/api/rating-preferences"],
  });

  // Set up intersection observer to track when the card becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }, // Card must be 50% visible to count
    );

    const element = document.getElementById(`book-grid-card-${book.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [book.id]);

  // Record impression when card becomes visible
  useEffect(() => {
    if (isVisible && !hasRecordedImpression) {
      // Store impression in local storage instead of sending API request immediately
      recordLocalImpression(
        book.id,
        "grid",
        window.location.pathname
      );
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
          "grid",
          window.location.pathname,
          "detail-expand"
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

  // Calculate individual unweighted ratings per vector
  const unweightedRatings = ratings?.length
    ? {
        enjoyment:
          ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length,
        writing:
          ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
        themes: ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
        characters:
          ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length,
        worldbuilding:
          ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length,
      }
    : null;

  // Calculate overall weighted rating using user preferences and the unweighted individual ratings
  const averageRatings = unweightedRatings
    ? {
        ...unweightedRatings,
        overall: calculateWeightedRating(
          {
            enjoyment: unweightedRatings.enjoyment,
            writing: unweightedRatings.writing,
            themes: unweightedRatings.themes,
            characters: unweightedRatings.characters,
            worldbuilding: unweightedRatings.worldbuilding,
          } as Rating,
          ratingPreferences,
        ),
      }
    : null;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    // Record click-through in local storage before navigation
    // This will also trigger an immediate sync with the server
    recordLocalClickThrough(
      book.id,
      "grid",
      window.location.pathname
    );
    navigate(`/books/${book.id}`);
  };

  return (
    <div className="relative" style={{ height: "12rem", width: "100%" }}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              id={`book-grid-card-${book.id}`}
              className={`
                overflow-hidden cursor-pointer h-48 w-full
                transition-all duration-300 ease-in-out
                hover:scale-105
                ${book.promoted ? "shadow-[0_0_15px_-3px_var(--primary)] border-primary/20" : ""}
              `}
              onClick={handleCardClick}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* New Book Banner */}
              {isNewBook(book) && (
                <div className="absolute -bottom-6 -right-9 z-20">
                  <div className="bg-[#7fffd4] text-black text-xs px-8 py-0.1 rotate-[-45deg] origin-top-left shadow-sm">
                    New
                  </div>
                </div>
              )}
              {/* Promoted Badge */}
              {book.promoted && (
                <div className="absolute -top-2 -right-1 z-20">
                  <Badge
                    variant="default"
                    className="bg-primary/10 text-primary border rounded-none rounded-bl-md border-primary/20 text-xs"
                  >
                    Featured
                  </Badge>
                </div>
              )}
              <div className="absolute bg-black/20 top-2 left-[40%] z-10">
                <WishlistButton bookId={book.id} variant="ghost" size="icon" />
              </div>
              <div className="flex h-full">
                <img
                  src={book.images?.find(img => img.imageType === "grid-item")?.imageUrl || "/images/placeholder-book.png"}
                  alt={book.title}
                  className="w-1/3 object-cover"
                />
                <CardContent className="flex flex-col justify-end gap-3 p-3 mt-16 w-2/3">
                  <h3 className="text-sm font-semibold line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <Link
                    href={`/authors/${book.authorId}`}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors line-clamp-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {book.authorName}
                  </Link>

                  <div className="mt-2">
                    <div className="flex flex-col items-left gap-1">
                      <StarRating
                        rating={averageRatings?.overall || 0}
                        readOnly
                        size="sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px] p-2">
            {book.description.length > 100
              ? `${book.description.slice(0, 100)}...`
              : book.description}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
