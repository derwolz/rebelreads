import { useState, useEffect } from "react";
import { Book } from "../types";
import { useQuery } from "@tanstack/react-query";
import { Note } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// No mock data - we'll show empty states instead

interface BookShelfShareProps {
  username: string;
  shelfName: string;
  className?: string;
}

export function BookShelfShare({ username, shelfName, className }: BookShelfShareProps) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const { toast } = useToast();

  // Define the correct response type
  interface ShelfData {
    shelf: any;
    books: Array<{
      id: number;
      bookId: number;
      shelfId: number;
      rank: number;
      addedAt: string;
      book: Book;
    }>;
    bookNotes: Note[];
    shelfNotes: Note[];
  }

  // Fetch the shelf and its books with robust parameter encoding
  // IMPORTANT: The server expects 'shelfname' (all lowercase) as the parameter name
  const { data: shelfData, isLoading: isShelfLoading } = useQuery<ShelfData>({
    queryKey: [`/api/book-shelf?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelfName)}`],
  });

  // Get the books from the shelf data with safety check for undefined
  const books = shelfData?.books 
    ? shelfData.books.map(item => item.book) 
    : [];
    
  // Log error if shelfData is undefined but username and shelfName are provided
  useEffect(() => {
    if (!isShelfLoading && !shelfData && username && shelfName) {
      console.error("Failed to load shelf data for:", {
        username,
        shelfName,
        encodedUsername: encodeURIComponent(username),
        encodedShelfName: encodeURIComponent(shelfName)
      });
      
      // Do not use mock data - display empty state instead
    }
  }, [isShelfLoading, shelfData, username, shelfName]);

  // Select the first book by default when data loads
  useEffect(() => {
    if (books.length > 0 && !selectedBook) {
      setSelectedBook(books[0]);
    }
  }, [books, selectedBook]);

  // Fetch taxonomies (genres, themes) for the selected book
  const { data: taxonomies } = useQuery<any[]>({
    queryKey: selectedBook ? [`/api/books/${selectedBook.id}/taxonomies`] : ["null-taxonomies"],
    enabled: !!selectedBook,
  });

  // Get taxonomies to display (will be empty if API fails)
  const displayTaxonomies = taxonomies || [];

  return (
    <div className={className}>
      {isShelfLoading ? (
        // Loading state
        <div className="flex items-center justify-center h-60 bg-zinc-800 rounded">
          <div className="animate-pulse text-zinc-500">Loading...</div>
        </div>
      ) : selectedBook ? (
        // Book details view when there's data
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left: Book Cover */}
          <div className="w-full md:w-1/3">
            {selectedBook.images?.find(img => img.imageType === "book-detail")?.imageUrl ? (
              <img 
                src={selectedBook.images.find(img => img.imageType === "book-detail")?.imageUrl} 
                alt={selectedBook.title} 
                className="w-full h-auto rounded" 
              />
            ) : (
              <div className="w-full h-full aspect-[2/3] bg-zinc-800 rounded flex items-center justify-center">
                <span className="text-zinc-500">No image available</span>
              </div>
            )}
          </div>
          
          {/* Right: Book details */}
          <div className="w-full md:w-2/3">
            {/* Title and author */}
            <h2 className="text-xl font-bold text-white mb-1">{selectedBook.title}</h2>
            <p className="text-zinc-300 mb-4">by {selectedBook.authorName}</p>
            
            {/* Description */}
            <p className="text-sm text-zinc-300 mb-4">{selectedBook.description}</p>
            
            {/* Genres & Themes */}
            <div className="mb-4">
              <p className="text-xs mb-2 text-zinc-400">Genres & Themes</p>
              <div className="flex flex-wrap gap-1">
                {displayTaxonomies.map((taxonomy, idx) => (
                  <Badge 
                    key={idx} 
                    className={`
                      text-xs py-1 px-3 rounded-full
                      ${taxonomy.type === 'genre' ? 'bg-purple-600 text-white' : ''}
                      ${taxonomy.type === 'subgenre' ? 'bg-blue-600 text-white' : ''}
                      ${taxonomy.type === 'theme' ? 'bg-zinc-800 text-white border border-zinc-600' : ''}
                      ${taxonomy.type === 'trope' ? 'bg-zinc-800 text-white border border-zinc-600' : ''}
                    `}
                  >
                    {taxonomy.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Empty state when no books are found
        <div className="flex flex-col items-center justify-center p-8 h-60 bg-zinc-800 rounded">
          <p className="text-zinc-400 mb-2">No books found in this shelf</p>
          <p className="text-zinc-500 text-sm">Either the shelf is empty or you don't have permission to view this content</p>
        </div>
      )}
    </div>
  );
}