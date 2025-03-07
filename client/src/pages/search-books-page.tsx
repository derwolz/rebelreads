import { useQuery } from "@tanstack/react-query";
import { BookGridCard } from "@/components/book-grid-card";
import { Book } from "@shared/schema";
import { FilterSidebar, type BookFilters } from "@/components/filter-sidebar";
import { useState } from "react";
import { format } from "date-fns";

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
  } = useQuery<{ books: Book[] }>({
    queryKey: ["/api/search/books", query],
    queryFn: () =>
      fetch(`/api/search/books?q=${query}`).then((response) => response.json()),
    enabled: true,
  });

  // Get unique genres from all books
  const allGenres = Array.from(
    new Set(searchResults?.books.flatMap((book) => book.genres) || [])
  ).sort();

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
      const bookRating =
        book.ratings.reduce((acc, r) => acc + r.overall, 0) /
          book.ratings.length || 0;
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

    // Sale status filter
    if (filters.onSale && !book.onSale) {
      return false;
    }

    return true;
  });

  // Sort filtered books
  const sortedBooks = [...(filteredBooks || [])].sort((a, b) => {
    switch (filters.sortBy) {
      case "rating":
        const aRating =
          a.ratings.reduce((acc, r) => acc + r.overall, 0) / a.ratings.length ||
          0;
        const bRating =
          b.ratings.reduce((acc, r) => acc + r.overall, 0) / b.ratings.length ||
          0;
        return bRating - aRating;
      case "newest":
        return (
          new Date(b.publishedDate).getTime() -
          new Date(a.publishedDate).getTime()
        );
      case "oldest":
        return (
          new Date(a.publishedDate).getTime() -
          new Date(b.publishedDate).getTime()
        );
      case "length":
        return (b.pageCount || 0) - (a.pageCount || 0);
      case "popularity":
        return (b.views || 0) - (a.views || 0);
      case "price":
        return (b.price || 0) - (a.price || 0);
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
        {sortedBooks?.length === 0 && (
          <div className="text-center text-muted-foreground">
            No books found matching your search and filters.
          </div>
        )}
      </div>
    </div>
  );
}