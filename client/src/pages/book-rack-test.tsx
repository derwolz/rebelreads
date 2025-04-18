import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookRack } from "@/components/book-rack";
import { Book } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookRackTestPage() {
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Book Rack Test</h1>
      <p className="mb-6 text-muted-foreground">
        This page demonstrates the BookRack component with leaning book spines, hover effects, and card previews.
      </p>
      
      {/* Book Rack Component */}
      <BookRack 
        title="Featured Books" 
        books={books} 
        isLoading={isLoading || !books}
      />
      
      {/* Skeleton loading state */}
      {(isLoading || !books) && (
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      )}
    </div>
  );
}