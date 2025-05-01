import { Rating, calculateWeightedRating, RatingPreferences, type SentimentLevel } from "@shared/schema";
import { Book } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WishlistButton } from "./wishlist-button";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { BookCardContextMenu } from "./book-card-context-menu";
import { SeashellRating } from "./seashell-rating";
import { 
  Heart, Pencil, Lightbulb, Drama, GlobeIcon 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Helper function to check if a book is new (published within last 7 days)
function isNewBook(book: Book) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return book.publishedDate ? new Date(book.publishedDate) > oneWeekAgo : false;
}

// Define category icons
const SENTIMENT_ICONS = {
  enjoyment: Heart,
  writing: Pencil,
  themes: Lightbulb, 
  characters: Drama,
  worldbuilding: GlobeIcon,
};

// Map sentiment levels to colors
const SENTIMENT_COLORS: Record<SentimentLevel, string> = {
  overwhelmingly_positive: 'text-[hsl(271,56%,45%)]',
  very_positive: 'text-[hsl(271,56%,45%)]',
  mostly_positive: 'text-[hsl(271,56%,70%)]',
  mixed: 'text-amber-500',
  mostly_negative: 'text-red-400',
  very_negative: 'text-red-500',
  overwhelmingly_negative: 'text-red-600',
};

// Map sentiment levels to readable labels
const SENTIMENT_LABELS: Record<SentimentLevel, string> = {
  overwhelmingly_positive: 'Overwhelmingly Positive',
  very_positive: 'Very Positive',
  mostly_positive: 'Mostly Positive',
  mixed: 'Mixed',
  mostly_negative: 'Mostly Negative',
  very_negative: 'Very Negative',
  overwhelmingly_negative: 'Overwhelmingly Negative',
};

export function BookCard({ 
  book, 
  taxonomicScore, 
  matchingTaxonomies,
  onContextMenuOpen,
  onContextMenuClose
}: { 
  book: Book, 
  taxonomicScore?: number, 
  matchingTaxonomies?: number,
  onContextMenuOpen?: () => void,
  onContextMenuClose?: () => void
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);
  const [trailElements, setTrailElements] = useState<React.ReactNode[]>([]);

  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${book.id}/ratings`],
  });

  // Fetch user's rating preferences
  const { data: ratingPreferences } = useQuery<RatingPreferences>({
    queryKey: ["/api/rating-preferences"],
  });

  // Fetch sentiment thresholds
  const { data: sentimentThresholds } = useQuery({
    queryKey: ['/api/rating-sentiments'],
  });

  // Generate pixel trails that follow the traveler
  useEffect(() => {
    if (book.promoted) {
      // Create multiple trail elements with different delays
      const trailCount = 20; // Number of trail elements
      const newTrailElements = [];

      for (let i = 0; i < trailCount; i++) {
        // Calculate delays for animation synchronization
        const animationDelay = i * 0.010; // seconds between trails

        newTrailElements.push(
          <div 
            key={`trail-${i}`}
            className="pixel-trail"
            style={{
              animationDelay: `${animationDelay}s`,
              // Each trail element follows the pixel but with delay
              // The animation-delay of the trail elements creates a trailing effect
              animationName: 'trail-fade, border-path',
              animationDuration: '0s, 6s',
              animationTimingFunction: 'linear, linear',
              animationIterationCount: 'infinite, infinite',
              animationDirection: 'normal, normal',
              // This staggers the trail elements along the path
              animationPlayState: 'running, running',
              opacity: Math.sin(i*Math.PI*2/trailCount), // Decreasing opacity for each trail
            }}
          />
        );
      }

      setTrailElements(newTrailElements);
    }
  }, [book.promoted]);

  // Set up intersection observer to track when the card becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }, // Card must be 50% visible to count
    );

    const element = document.getElementById(`book-card-a-${book.id}`);
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
          source: "card-a",
          context: window.location.pathname,
        });
        setHasRecordedImpression(true);
      };
      recordImpression();
    }
  }, [isVisible, hasRecordedImpression, book.id]);

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
        // Compatibility calculation would come from the backend or be calculated 
        // based on user preferences and book ratings
        compatibility: 1.5, // Example value: 1.5 on a scale of -3 to 3
      }
    : null;

  // Calculate sentiment results for each criteria
  const sentimentResults = sentimentThresholds && unweightedRatings && ratings ? 
    Object.entries(unweightedRatings).map(([criteriaName, averageRating]) => {
      // Skip overall as it's not a sentiment criteria
      if (criteriaName === 'overall') return null;

      const count = ratings.length;
      let sentimentLevel: SentimentLevel | null = null;
      let hasEnoughRatings = false;

      // Find the applicable sentiment threshold for this criteria and rating
      if (sentimentThresholds) {
        const criteriaThresholds = sentimentThresholds.filter(
          (t: any) => t.criteriaName === criteriaName
        );

        for (const threshold of criteriaThresholds) {
          if (
            count >= threshold.requiredCount &&
            averageRating >= threshold.ratingMin &&
            averageRating <= threshold.ratingMax
          ) {
            sentimentLevel = threshold.sentimentLevel;
            hasEnoughRatings = true;
            break;
          }
        }
      }

      return {
        criteriaName,
        sentimentLevel,
        averageRating,
        count,
        hasEnoughRatings
      };
    }).filter(Boolean) : [];

  // Get only the positive sentiments to display when card is not hovered
  const positiveSentiments = sentimentResults?.filter(result => 
    result?.sentimentLevel && 
    ['mostly_positive', 'very_positive', 'overwhelmingly_positive'].includes(result.sentimentLevel)
  );

  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't navigate if clicking on the wishlist button
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    // Record click-through before navigation
    await apiRequest("POST", `/api/books/${book.id}/click-through`, {
      source: "card-a",
      referrer: window.location.pathname,
    });

    // Use anti-scraping link format when navigating to book details
    if (book.authorName) {
      // Encode both authorName and bookTitle for the URL
      const encodedAuthor = encodeURIComponent(book.authorName);
      const encodedTitle = encodeURIComponent(book.title);
      navigate(`/book-details?authorName=${encodedAuthor}&bookTitle=${encodedTitle}`);
    } else {
      // Fallback to traditional ID-based URL if authorName is not available
      navigate(`/books/${book.id}`);
    }
  };

  // Get the first 100 characters of book description
  const truncatedDescription = book.description
    ? book.description.length > 100
      ? `${book.description.slice(0, 100)}...`
      : book.description
    : "";

  return (
    <BookCardContextMenu 
      book={book} 
      onContextMenuOpen={onContextMenuOpen}
      onContextMenuClose={onContextMenuClose}
    >
      <div
        className={`relative transition-all duration-300 ease-in-out ${isHovered ? 'scale-105' : ''}`}
        style={{ width: "256px", height: "412px" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gold pixel with trail - only for promoted books */}
        {book.promoted && (
          <div className="absolute inset-0 z-40 pointer-events-none">
            {/* The traveling pixel */}
            <div className="pixel-traveler" />

            {/* Trail elements */}
            {trailElements}
          </div>
        )}

        <Card
          id={`book-card-a-${book.id}`}
          className={`
            cursor-pointer w-full
            transition-all duration-300 ease-in-out
            overflow-hidden relative

            ${book.promoted ? 'shadow-none z-30' : 'shadow-md'}
          `}
          style={{
            height: "100%",
            aspectRatio: "58/100",
            transformOrigin: "center",
            zIndex: "20"
          }}
          onClick={handleCardClick}
        >
        {/* Featured badge */}
        {book.promoted && (
          <div className="absolute -top-[3px] -right-0 z-20">
            <Badge
              variant="default"
              className="bg-primary/10 text-primary rounded-md rounded-tr-md rounded-br-none border-t-0 rounded-tl-none border-l-1 border-r-0 border-b-1 border-primary/20 text-xs"
            >
              Featured
            </Badge>
          </div>
        )}

        {/* Wishlist button */}
        <div className="absolute bg-black/20 rounded-full top-2 left-2 z-20">
          <WishlistButton bookId={book.id} className="rounded-full bg-transparent" size="icon" />
        </div>

        {/* Book cover image with subtle highlight */}
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-black/5 shadow-inner z-10"></div>
          <img
            src={
              book.images?.find((img) => img.imageType === "book-card")
                ?.imageUrl || "/images/placeholder-book.png"
            }
            alt={book.title}
            className="w-full h-full object-cover object-center"
          />

          {/* Black gradient overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent z-10"></div>

          {/* ONLY POSITIVE Sentiment icons in the bottom area when not hovered */}
          {!isHovered && positiveSentiments?.length > 0 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center z-20 gap-2">
              {positiveSentiments.map((result) => {
                const IconComponent = SENTIMENT_ICONS[result.criteriaName as keyof typeof SENTIMENT_ICONS];
                return (
                  <TooltipProvider key={result.criteriaName}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <IconComponent 
                            className={cn(
                              "h-5 w-5 text-white", 
                              result.sentimentLevel && SENTIMENT_COLORS[result.sentimentLevel]
                            )} 
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-semibold capitalize">{result.criteriaName}</p>
                          {result.sentimentLevel && (
                            <p className={SENTIMENT_COLORS[result.sentimentLevel]}>
                              {SENTIMENT_LABELS[result.sentimentLevel]}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          )}
        </div>

        {/* New book banner */}
        {isNewBook(book) && (
          <div className="absolute bottom-0 left-0 z-20">
            <div className="bg-gold text-gold-foreground text-xs px-4 py-0.5 shadow-sm">
              New
            </div>
          </div>
        )}

        {/* Slide-out section with details */}
        <div 
          className={`
            absolute inset-0 bg-gradient-to-t from-background/95 to-background/60
            transition-all duration-300 ease-in-out
            transform ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
            p-4 flex flex-col justify-end
            z-30
          `} 
          style={{height: '100%'}}
        >
          <h3 className="text-lg font-semibold mb-1">{book.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{book.authorName}</p>

          {/* Book description (first 100 characters) */}
          <p className="text-sm mb-4 flex-grow">
            {truncatedDescription}
          </p>

          {/* Compatibility rating */}
          {averageRatings && (
            <div className="mb-3">
              <div className="text-sm font-medium mb-1">Compatibility</div>
              <SeashellRating compatibility={averageRatings.compatibility} readOnly size="sm" />
            </div>
          )}

          {/* Sentiment ratings */}
          <div className="space-y-1 mt-auto">
            <h4 className="text-sm font-medium mb-2">Rating Sentiment</h4>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {sentimentResults.map((result) => {
                const IconComponent = SENTIMENT_ICONS[result.criteriaName as keyof typeof SENTIMENT_ICONS];
                
                return (
                  <TooltipProvider key={result.criteriaName}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative flex items-center gap-2">
                          <IconComponent 
                            className={cn(
                              "h-5 w-5", 
                              result.hasEnoughRatings && result.sentimentLevel
                                ? SENTIMENT_COLORS[result.sentimentLevel]
                                : "text-muted-foreground"
                            )} 
                          />
                          <span className="text-xs capitalize">{result.criteriaName}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-semibold capitalize">{result.criteriaName}</p>
                          {result.hasEnoughRatings && result.sentimentLevel ? (
                            <p className={SENTIMENT_COLORS[result.sentimentLevel]}>
                              {SENTIMENT_LABELS[result.sentimentLevel]}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">
                              Not enough ratings yet
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
    </BookCardContextMenu>
  );
}