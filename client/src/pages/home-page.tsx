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
import { HeroBannerAd, VerticalBannerAd, HorizontalBannerAd } from "@/components/banner-ads";

export default function HomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("title");

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Get personalized recommendations if user is logged in
  const { data: recommendedBooks, isLoading: isLoadingRecommended } = useQuery<Book[]>({
    queryKey: ["/api/recommendations"],
    enabled: !!user,
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

  // Get featured book for hero ad if available
  const featuredBook = books?.find(book => book.promoted === true) || 
                      (books && books.length > 0 ? books[0] : null);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Hero Carousel for Promoted Books */}
      <HeroCarousel />

      {/* Hero Banner Ad */}
      {featuredBook && (
        <div className="my-8">
          <HeroBannerAd
            campaignId={1}
            bookId={featuredBook.id}
            imageSrc={featuredBook.coverUrl}
            title={featuredBook.title}
            description={featuredBook.description?.substring(0, 120) + '...'}
            ctaText="Discover Now"
            source="home"
          />
        </div>
      )}

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
                      className="md:basis-1/3 lg:basis-1/4 pl-0 pr-1 pb-40"
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
          {/* Recommended Books Carousel */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">
              {user ? "Recommended for You" : "Popular Books"}
            </h2>
            <Carousel className="w-full">
              <CarouselContent>
                {user && isLoadingRecommended
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <CarouselItem key={i} className="md:basis-1/3 lg:basis-1/4">
                        <div className="space-y-3">
                          <div className="h-64 w-full bg-muted rounded-md"></div>
                          <div className="h-4 w-3/4 bg-muted rounded"></div>
                          <div className="h-4 w-1/2 bg-muted rounded"></div>
                        </div>
                      </CarouselItem>
                    ))
                  : (!user || !recommendedBooks || recommendedBooks.length === 0)
                    ? filteredBooks?.map((book) => (
                        <CarouselItem
                          key={book.id}
                          className="md:basis-1/3 lg:basis-1/4 pl-0 pr-1 pb-40"
                        >
                          <BookCard book={book} />
                        </CarouselItem>
                      ))
                    : recommendedBooks.map((book) => (
                        <CarouselItem
                          key={book.id}
                          className="md:basis-1/3 lg:basis-1/4 pl-0 pr-1 pb-40"
                        >
                          <BookCard book={book} />
                        </CarouselItem>
                      ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </section>

          {/* Horizontal Banner Ad */}
          {books && books.length > 2 && (
            <div className="mb-12">
              <HorizontalBannerAd
                campaignId={1}
                bookId={books[2].id}
                imageSrc={books[2].coverUrl}
                title={books[2].title}
                description={books[2].description?.substring(0, 100) + '...'}
                source="home-mid-content"
                position="between-sections"
              />
            </div>
          )}

          {/* All Books Grid */}
          <BookGrid
            title="Explore More Books"
            books={allBooks?.slice(0, 12)} // First 12 books
            isLoading={isLoading}
          />
        </div>

        {/* What's Hot Sidebar - Only visible on large screens */}
        <div className="hidden lg:block space-y-8">
          <WhatsHotSidebar />
          
          {/* Vertical Banner Ad in Sidebar */}
          {books && books.length > 1 && (
            <VerticalBannerAd
              campaignId={1}
              bookId={books[1].id}
              imageSrc={books[1].coverUrl}
              title={books[1].title}
              description={books[1].description?.substring(0, 80) + '...'}
              source="home-sidebar"
            />
          )}
        </div>
      </div>
    </main>
  );
}