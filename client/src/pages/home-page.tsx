import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { MainNav } from "@/components/main-nav";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { BookCarousel } from "@/components/book-carousel";

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
        {user && followedAuthorsBooks && followedAuthorsBooks.length > 0 && (
          <BookCarousel
            title="From Authors You Follow"
            books={followedAuthorsBooks}
            isLoading={isLoadingFollowed}
          />
        )}

        <BookCarousel
          title="Popular Books"
          books={filteredBooks}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}