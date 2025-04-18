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
import { BookOpen, Trash2, CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Note type from book-shelf-page.tsx
type Note = {
  id: number;
  userId: number;
  content: string;
  type: "book" | "shelf";
  bookId?: number;
  shelfId?: number;
  createdAt: string;
  updatedAt: string;
};

// Format date for notes
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
}

interface BookShelfCardProps {
  book: Book;
  bookNotes?: Note[];
  onRemoveFromShelf?: (bookId: number) => void;
  onViewNotes?: (bookId: number) => void;
  onAddNote?: (type: "book" | "shelf", bookId?: number) => void;
  onSelectNote?: (note: Note) => void;
}

export function BookShelfCard({ 
  book, 
  bookNotes = [],
  onRemoveFromShelf,
  onViewNotes,
  onAddNote,
  onSelectNote
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
      style={{ width: "256px", height: "400px", maxWidth: "100%", zIndex:isHovered ? 30: 10 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* Bookshelf with notes */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[250px] bg-amber-800 rounded p-4 border-t-4 border-amber-900 shadow-md duration-300 ease-in-out overflow-hidden"
        style={{
          transformOrigin: "bottom left",
          transform: isHovered ? "rotate(30deg)" : "rotate(0deg)",
          boxShadow: "0 -2px 5px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Header with action buttons */}
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-white font-semibold text-sm">Notes ({bookNotes.length})</h4>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/20 text-white hover:bg-white/40 h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onAddNote?.("book", book.id);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/20 text-white hover:bg-white/40 h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromShelf?.(book.id);
              }}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>
        </div>
        
        {/* Scrollable notes list */}
        <ScrollArea className="h-[160px] pr-2">
          {bookNotes.length > 0 ? (
            <div className="space-y-2">
              {bookNotes.map((note) => (
                <div 
                  key={note.id}
                  className="bg-white/10 rounded p-2 cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNote?.(note);
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="outline" className="text-white/90 border-white/30 text-[10px] px-1 py-0">
                      {formatDate(note.createdAt)}
                    </Badge>
                  </div>
                  <p className="text-white text-xs line-clamp-2">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/70 text-center">
              <BookOpen className="h-5 w-5 mb-1 opacity-70" />
              <p className="text-xs">No notes yet</p>
              <p className="text-[10px] mt-1">Click Add to create one</p>
            </div>
          )}
        </ScrollArea>
        
        {/* Wood grain effect for the shelf */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 0c20 10 40 10 60 0s40-10 60 0v100c-20-10-40-10-60 0s-40 10-60 0V0z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}
        />
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              id={`book-shelf-card-${book.id}`}
              className={`
                cursor-pointer w-full rounded-none shadow-md shadow-black/15
                transition-all duration-300 ease-in-out overflow-hidden hover:z-20
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
                    <div className="absolute -bottom-16 -right-16 z-30">
                      <div className="bg-[#7fffd4] text-black text-xs px-16 py-.5 rotate-[-45deg] origin-bottom-left shadow-sm">
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


    </div>
  );
}