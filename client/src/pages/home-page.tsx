import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { BookCard } from "@/components/book-card";
import { MainNav } from "@/components/main-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("title");

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: followedAuthorsBooks, isLoading: isLoadingFollowed } = useQuery<Book[]>({
    queryKey: ["/api/books/followed-authors"],
    enabled: !!user,
  });

  const handleSearch = (query: string, type: string) => {
    setSearchQuery(query);
    if (type) setSearchType(type);
  };

  const filteredBooks = books?.filter((book) => {
    const query = searchQuery.toLowerCase();

    switch (searchType) {
      case "title":
        return book.title.toLowerCase().includes(query);
      case "author":
        return book.author.toLowerCase().includes(query);
      case "genre":
        return book.genres.some(genre => 
          genre.toLowerCase().includes(query)
        );
      default:
        return true;
    }
  }).slice(0, 10); // Limit to 10 books

  return (
    <div>
      <MainNav onSearch={handleSearch} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Popular Books Section */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Popular Books</h2>
            <Carousel className="w-full">
              <CarouselContent>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <CarouselItem key={i} className="basis-full md:basis-1/2">
                      <BookCardSkeleton />
                    </CarouselItem>
                  ))
                ) : (
                  filteredBooks?.map((book) => (
                    <CarouselItem key={book.id} className="basis-full md:basis-1/2">
                      <BookCard book={book} />
                    </CarouselItem>
                  ))
                )}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </section>

          {/* From Authors You Follow Section */}
          {user && followedAuthorsBooks && followedAuthorsBooks.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-6">From Authors You Follow</h2>
              <Carousel className="w-full">
                <CarouselContent>
                  {isLoadingFollowed ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <CarouselItem key={i} className="basis-full md:basis-1/2">
                        <BookCardSkeleton />
                      </CarouselItem>
                    ))
                  ) : (
                    followedAuthorsBooks.slice(0, 10).map((book) => (
                      <CarouselItem key={book.id} className="basis-full md:basis-1/2">
                        <BookCard book={book} />
                      </CarouselItem>
                    ))
                  )}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}