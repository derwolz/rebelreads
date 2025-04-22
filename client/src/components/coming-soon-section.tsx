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
  const { data: comingSoonBooks, isLoading } = useQuery<Book[]>({
    queryKey: [`/api/coming-soon?limit=${limit}`],
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <BookCarousel title={title} isLoading={true} books={[]} />
      </div>
    );
  }

  // If no books with future publication dates, don't show the section
  if (!comingSoonBooks || comingSoonBooks.length === 0) {
    return null;
  }

  // Show books with their publication dates
  return (
    <div className="space-y-2">
      <BookCarousel
        title={title}
        books={comingSoonBooks}
        isLoading={isLoading}
        showPublishedDate={true}
      />
    </div>
  );
}