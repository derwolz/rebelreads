import { useQuery } from "@tanstack/react-query";
import { BookGridCard } from "@/components/book-grid-card";
import { Book, Rating } from "@shared/schema";
import { FilterSidebar, type BookFilters } from "@/components/filter-sidebar";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";

interface SearchResults {
  books: Book[];
  metadata: {
    total: number;
    originalTotal?: number;
    query: string;
    filtered: boolean;
  };
}

export function SearchBooksPage() {
  const query = new URLSearchParams(window.location.search).get("q") || "";
  const [filters, setFilters] = useState<BookFilters>({
    genres: [],
    dateRange: {
      from: null,
      to: null,
    },
    minRating: 0,
    formats: [],
    onSale: false,
    lengths: [],
    sortBy: "rating",
    publishers: [],
  });

  const {
    data: searchResults,
    isLoading,
    isError,
  } = useQuery<SearchResults>({
    queryKey: ["/api/search/books", query],
    queryFn: () =>
      fetch(`/api/search/books?q=${query}`).then((response) => response.json()),
    enabled: true,
  });

  // Get unique genres from all books
  const allGenres = Array.from(
    new Set(searchResults?.books.flatMap((book) => book.genres) || [])
  ).sort();

  // Helper function to calculate average rating
  const calculateAverageRating = (book: Book) => {
    // For now return 0 since we don't have ratings data
    // This will be updated when we implement the ratings feature
    return 0;
  };

  // Apply filters to search results
  const filteredBooks = searchResults?.books.filter((book) => {
    // Genre filter
    if (
      filters.genres.length > 0 &&
      !filters.genres.some((genre) => book.genres.includes(genre))
    ) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const publishDate = new Date(book.publishedDate);
      if (
        (filters.dateRange.from && publishDate < filters.dateRange.from) ||
        (filters.dateRange.to && publishDate > filters.dateRange.to)
      ) {
        return false;
      }
    }

    // Rating filter
    if (filters.minRating > 0) {
      const bookRating = calculateAverageRating(book);
      if (bookRating < filters.minRating) {
        return false;
      }
    }

    // Format filter
    if (
      filters.formats.length > 0 &&
      !filters.formats.some((format) => book.formats.includes(format))
    ) {
      return false;
    }

    // Length filter
    if (filters.lengths.length > 0) {
      const bookLength = getBookLength(book.pageCount);
      if (!filters.lengths.includes(bookLength)) {
        return false;
      }
    }

    return true;
  });

  // Sort filtered books
  const sortedBooks = [...(filteredBooks || [])].sort((a, b) => {
    switch (filters.sortBy) {
      case "rating":
        return calculateAverageRating(b) - calculateAverageRating(a);
      case "newest":
        return (
          new Date(b.publishedDate || 0).getTime() -
          new Date(a.publishedDate || 0).getTime()
        );
      case "oldest":
        return (
          new Date(a.publishedDate || 0).getTime() -
          new Date(b.publishedDate || 0).getTime()
        );
      case "length":
        return (b.pageCount || 0) - (a.pageCount || 0);
      case "popularity":
        return (b.impressionCount || 0) - (a.impressionCount || 0);
      default:
        return 0;
    }
  });

  function getBookLength(pageCount: number | null): "short" | "novella" | "novel" | "epic" {
    if (!pageCount) return "novel";
    if (pageCount < 100) return "short";
    if (pageCount < 200) return "novella";
    if (pageCount < 400) return "novel";
    return "epic";
  }

  return (
    <div className="flex">
      <FilterSidebar genres={allGenres} onFilterChange={setFilters} />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Search Results for "{query}"</h1>
        
        {/* Content filtering alert */}
        {!isLoading && !isError && searchResults?.metadata.filtered && (
          <Alert className="mb-6 bg-muted border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
            <AlertDescription className="flex items-center">
              <span className="ml-2">
                Some content ({searchResults.metadata.originalTotal! - searchResults.metadata.total} items) has been filtered out based on your content block settings.
                {' '}
                <a href="/settings/content-filters" className="text-primary hover:underline">
                  Manage filters
                </a>
              </span>
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-[400px] rounded-lg" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center text-red-500">
            There was an error fetching the results.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedBooks.map((book) => (
              <BookGridCard key={book.id} book={book} />
            ))}
          </div>
        )}
        {!isLoading && !isError && sortedBooks?.length === 0 && (
          <div className="text-center text-muted-foreground mt-8 p-8 border rounded-lg bg-muted/20">
            <p className="mb-2 text-lg font-medium">No books found matching your search and filters.</p>
            {searchResults?.metadata.filtered && (
              <p className="text-sm text-muted-foreground">
                Note: Some content has been filtered due to your content block settings.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}