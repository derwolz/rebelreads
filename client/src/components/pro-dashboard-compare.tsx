import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { Book } from "@shared/schema";

interface PerformanceCompareProps {
  books: Book[] | undefined;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBookIds: number[];
  handleBookSelect: (bookId: number) => void;
  searchResults: Book[] | null;
  handleSearch: () => void;
}

export function PerformanceCompare({
  books,
  searchQuery,
  setSearchQuery,
  selectedBookIds,
  handleBookSelect,
  searchResults,
  handleSearch
}: PerformanceCompareProps) {
  return (
    <div className="space-y-6">
      {/* Book search for comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Book Search for Comparison</CardTitle>
          <CardDescription>
            Select books to compare with similar titles
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
      
      {/* Compare results panel */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Comparison Results</CardTitle>
            <CardDescription>
              Compare your books with similar titles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
              <p className="text-sm text-muted-foreground mb-2">
                This feature will help you understand how your books perform compared to similar titles in the market.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}