import { Book, Rating, calculateWeightedRating, DEFAULT_RATING_WEIGHTS, RatingPreferences } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import { WishlistButton } from "./wishlist-button";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Position-based weights for rating criteria
const POSITION_WEIGHTS = [0.35, 0.25, 0.20, 0.12, 0.08];

// Helper function to get weight percentage for a criteria based on stored weights or position
function getWeightPercentage(criteriaName: string, prefs?: RatingPreferences): string {
  if (!prefs) {
    // Use default weights if no user preferences
    return `${(DEFAULT_RATING_WEIGHTS[criteriaName as keyof typeof DEFAULT_RATING_WEIGHTS] * 100).toFixed(0)}%`;
  }
  
  // If we have individual weights columns, use those directly
  if (prefs[criteriaName as keyof RatingPreferences] !== undefined) {
    // Convert any string values to numbers for percentage calculation
    const value = prefs[criteriaName as keyof RatingPreferences];
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${(Number(numericValue) * 100).toFixed(0)}%`;
  }
  
  // Fall back to default weights if we don't have the specific property
  return `${(DEFAULT_RATING_WEIGHTS[criteriaName as keyof typeof DEFAULT_RATING_WEIGHTS] * 100).toFixed(0)}%`;
}

// Helper function to check if a book is new (published within last 7 days)
function isNewBook(book: Book) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return book.publishedDate ? new Date(book.publishedDate) > oneWeekAgo : false;
}

export function BookCard({ book }: { book: Book }) {
  const [showDetailed, setShowDetailed] = useState(false);
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);

  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${book.id}/ratings`],
  });
  
  // Fetch user's rating preferences
  const { data: ratingPreferences } = useQuery<RatingPreferences>({
    queryKey: ['/api/rating-preferences'],
  });

  // Set up intersection observer to track when the card becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }, // Card must be 50% visible to count
    );

    const element = document.getElementById(`book-card-${book.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [book.id]);

  // Record impression when card becomes visible
  useEffect(() => {
    if (isVisible && !hasRecordedImpression) {
      const recordImpression = async () => {
        await apiRequest("POST", `/api/books/${book.id}/impression`, {
          source: "card",
          context: window.location.pathname,
        });
        setHasRecordedImpression(true);
      };
      recordImpression();
    }
  }, [isVisible, hasRecordedImpression, book.id]);

  // We no longer need to derive criteria order as we're using the weight columns directly
  
  // Calculate individual unweighted ratings per vector
  const unweightedRatings = ratings?.length
    ? {
        enjoyment: ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length,
        writing: ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
        themes: ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
        characters: ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length,
        worldbuilding: ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length,
      }
    : null;
    
  // Calculate overall weighted rating using user preferences and the unweighted individual ratings
  const averageRatings = unweightedRatings
    ? {
        ...unweightedRatings,
        overall: calculateWeightedRating({
          enjoyment: unweightedRatings.enjoyment,
          writing: unweightedRatings.writing,
          themes: unweightedRatings.themes,
          characters: unweightedRatings.characters,
          worldbuilding: unweightedRatings.worldbuilding
        } as Rating, ratingPreferences)
      }
    : null;

  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't navigate if clicking on the wishlist button
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    // Record click-through before navigation
    await apiRequest("POST", `/api/books/${book.id}/click-through`, {
      source: "card",
      referrer: window.location.pathname,
    });
    navigate(`/books/${book.id}`);
  };
  // Inject keyframes into the document head once
  useEffect(() => {
    if (book.promoted) {
      const styleSheet = document.createElement("style");
      styleSheet.textContent = `
        @keyframes pulse-shadow {
          0%, 100% { box-shadow: 0 10px 15px -3px rgba(127, 255, 212, .10); }
          50% { box-shadow: 0 10px 15px -3px rgba(127, 255, 212, 0.24); }
        }
      `;
      document.head.appendChild(styleSheet);

      // Cleanup to avoid duplicate styles
      return () => {
        document.head.removeChild(styleSheet);
      };
    }
  }, [book.promoted]);
  return (
    <div className="relative group" style={{ width: "256px", height: "512px", maxWidth: "100%" }}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              id={`book-card-${book.id}`}
              className={`
                overflow-visible cursor-pointer w-full
                transition-all duration-300 ease-in-out
                ${showDetailed ? "absolute inset-0 scale-105 shadow-xl z-50" : "relative z-10"}
                ${book.promoted ? "animate-pulse-shadow border-primary/20" : ""}
              `}
              style={{ 
                width: "100%",
                height: "100%",
                aspectRatio: "1/2",
                position: showDetailed ? "absolute" : "relative"
              }}
              onClick={handleCardClick}
              onMouseEnter={() => setShowDetailed(true)}
              onMouseLeave={() => setShowDetailed(false)}
            >
              {book.promoted && (
                <div className="absolute -top-[2.9px] -right-0 z-20">
                  <Badge
                    variant="default"
                    className="bg-primary/10 text-primary rounded-md rounded-tr-md rounded-br-none  border-t-0 rounded-tl-none  border-l-1 border-r-0 border-b-1 border-primary/20 text-xs"
                  >
                    Featured
                  </Badge>
                </div>
              )}
              <div className="absolute bg-black/20 rounded-full top-2 left-2  z-10">
                <WishlistButton bookId={book.id} variant="ghost" size="icon" />
              </div>
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-64 object-cover object-center"
                style={{ aspectRatio: "1/1" }}
              />
              <CardContent className="p-4 relative">
                <div className="absolute -mb-0 t-0 l-0 -mr-0 w-[94%] h-[90%] overflow-hidden">
                  {/* New Book Banner */}
                  {isNewBook(book) && (
                    <div className="absolute -bottom-8 -right-12 z-20">
                      <div className="bg-[#7fffd4] text-black text-xs px-16 py-0.5 rotate-[-45deg] origin-top-left shadow-sm">
                        New
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2 ">{book.title}</h3>
                <Link
                  href={`/authors/${book.authorId}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {book.author}
                </Link>

                <div className="flex flex-wrap gap-1 mt-2 mb-2">
                  {/* Temporarily handling missing genres field during migration to taxonomy system */}
                  {((book as any).genres || []).slice(0, 3).map((genre: string) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>

                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <StarRating
                      rating={averageRatings?.overall || 0}
                      readOnly
                    />
                    <span className="text-sm text-muted-foreground">
                      ({averageRatings?.overall.toFixed(2) || "0.00"})
                    </span>
                  </div>
                </div>

                <div
                  className={`
                    absolute left-0 right-0 bg-background/95 backdrop-blur-sm
                    transition-all duration-300 ease-in-out
                    shadow-lg rounded-b-lg
                    ${showDetailed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}
                  `}
                  style={{
                    top: "100%",
                    borderTop: "1px solid var(--border)",
                    zIndex: 100,
                    transformOrigin: "top",
                    width: "100%"
                  }}
                >
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Enjoyment 
                      </span>
                      <div className="flex items-center gap-2">
                        <StarRating
                          rating={averageRatings?.enjoyment || 0}
                          readOnly
                          size="sm"
                        />
                  
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Writing 
                      </span>
                      <div className="flex items-center gap-2">
                        <StarRating
                          rating={averageRatings?.writing || 0}
                          readOnly
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Themes 
                      </span>
                      <div className="flex items-center gap-2">
                        <StarRating
                          rating={averageRatings?.themes || 0}
                          readOnly
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Characters 
                      </span>
                      <div className="flex items-center gap-2">
                        <StarRating
                          rating={averageRatings?.characters || 0}
                          readOnly
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        World Building 
                      </span>
                      <div className="flex items-center gap-2">
                        <StarRating
                          rating={averageRatings?.worldbuilding || 0}
                          readOnly
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
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