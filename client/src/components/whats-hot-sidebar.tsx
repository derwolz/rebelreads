import { Book } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { StarRating } from "@/components/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

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
      <Skeleton className="w-12 h-16 flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
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
      const recordImpression = async () => {
        await apiRequest("POST", `/api/books/${book.id}/impression`, {
          source: "mini",
          context: window.location.pathname,
        });
        setHasRecordedImpression(true);
      };
      recordImpression();
    }
  }, [isVisible, hasRecordedImpression, book.id]);

  const handleClick = async () => {
    // Record click-through before navigation
    await apiRequest("POST", `/api/books/${book.id}/click-through`, {
      source: "mini",
      referrer: window.location.pathname,
    });
    navigate(`/books/${book.id}`);
  };

  return (
    <div 
      id={`mini-book-${book.id}`}
      className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 p-2 rounded-md transition-colors"
      onClick={handleClick}
    >
      <div className="font-bold text-lg w-6 text-center text-muted-foreground">{rank}</div>
      <img 
        src={book.images?.find(img => img.imageType === "mini")?.imageUrl || "/images/placeholder-book.png"} 
        alt={book.title} 
        className="w-12 h-16 object-cover rounded-sm flex-shrink-0" 
      />
      <div className="overflow-hidden">
        <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
        <div className="flex items-center mt-1 gap-1">
          <StarRating rating={3} readOnly size="xs" />
        </div>
      </div>
    </div>
  );
}

export function WhatsHotSidebar() {
  const [, navigate] = useLocation();
  
  // Fetch popular books from our new API endpoint
  const { data: popularBooks, isLoading } = useQuery<PopularBook[]>({
    queryKey: ["/api/popular-books"],
    staleTime: 1000 * 60 * 60, // 1 hour - since these are calculated daily
  });

  return (
    <div className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-muted/30 p-4 rounded-lg lg:sticky lg:top-20">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">What's Hot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <BookItemSkeleton key={i} />
            ))
          ) : popularBooks?.length ? (
            popularBooks.map((book) => (
              <MiniBookCard 
                key={book.id} 
                book={book} 
                rank={book.popularRank} 
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No popular books available</p>
          )}
        </div>
      </div>
    </div>
  );
}