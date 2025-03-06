import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BookGridCard } from "@/components/book-grid-card";
import { Book } from "@shared/schema";

export function SearchBooksPage() {
  const [location] = useLocation();
  const query = new URLSearchParams(location.split("?")[1]).get("q") || "";

  const { data: searchResults, isLoading } = useQuery<{ books: Book[] }>({
    queryKey: ["/api/search/books", query],
    enabled: query.length > 1,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Search Results for "{query}"</h1>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-[400px] rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {searchResults?.books.map((book) => (
            <BookGridCard key={book.id} book={book} />
          ))}
        </div>
      )}
      {searchResults?.books.length === 0 && (
        <div className="text-center text-muted-foreground">
          No books found matching your search.
        </div>
      )}
    </div>
  );
}