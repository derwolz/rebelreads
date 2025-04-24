import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Book } from "../types";
import { BookSpineA, BookSpineB, LEAN_OPTIONS } from "@/components/book-spine";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Book spine test page
export default function BookSpineTest() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Fetch books for testing
  const { data: books } = useQuery<Book[]>({
    queryKey: ['/api/genres/view/2'],
  });

  // Simulate loading state for 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Assign random angles to books
  const bookAngles = React.useMemo(() => {
    if (!books || books.length === 0) return [];
    
    return books.map(() => {
      const randomIndex = Math.floor(Math.random() * LEAN_OPTIONS.length);
      return LEAN_OPTIONS[randomIndex].angle;
    });
  }, [books]);

  // Handle book click
  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
  };

  if (isLoading || !books) {
    return (
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Book Spine Test</h1>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Book Spine Test</h1>
      <p className="mb-6 text-muted-foreground">
        This page demonstrates the two BookSpine component variants with hover effects and styling.
      </p>
      
      <Tabs defaultValue="a" className="mb-8">
        <TabsList>
          <TabsTrigger value="a">BookSpine A</TabsTrigger>
          <TabsTrigger value="b">BookSpine B</TabsTrigger>
        </TabsList>
        
        <TabsContent value="a" className="p-4">
          <h2 className="text-2xl font-bold mb-4">BookSpine A</h2>
          <p className="mb-4 text-muted-foreground">
            Features colored trim and a featured badge for promoted books.
          </p>
          
          <div className="bg-muted/10 h-[300px] flex items-end p-4 mb-4 overflow-x-auto">
            <div className="flex items-end gap-1">
              {books.map((book, index) => (
                <BookSpineA 
                  key={`spine-a-${book.id}`}
                  book={book}
                  angle={bookAngles[index] || 0}
                  index={index}
                  onClick={handleBookClick}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-foreground bg-gradient-to-b from-foreground to-background w-full h-3 mb-8"></div>
        </TabsContent>
        
        <TabsContent value="b" className="p-4">
          <h2 className="text-2xl font-bold mb-4">BookSpine B</h2>
          <p className="mb-4 text-muted-foreground">
            Features rating indicator and glow effect on hover.
          </p>
          
          <div className="bg-muted/10 h-[300px] flex items-end p-4 mb-4 overflow-x-auto">
            <div className="flex items-end gap-1">
              {books.map((book, index) => (
                <BookSpineB
                  key={`spine-b-${book.id}`}
                  book={book}
                  angle={bookAngles[index] || 0}
                  index={index}
                  onClick={handleBookClick}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-foreground bg-gradient-to-b from-foreground to-background w-full h-3 mb-8"></div>
        </TabsContent>
      </Tabs>
      
      {/* Selected book details */}
      {selectedBook && (
        <div className="mt-8 p-6 bg-muted/20 rounded-lg">
          <h3 className="text-xl font-bold">{selectedBook.title}</h3>
          <p className="text-sm text-muted-foreground">
            {selectedBook.authorName || "Unknown Author"}
          </p>
          <p className="mt-4">{selectedBook.description}</p>
        </div>
      )}
    </div>
  );
}