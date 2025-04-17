import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProLayout } from "@/components/pro-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookReviewManagement } from "@/components/book-review-management";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Search } from "lucide-react";
import { Book, Rating } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProReviewsPage() {
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

  // Fetch author's books
  const { data: books, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
  });

  // Filter books based on search query
  useEffect(() => {
    if (!books) return;
    
    if (!searchQuery.trim()) {
      setFilteredBooks(books);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = books.filter(book => 
      book.title.toLowerCase().includes(query)
    );
    
    setFilteredBooks(filtered);
  }, [searchQuery, books]);

  // Set the first book as selected when books are loaded
  useEffect(() => {
    if (books && books.length > 0 && !selectedBookId) {
      setSelectedBookId(books[0].id);
    }
  }, [books, selectedBookId]);

  // Function to get the mini image URL for a book
  const getBookMiniImage = (book: Book) => {
    const miniImage = book.images?.find(img => img.imageType === "mini");
    if (miniImage) return miniImage.imageUrl;
    
    // Fallback to other image types if mini isn't available
    const fallbackTypes = ["book-card", "grid-item", "book-detail"];
    for (const type of fallbackTypes) {
      const image = book.images?.find(img => img.imageType === type);
      if (image) return image.imageUrl;
    }
    
    return "/images/placeholder-book.png";
  };

  return (
    <ProLayout>
      <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Review Management</h1>
          
          {/* Search Bar */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search books..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Book Carousel */}
        <Card>
          <CardContent className="pt-6">
            {isLoadingBooks ? (
              <div className="flex gap-4 overflow-x-auto py-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-20">
                    <Skeleton className="w-16 h-24 rounded" />
                    <Skeleton className="w-16 h-4 mt-2" />
                  </div>
                ))}
              </div>
            ) : (
              <Carousel
                opts={{
                  align: "start",
                  dragFree: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {filteredBooks.map((book) => (
                    <CarouselItem key={book.id} className="basis-auto flex-shrink-0 ml-1 mr-4">
                      <div 
                        className={`flex flex-col items-center cursor-pointer transition-all ${
                          selectedBookId === book.id 
                            ? "scale-105 shadow-[0_0_15px_-3px_var(--tertiary)]" 
                            : "hover:scale-105"
                        }`}
                        onClick={() => setSelectedBookId(book.id)}
                      >
                        <div 
                          className={`w-16 h-24 rounded overflow-hidden shadow-sm ${
                            selectedBookId === book.id 
                              ? "border-2 border-tertiary" 
                              : ""
                          }`}
                        >
                          <img
                            src={getBookMiniImage(book)}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs mt-1 w-16 text-center truncate" title={book.title}>
                          {book.title}
                        </p>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0" />
                <CarouselNext className="right-0" />
              </Carousel>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section */}
        {selectedBookId && (
          <BookReviewManagement bookId={selectedBookId} />
        )}
      </div>
    </ProLayout>
  );
}