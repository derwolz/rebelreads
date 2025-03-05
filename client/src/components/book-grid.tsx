
import { Book } from "@shared/schema";
import { BookCard } from "@/components/book-card";
import { Skeleton } from "@/components/ui/skeleton";

function BookCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-64 w-full" />
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
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))
          : books?.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
      </div>
    </section>
  );
}
