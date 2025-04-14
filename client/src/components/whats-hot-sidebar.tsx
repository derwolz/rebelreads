import { Book } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { StarRating } from "@/components/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface TopAnimeOptions {
  period: "day" | "week" | "month";
}

function TopAnimeFilter({ activePeriod, onChange }: { 
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

  // Random TV indicator as shown in the reference image
  const isTv = Math.random() > 0.5;
  
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
          <p className="text-xs text-muted-foreground line-clamp-1 mr-1">{book.author}</p>
          {isTv && <span className="text-[10px] px-1 bg-muted/50 rounded text-muted-foreground">TV</span>}
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
  
  // Fetch popular books from our new API endpoint
  const { data: popularBooks, isLoading } = useQuery<PopularBook[]>({
    queryKey: ["/api/popular-books", periodFilter],
    staleTime: 1000 * 60 * 60, // 1 hour - since these are calculated daily
  });

  return (
    <div className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-muted/10 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Top anime</h2>
          <TopAnimeFilter 
            activePeriod={periodFilter} 
            onChange={setPeriodFilter} 
          />
        </div>
        
        <div className="space-y-1">
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
      </div>
    </div>
  );
}