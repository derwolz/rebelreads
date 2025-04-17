import { Book } from "@shared/schema";
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
}

export function BookGrid({ title, books, isLoading }: BookGridProps) {
  return (
    <section className="my-24 overflow-hidden">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>
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