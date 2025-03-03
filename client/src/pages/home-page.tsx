import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { BookCard } from "@/components/book-card";
import { MainNav } from "@/components/main-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

function BookCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const filteredBooks = books?.filter((book) => {
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <MainNav onSearch={setSearchQuery} />

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Popular Books</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))
          ) : (
            filteredBooks?.map((book) => (
              <BookCard key={book.id} book={book} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}