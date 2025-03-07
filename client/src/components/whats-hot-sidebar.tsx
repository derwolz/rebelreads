import { Book, Rating } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { StarRating } from "@/components/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface BookWithRatingCount extends Book {
  ratingCount: number;
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

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: allRatings } = useQuery<Rating[]>({
    queryKey: ["/api/books"],
    select: (data) => {
      // This would ideally be a server-side operation
      // Here we're just simulating the count of ratings per book
      return data.map(() => ({ bookId: Math.floor(Math.random() * 20) + 1 })) as Rating[];
    }
  });

  // In a real app, this would be calculated server-side
  const topBooks = books?.map(book => {
    const ratingCount = allRatings?.filter(r => r.bookId === book.id).length || 0;
    return { ...book, ratingCount };
  })
  .sort((a, b) => b.ratingCount - a.ratingCount)
  .slice(0, 10);

  return (
    <div className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-muted/30 p-4 rounded-lg lg:sticky lg:top-20">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">What's Hot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <BookItemSkeleton key={i} />
            ))
          ) : topBooks?.length ? (
            topBooks.map((book, index) => (
              <div 
                key={book.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 p-2 rounded-md transition-colors"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <div className="font-bold text-lg w-6 text-center text-muted-foreground">{index + 1}</div>
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
                    <span className="text-xs text-muted-foreground">({book.ratingCount})</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No books available</p>
          )}
        </div>
      </div>
    </div>
  );
}