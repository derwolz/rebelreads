import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { BookReviewManagement } from "@/components/book-review-management";
import { apiRequest } from "@/lib/queryClient";
import { ProLayout } from "@/components/pro-layout";
import { Search } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface Book {
  id: number;
  title: string;
  author: string;
  coverImageUrl: string;
  authorId: number;
}

export default function ProReviewsPage() {
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: authorBooks, isLoading, isError, error } = useQuery({
    queryKey: ["/api/pro/reviews"],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/pro/reviews", {
          method: "GET"
        }) as any;
        
        // Extract unique books from reviews
        const booksMap = new Map<number, Book>();
        
        if (response && response.reviews) {
          response.reviews.forEach((review: any) => {
            if (review.book && !booksMap.has(review.bookId)) {
              booksMap.set(review.bookId, {
                id: review.bookId,
                title: review.book.title,
                author: review.book.author,
                coverImageUrl: review.book.coverImageUrl,
                authorId: review.authorId
              });
            }
          });
        }
        
        return Array.from(booksMap.values());
      } catch (err) {
        console.error("Error fetching pro reviews:", err);
        // Fall back to alternative method: get author books directly
        const myBooks = await apiRequest("/api/my-books", {
          method: "GET"
        }) as any;
        
        return myBooks.map((book: any) => ({
          id: book.id,
          title: book.title,
          author: book.authorName || "Unknown",
          coverImageUrl: book.coverImageUrl || book.images?.find((img: any) => img.imageType === "mini")?.imageUrl,
          authorId: book.authorId
        }));
      }
    },
  } as any);

  // Set the first book as selected when data loads
  useEffect(() => {
    if (authorBooks && authorBooks.length > 0 && !selectedBookId) {
      setSelectedBookId(authorBooks[0].id);
    }
  }, [authorBooks, selectedBookId]);

  // Filter books based on search query
  const filteredBooks = authorBooks?.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getBookMiniImage = (book: Book) => {
    // Return mini image or default book cover
    return book.coverImageUrl || "/images/default-book-cover.png";
  };

  if (isLoading) {
    return (
      <ProLayout>
        <div className="p-4 md:p-8 space-y-8">
          <h1 className="text-3xl font-bold">Book Reviews</h1>
          <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full max-w-sm" />
            <div className="flex gap-4 overflow-x-auto py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-32 flex-shrink-0 rounded-md" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </ProLayout>
    );
  }

  if (isError) {
    return (
      <ProLayout>
        <div className="p-4 md:p-8 space-y-8">
          <h1 className="text-3xl font-bold">Book Reviews</h1>
          <div className="rounded-md bg-destructive/15 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">Error loading your books</h3>
                <div className="mt-2 text-sm text-destructive/80">
                  <p>{(error as Error)?.message || "An unknown error occurred. Please try again later."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProLayout>
    );
  }

  return (
    <ProLayout>
      <div className="p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Book Reviews</h1>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Book selection carousel */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Your Books</h2>
            
            {filteredBooks.length > 0 ? (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-4 pb-4">
                  {filteredBooks.map((book) => (
                    <Card 
                      key={book.id} 
                      className={`w-[125px] flex-shrink-0 cursor-pointer transition-all ${
                        selectedBookId === book.id 
                          ? 'ring-2 ring-amber-500 shadow-md' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedBookId(book.id)}
                    >
                      <CardContent className="p-2 flex flex-col items-center">
                        <div className="w-20 h-28 mb-2 overflow-hidden rounded-sm">
                          <img
                            src={getBookMiniImage(book)}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="w-full text-center">
                          <p className="text-sm font-medium truncate">{book.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                {searchQuery ? (
                  <p>No books found matching "{searchQuery}"</p>
                ) : (
                  <p>You don't have any books with reviews yet</p>
                )}
              </div>
            )}
          </div>

          {/* Reviews for selected book */}
          {selectedBookId ? (
            <BookReviewManagement bookId={selectedBookId} />
          ) : (
            <div className="bg-muted rounded-lg p-6 text-center">
              <p>Select a book to view its reviews</p>
            </div>
          )}
        </div>
      </div>
    </ProLayout>
  );
}