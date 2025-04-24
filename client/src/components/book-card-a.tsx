import { Rating, calculateWeightedRating, DEFAULT_RATING_WEIGHTS, RatingPreferences } from "@shared/schema";
import { Book } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import { WishlistButton } from "./wishlist-button";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

// Helper function to check if a book is new (published within last 7 days)
function isNewBook(book: Book) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return book.publishedDate ? new Date(book.publishedDate) > oneWeekAgo : false;
}

export function BookCardA({ 
  book, 
  taxonomicScore, 
  matchingTaxonomies 
}: { 
  book: Book, 
  taxonomicScore?: number, 
  matchingTaxonomies?: number 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);

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
      }
    : null;

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

  return (
    <div
      className="relative"
      style={{ width: "256px", height: "440px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        id={`book-card-a-${book.id}`}
        className={`
          cursor-pointer w-full shadow-md
          transition-all duration-300 ease-in-out
          overflow-hidden relative
          ${isHovered ? 'scale-105' : ''}
        `}
        style={{
          height: "100%",
          aspectRatio: "58/100",
          transformOrigin: "center"
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
            absolute inset-0 bg-gradient-to-t from-background/95 to-transparent
            transition-all duration-300 ease-in-out
            transform ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
            p-4 flex flex-col justify-end
            z-30
          `} 
          style={{height: '100%'}}
        >
          <h3 className="text-lg font-semibold mb-1">{book.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{book.authorName}</p>
          
          {/* Top 5 genres */}
          <div className="flex flex-wrap gap-1 mb-3">
            {book.genres?.slice(0, 5).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
          
          {/* 5 vector star ratings */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs">Enjoyment</span>
              <StarRating rating={averageRatings?.enjoyment || 0} readOnly size="xs" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Writing</span>
              <StarRating rating={averageRatings?.writing || 0} readOnly size="xs" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Themes</span>
              <StarRating rating={averageRatings?.themes || 0} readOnly size="xs" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Characters</span>
              <StarRating rating={averageRatings?.characters || 0} readOnly size="xs" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">World Building</span>
              <StarRating rating={averageRatings?.worldbuilding || 0} readOnly size="xs" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}