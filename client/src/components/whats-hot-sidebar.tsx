import { Book } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { StarRating } from "@/components/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

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
              <div 
                key={book.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 p-2 rounded-md transition-colors"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <div className="font-bold text-lg w-6 text-center text-muted-foreground">{book.popularRank}</div>
                <img 
                  src={book.coverUrl} 
                  alt={book.title} 
                  className="w-12 h-16 object-cover rounded-sm flex-shrink-0" 
                />
                <div className="overflow-hidden">
                  <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                  <div className="flex items-center mt-1 gap-1">
                    <StarRating rating={3} readOnly size="xs" />
                    <span className="text-xs text-muted-foreground">({book.clickThroughCount || 0})</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No popular books available</p>
          )}
        </div>
      </div>
    </div>
  );
}