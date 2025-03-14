import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { BookCard } from "@/components/book-card";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { HeroCarousel } from "@/components/hero-carousel";
import { BookGrid } from "@/components/book-grid";
import { WhatsHotSidebar } from "@/components/whats-hot-sidebar";

export default function HomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("title");

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Filter new books (published in the last 7 days)
  const newBooks = books?.filter(book => {
    if (!book.publishedDate) return false;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(book.publishedDate) > oneWeekAgo;
  });

  const { data: followedAuthorsBooks, isLoading: isLoadingFollowed } = useQuery<
    Book[]
  >({
    queryKey: ["/api/books/followed-authors"],
    enabled: !!user,
  });

  const handleSearch = (query: string, type: string) => {
    setSearchQuery(query);
    if (type) setSearchType(type);
  };

  const filteredBooks = books
    ?.filter((book) => {
      const query = searchQuery.toLowerCase();

      switch (searchType) {
        case "title":
          return book.title.toLowerCase().includes(query);
        case "author":
          return book.author.toLowerCase().includes(query);
        case "genre":
          return book.genres.some((genre) =>
            genre.toLowerCase().includes(query),
          );
        default:
          return true;
      }
    })
    .slice(0, 10); // Limit to 10 books for carousel

  // Get all books for grid display
  const allBooks = books?.filter((book) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    switch (searchType) {
      case "title":
        return book.title.toLowerCase().includes(query);
      case "author":
        return book.author.toLowerCase().includes(query);
      case "genre":
        return book.genres.some((genre) =>
          genre.toLowerCase().includes(query),
        );
      default:
        return true;
    }
  });

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Hero Carousel for Promoted Books */}
      <HeroCarousel />

      {/* New Books Section */}
      {newBooks && newBooks.length > 0 && (
        <BookGrid
          title="New Arrivals"
          books={newBooks}
          isLoading={isLoading}
        />
      )}

      {/* What's Hot Section - Horizontal for medium screens */}
      <div className="hidden md:block lg:hidden mb-12">
        <WhatsHotSidebar />
      </div>

      {/* From Authors You Follow Section */}
      {user && followedAuthorsBooks && followedAuthorsBooks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">From Authors You Follow</h2>
          <Carousel className="w-full">
            <CarouselContent>
              {isLoadingFollowed
                ? Array.from({ length: 4 }).map((_, i) => (
                    <CarouselItem
                      key={i}
                      className="md:basis-1/3 lg:basis-1/4"
                    >
                      <div className="space-y-3">
                        <div className="h-64 w-full bg-muted rounded-md"></div>
                        <div className="h-4 w-3/4 bg-muted rounded"></div>
                        <div className="h-4 w-1/2 bg-muted rounded"></div>
                      </div>
                    </CarouselItem>
                  ))
                : followedAuthorsBooks.slice(0, 10).map((book) => (
                    <CarouselItem
                      key={book.id}
                      className="md:basis-1/3 lg:basis-1/4"
                    >
                      <BookCard book={book} />
                    </CarouselItem>
                  ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </section>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {/* Popular Books Carousel */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Popular Books</h2>
            <Carousel className="w-full">
              <CarouselContent>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <CarouselItem key={i} className="md:basis-1/3 lg:basis-1/4">
                        <div className="space-y-3">
                          <div className="h-64 w-full bg-muted rounded-md"></div>
                          <div className="h-4 w-3/4 bg-muted rounded"></div>
                          <div className="h-4 w-1/2 bg-muted rounded"></div>
                        </div>
                      </CarouselItem>
                    ))
                  : filteredBooks?.map((book) => (
                      <CarouselItem
                        key={book.id}
                        className="md:basis-1/3 lg:basis-1/4"
                      >
                        <BookCard book={book} />
                      </CarouselItem>
                    ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </section>

          {/* All Books Grid */}
          <BookGrid
            title="Explore More Books"
            books={allBooks?.slice(0, 12)} // First 12 books
            isLoading={isLoading}
          />
        </div>

        {/* What's Hot Sidebar - Only visible on large screens */}
        <div className="hidden lg:block">
          <WhatsHotSidebar />
        </div>
      </div>
    </main>
  );
}