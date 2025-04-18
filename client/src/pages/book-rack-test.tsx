import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { BookRack } from "@/components/book-rack";

export function BookRackTestPage() {
  // Fetch a list of books to display in the rack
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ['/api/popular-books'],
    queryFn: async () => {
      const response = await fetch('/api/popular-books');
      if (!response.ok) throw new Error('Failed to fetch popular books');
      
      // The API returns book IDs, so we need to fetch the actual book data
      const popularBooks = await response.json();
      
      // Map the popular books to their actual book data
      const bookPromises = popularBooks.map(async (popularBook: any) => {
        const bookResponse = await fetch(`/api/books/${popularBook.bookId}`);
        if (!bookResponse.ok) throw new Error(`Failed to fetch book ${popularBook.bookId}`);
        return bookResponse.json();
      });
      
      return Promise.all(bookPromises);
    },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Book Rack Test</h1>
      
      {/* Description of what the book rack does */}
      <div className="mb-8 p-4 bg-muted/20 rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">About Book Rack Component</h2>
        <p className="mb-2">
          This component displays books as spines on a shelf, as if you're looking at them on a bookshelf.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Books have a 92% chance to stand straight (0° rotation)</li>
          <li>Books have a 2% chance for each lean angle: slight left (-5°), moderate left (-10°), slight right (5°), moderate right (10°)</li>
          <li>If a book is leaning, its neighbors must stand straight</li>
          <li>The lean angles and positions are calculated automatically</li>
        </ul>
      </div>
      
      {/* Display the book rack */}
      <BookRack
        title="Featured Books"
        books={books}
        isLoading={isLoading}
      />
      
      {/* Simplified version with just a single book repeated */}
      {!isLoading && books && books.length > 0 && (
        <BookRack
          title="Single Book Example (Repeated)"
          books={Array(10).fill(null).map((_, i) => ({
            ...books[0],
            id: books[0].id + 1000 + i // Create unique IDs for repeated books
          }))}
          isLoading={false}
        />
      )}
    </div>
  );
}