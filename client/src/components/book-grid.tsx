import { Book } from "@shared/schema";
import { BookGridCard } from "@/components/book-grid-card";
import { Skeleton } from "@/components/ui/skeleton";

function BookCardSkeleton() {
  return (
    <div className="space-y-3" style={{ width: "200px", height: "200px" }}>
      <Skeleton className="h-full w-full" />
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
    <section className="mb-12 overflow-hidden">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-center">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex justify-center">
                <BookCardSkeleton />
              </div>
            ))
          : books?.map((book) => (
              <div key={book.id} className="flex justify-center">
                <BookGridCard book={book} />
              </div>
            ))}
      </div>
    </section>
  );
}