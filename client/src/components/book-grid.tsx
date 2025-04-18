import { Book } from "../types";
import { BookGridCard } from "@/components/book-grid-card";
import { Skeleton } from "@/components/ui/skeleton";

function BookCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

interface BookGridProps {
  title: string;
  books?: Book[];
  isLoading: boolean;
  onDiscoverMore?: () => void;
}

export function BookGrid({ title, books, isLoading, onDiscoverMore }: BookGridProps) {
  return (
    <section className="my-24 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{title}</h2>
        {onDiscoverMore && (
          <button 
            onClick={onDiscoverMore}
            className="text-primary hover:underline font-medium flex items-center" 
          >
            Discover More
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="ml-1"
            >
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0 mx-auto">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))
          : books?.map((book) => (
              <div key={book.id} className="relative w-full">
                <BookGridCard book={book} />
              </div>
            ))}
      </div>
    </section>
  );
}