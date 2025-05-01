import { Rating, calculateWeightedRating, calculateCompatibilityRating, DEFAULT_RATING_WEIGHTS, RatingPreferences } from "@shared/schema";
import { Book } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import { WishlistButton } from "./wishlist-button";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { BookCardContextMenu } from "./book-card-context-menu";
import { RatingSentimentDisplay } from "./rating-sentiment-display";
import { SeashellRating } from "./seashell-rating";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to check if a book is new (published within last 7 days)
function isNewBook(book: Book) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return book.publishedDate ? new Date(book.publishedDate) > oneWeekAgo : false;
}

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

  // Fetch book ratings
  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${book.id}/ratings`],
  });

  // Fetch user's rating preferences
  const { data: ratingPreferences } = useQuery<RatingPreferences>({
    queryKey: ["/api/rating-preferences"],
  });

  // Fetch book taxonomies
  const { data: bookTaxonomies } = useQuery({
    queryKey: [`/api/books/${book.id}/taxonomies`],
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

  // Calculate overall weighted rating and compatibility rating using user preferences
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
        // Calculate compatibility rating (-3 to 3 scale)
        compatibility: calculateCompatibilityRating(
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

  // Get top 5 taxonomies with proper sorting
  const topTaxonomies = bookTaxonomies 
    ? [...bookTaxonomies]
        .sort((a, b) => {
          // First sort by type priority (genre > subgenre > theme > trope)
          const typePriority = { genre: 0, subgenre: 1, theme: 2, trope: 3 };
          const typeA = typePriority[a.type as keyof typeof typePriority] || 4;
          const typeB = typePriority[b.type as keyof typeof typePriority] || 4;
          
          if (typeA !== typeB) return typeA - typeB;
          
          // Then sort by rank/importance
          return a.rank - b.rank;
        })
        .slice(0, 5)
    : [];

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

          {/* Black gradient overlay at bottom third */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent z-10"></div>

          {/* Display only positive sentiment at the bottom of the card */}
          {ratings && ratings.length > 0 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center z-20">
              <RatingSentimentDisplay 
                ratings={unweightedRatings as any} 
                ratingsCount={ratings.length}
                showCount={false}
                className="bg-black/50 px-2 py-1 rounded-md"
              />
            </div>
          )}
          
          {/* If no ratings yet, show the weighted rating */}
          {(!ratings || ratings.length === 0) && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center z-20">
              <div className="flex items-center gap-2">
                <StarRating rating={averageRatings?.overall || 0} readOnly size="sm" />
                <span className="text-white text-sm">
                  ({averageRatings?.overall.toFixed(1) || "0.0"})
                </span>
              </div>
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
            p-4 flex flex-col
            z-30
          `} 
          style={{height: '100%'}}
        >
          <h3 className="text-lg font-semibold mb-1">{book.title}</h3>
          <p className="text-sm text-muted-foreground mb-1">{book.authorName}</p>

          {/* Top 5 taxonomic tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {topTaxonomies.map((taxonomy) => (
              <TooltipProvider key={`${taxonomy.taxonomyId}-${taxonomy.rank}`}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant={
                        taxonomy.type === "genre"
                          ? "default"
                          : taxonomy.type === "subgenre"
                          ? "secondary"
                          : taxonomy.type === "theme"
                          ? "outline"
                          : "destructive"
                      }
                      className="text-xs cursor-help"
                    >
                      {taxonomy.name}
                    </Badge>
                  </TooltipTrigger>
                  {taxonomy.description && (
                    <TooltipContent className="max-w-xs">
                      <p>{taxonomy.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {/* Book description */}
          <p className="text-sm mb-3 flex-grow">
            {truncatedDescription}
          </p>

          {/* Compatibility rating */}
          {averageRatings && (
            <div className="mb-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Compatibility</span>
                <SeashellRating 
                  compatibility={averageRatings.compatibility || 0} 
                  readOnly 
                  size="xs" 
                />
              </div>
            </div>
          )}

          {/* Rating sentiment display for all ratings */}
          {ratings && ratings.length > 0 && (
            <div className="mt-1">
              <RatingSentimentDisplay 
                ratings={unweightedRatings as any} 
                ratingsCount={ratings.length}
                showCount={true}
              />
            </div>
          )}

          {/* If no ratings are available, show the old style ratings */}
          {(!ratings || ratings.length === 0) && averageRatings && (
            <div className="space-y-1 mt-auto">
              <div className="flex justify-between items-center">
                <span className="text-xs">Enjoyment</span>
                <StarRating rating={averageRatings.enjoyment || 0} readOnly size="xs" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Writing</span>
                <StarRating rating={averageRatings.writing || 0} readOnly size="xs" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Themes</span>
                <StarRating rating={averageRatings.themes || 0} readOnly size="xs" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Characters</span>
                <StarRating rating={averageRatings.characters || 0} readOnly size="xs" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">World Building</span>
                <StarRating rating={averageRatings.worldbuilding || 0} readOnly size="xs" />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
    </BookCardContextMenu>
  );
}