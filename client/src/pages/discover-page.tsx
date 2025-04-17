import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Book } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { BookGridCard } from "@/components/book-grid-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Type for page parameters
type DiscoverPageParams = {
  type?: string;
  id?: string;
};

export default function DiscoverPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const params = useParams<DiscoverPageParams>();
  const [page, setPage] = useState(1);
  const [loadedBooks, setLoadedBooks] = useState<Book[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Extract the type from URL path
  const type = params.type || "general";
  const id = params.id;
  
  // Construct the endpoint based on the URL path
  const getEndpoint = () => {
    // Path segments: /discover/{type}/{id?}
    switch (type) {
      case "followed-authors":
        return "/api/recommendations/followed-authors?limit=150";
      case "wishlist":
        return "/api/recommendations/wishlist?limit=150";
      case "reviewed":
        return "/api/recommendations/reviewed?limit=150";
      case "completed":
        return "/api/recommendations/completed?limit=150";
      case "popular":
        return "/api/books?sort=popularity&limit=150";
      case "recommendations":
        return "/api/recommendations?limit=150";
      case "to-review":
        return "/api/books/to-review?limit=150";
      case "genre":
        return id ? `/api/genres/view/${id}?limit=150` : "/api/books?limit=150";
      default:
        return "/api/books?limit=150";
    }
  };

  // Get a user-friendly title based on the URL path
  const getTitle = () => {
    switch (type) {
      case "followed-authors":
        return "Books from Authors You Follow";
      case "wishlist":
        return "Your Wishlist";
      case "reviewed":
        return "Your Reviewed Books";
      case "completed":
        return "Your Completed Books";
      case "popular":
        return "Popular Books";
      case "recommendations":
        return "Recommended for You";
      case "to-review":
        return "Books to Review";
      case "genre":
        return genreViewName || "Genre Books";
      default:
        return "Discover Books";
    }
  };

  // Get the genre view name if applicable
  const { data: genreView } = useQuery({
    queryKey: ["/api/genres/view-info", id],
    queryFn: async () => {
      if (type === "genre" && id) {
        const response = await fetch(`/api/genres/view-info/${id}`);
        if (!response.ok) throw new Error("Failed to load genre view");
        return response.json();
      }
      return null;
    },
    enabled: type === "genre" && !!id,
  });

  const genreViewName = genreView?.name;

  // Fetch books data
  const {
    data: fetchedBooks,
    isLoading,
    isError,
  } = useQuery<Book[]>({
    queryKey: [getEndpoint()],
    enabled: true,
  });

  // Initialize loadedBooks when data is first fetched
  useEffect(() => {
    if (fetchedBooks && fetchedBooks.length > 0) {
      // Load the first 20 books immediately
      setLoadedBooks(fetchedBooks.slice(0, 20));
      setHasMore(fetchedBooks.length > 20);
    }
  }, [fetchedBooks]);

  // Function to load more books
  const loadMoreBooks = () => {
    if (!fetchedBooks || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Calculate next page of books
    const nextPage = page + 1;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const nextBooks = fetchedBooks.slice(startIndex, endIndex);
    
    // Add new books to loaded books
    if (nextBooks.length > 0) {
      setTimeout(() => {
        setLoadedBooks(prev => [...prev, ...nextBooks]);
        setPage(nextPage);
        setIsLoadingMore(false);
        
        // Check if we have more books to load
        setHasMore(endIndex < fetchedBooks.length);
      }, 500); // Small delay for a smoother experience
    } else {
      setIsLoadingMore(false);
      setHasMore(false);
    }
  };

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreBooks();
        }
      },
      { threshold: 0.1 }
    );
    
    const loadMoreElement = document.getElementById("load-more-trigger");
    if (loadMoreElement) {
      observer.observe(loadMoreElement);
    }
    
    return () => {
      if (loadMoreElement) {
        observer.unobserve(loadMoreElement);
      }
    };
  }, [hasMore, isLoadingMore, loadedBooks]);

  // Redirect to login if user is not authenticated for user-specific sections
  useEffect(() => {
    if (!user && ["followed-authors", "wishlist", "reviewed", "completed", "to-review"].includes(type)) {
      window.location.href = "/login";
    }
  }, [user, type]);

  return (
    <div className="container mx-auto pt-8 pb-16">
      <h1 className="text-4xl font-bold mb-8">{getTitle()}</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <Skeleton className="h-[300px] w-full rounded-md" />
              <Skeleton className="h-6 w-3/4 mt-2" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold text-red-500">Error loading books</h2>
          <p className="text-muted-foreground mt-2">There was an error loading the books. Please try again.</p>
        </div>
      ) : loadedBooks.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold">No books found</h2>
          <p className="text-muted-foreground mt-2">
            There are no books in this category yet.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {loadedBooks.map((book) => (
              <div key={book.id} className="relative">
                <BookGridCard book={book} />
              </div>
            ))}
          </div>

          {/* Load more trigger */}
          <div
            id="load-more-trigger"
            className="w-full h-20 flex items-center justify-center mt-8"
          >
            {isLoadingMore && (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="mt-2 text-muted-foreground">Loading more books...</span>
              </div>
            )}
            {!isLoadingMore && hasMore && (
              <Button onClick={loadMoreBooks} variant="outline">
                Load More Books
              </Button>
            )}
            {!hasMore && loadedBooks.length > 10 && (
              <p className="text-muted-foreground">You've reached the end of the list.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}