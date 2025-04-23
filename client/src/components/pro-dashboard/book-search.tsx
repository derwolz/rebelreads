import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import type { Book } from "@shared/schema";

export const METRICS = [
  { id: "impressions", label: "Impressions" },
  { id: "clicks", label: "Clicks" },
  { id: "hovers", label: "Hovers" },
  { id: "ctr", label: "Referrals" },
] as const;

export type MetricType = typeof METRICS[number]["id"];

interface BookSearchProps {
  books: Book[] | undefined;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBookIds: number[];
  handleBookSelect: (bookId: number) => void;
  selectedMetrics: MetricType[];
  handleMetricToggle: (metric: MetricType) => void;
}

export function BookSearch({
  books, 
  searchQuery, 
  setSearchQuery, 
  selectedBookIds, 
  handleBookSelect,
  selectedMetrics,
  handleMetricToggle
}: BookSearchProps) {
  const [searchResults, setSearchResults] = useState<Book[] | null>(null);
  
  // Handle book search
  const handleSearch = () => {
    if (!books) return;
    
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = books.filter(book => 
      book.title.toLowerCase().includes(query)
    );
    
    console.log("searchResults", filtered);
    setSearchResults(filtered);
  };
  
  // Reset search when query is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
    }
  }, [searchQuery]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Search</CardTitle>
        <CardDescription>
          Search for your books to analyze their performance
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
        
        <div className="flex flex-wrap gap-4 mt-4">
          {METRICS.map((metric) => (
            <div key={metric.id} className="flex items-center space-x-2">
              <Checkbox
                id={metric.id}
                checked={selectedMetrics.includes(metric.id)}
                onCheckedChange={() => handleMetricToggle(metric.id)}
              />
              <label
                htmlFor={metric.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {metric.label}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}