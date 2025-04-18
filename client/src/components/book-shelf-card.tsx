import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WishlistButton } from "./wishlist-button";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Book } from "../types";
import { Rating, RatingPreferences, calculateWeightedRating, DEFAULT_RATING_WEIGHTS } from "@shared/schema";
import { StarRating } from "./star-rating";
import { BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface BookShelfCardProps {
  book: Book;
  onRemoveFromShelf?: (bookId: number) => void;
  onViewNotes?: (bookId: number) => void;
}

export function BookShelfCard({ 
  book, 
  onRemoveFromShelf,
  onViewNotes
}: BookShelfCardProps) {
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

    const element = document.getElementById(`book-shelf-card-${book.id}`);
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
          source: "shelf-card",
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
    // Don't navigate if clicking on the shelf buttons
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    // Record click-through before navigation
    await apiRequest("POST", `/api/books/${book.id}/click-through`, {
      source: "shelf-card",
      referrer: window.location.pathname,
    });
    navigate(`/books/${book.id}`);
  };

  // Inject keyframes into the document head once for the shelf rotation animation
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes rotate-shelf {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(30deg);
        }
      }
    `;
    document.head.appendChild(styleSheet);

    // Cleanup to avoid duplicate styles
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div
      className="relative"
      style={{ width: "256px", height: "400px", maxWidth: "100%" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              id={`book-shelf-card-${book.id}`}
              className={`
                cursor-pointer w-full rounded-none shadow-md shadow-black/15
                transition-all duration-300 ease-in-out overflow-hidden
                ${book.promoted ? "border-primary/20" : ""}
              `}
              style={{
                width: "100%",
                height: "100%",
                transformOrigin: "bottom left",
                position: "relative",
              }}
              onClick={handleCardClick}
            >
              {book.promoted && (
                <div className="absolute -top-1 -right-1 z-20">
                  <Badge
                    variant="default"
                    className="bg-primary/10 text-primary text-xs"
                  >
                    Featured
                  </Badge>
                </div>
              )}
              
              <div className="absolute bg-black/20 rounded-full top-2 left-2 z-10">
                <WishlistButton bookId={book.id} variant="ghost" size="icon" />
              </div>

              <img
                src={
                  book.images?.find((img) => img.imageType === "book-card")
                    ?.imageUrl || "/images/placeholder-book.png"
                }
                alt={book.title}
                className="w-full h-64 object-cover object-center"
              />
              
              <CardContent className="p-3 relative">
                <div className="absolute -mb-0 t-0 l-0 -mr-0 w-[94%] h-[90%]">
                  {/* New Book Banner */}
                  {isNewBook(book) && (
                    <div className="absolute -bottom-8 -right-12 z-20">
                      <div className="bg-[#7fffd4] text-black text-xs px-16 py-0.5 rotate-[-45deg] origin-top-left shadow-sm">
                        New
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="text-md font-semibold mb-1 line-clamp-1">{book.title}</h3>
                <Link
                  href={`/authors/${book.authorId}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors block line-clamp-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {book.authorName}
                </Link>

                <div className="mt-1">
                  <div className="flex items-center gap-1">
                    <StarRating
                      rating={averageRatings?.overall || 0}
                      readOnly
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      ({averageRatings?.overall.toFixed(2) || "0.00"})
                    </span>
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

      {/* Bookshelf */}
      <div 
        className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-r from-amber-800 to-amber-600 border-t-2 border-amber-900 shadow-md transition-all duration-300 ease-in-out overflow-hidden flex justify-center items-center gap-3 z-20"
        style={{
          transformOrigin: "bottom left",
          transform: isHovered ? "rotate(30deg)" : "rotate(0deg)",
          boxShadow: "0 -2px 5px rgba(0, 0, 0, 0.2)"
        }}
      >
        {/* Shelf buttons that are revealed when the shelf is rotated */}
        <Button
          variant="ghost"
          size="sm"
          className={`bg-white/20 text-white hover:bg-white/40 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          onClick={(e) => {
            e.stopPropagation();
            onViewNotes?.(book.id);
          }}
        >
          <BookOpen className="h-4 w-4 mr-1" />
          Notes
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`bg-white/20 text-white hover:bg-white/40 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromShelf?.(book.id);
          }}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  );
}