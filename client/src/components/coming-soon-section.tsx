import { useQuery } from "@tanstack/react-query";
import type { Book } from "../types"; // Import from client types instead of shared schema
import { BookCarousel } from "./book-carousel";

interface ComingSoonSectionProps {
  title?: string;
  limit?: number;
}

export function ComingSoonSection({ 
  title = "Coming Soon", 
  limit = 10 
}: ComingSoonSectionProps) {
  // Fetch coming soon books from the API
  const { data: comingSoonBooks, isLoading, error } = useQuery<Book[]>({
    queryKey: [`/api/coming-soon?limit=${limit}`],
    onSettled: (data, error) => {
      if (data) {
        console.log("Coming soon books data:", data);
      }
      if (error) {
        console.error("Error fetching coming soon books:", error);
      }
    }
  });

  // Log debugging info
  console.log("Coming soon section:", { comingSoonBooks, isLoading, error });

  if (isLoading) {
    console.log("Coming soon section is loading");
    return (
      <div className="space-y-2">
        <BookCarousel title={title} isLoading={true} books={[]} />
      </div>
    );
  }

  // If no books with future publication dates, don't show the section
  if (!comingSoonBooks || (Array.isArray(comingSoonBooks) && comingSoonBooks.length === 0)) {
    console.log("No coming soon books available");
    return null;
  }

  // Show books with their publication dates
  const books = Array.isArray(comingSoonBooks) ? comingSoonBooks : [];
  console.log("Displaying coming soon books:", books.length);
  return (
    <div className="space-y-2">
      <BookCarousel
        title={title}
        books={books}
        isLoading={isLoading}
        showPublishedDate={true}
      />
    </div>
  );
}