import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { Book } from "@shared/schema";

interface RatingsProps {
  books: Book[] | undefined;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBookIds: number[];
  handleBookSelect: (bookId: number) => void;
  searchResults: Book[] | null;
  handleSearch: () => void;
}

export function Ratings({
  books,
  searchQuery,
  setSearchQuery,
  selectedBookIds,
  handleBookSelect,
  searchResults,
  handleSearch
}: RatingsProps) {
  return (
    <div className="space-y-6">
      {/* Book search for ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Book Ratings Search</CardTitle>
          <CardDescription>
            Find ratings and reviews for your books
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
            <Input 
              type="text" 
              placeholder="Search your books..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {(searchResults || books)?.map((book) => (
              <Button
                key={book.id}
                variant={
                  selectedBookIds.includes(book.id) ? "default" : "outline"
                }
                onClick={() => handleBookSelect(book.id)}
                className="text-sm"
              >
                {book.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Ratings results */}
      {selectedBookIds.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Rating Details</CardTitle>
              <CardDescription>
                Detailed information about book ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-6 text-center">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Coming Soon</h3>
                  <p className="text-muted-foreground">
                    This feature will display detailed rating insights for your books.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center p-6 text-center">
              <p className="text-muted-foreground">
                Select a book to view its ratings
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}