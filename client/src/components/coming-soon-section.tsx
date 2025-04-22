import { useQuery } from "@tanstack/react-query";
import type { Book } from "../types"; // Import from client types instead of shared schema
import { BookCarousel } from "./book-carousel";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";

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
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {title}
          <Badge variant="outline" className="ml-2 py-1">
            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
            Future Releases
          </Badge>
        </h2>
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
      <h2 className="text-2xl font-bold flex items-center gap-2">
        {title}
        <Badge variant="outline" className="ml-2 py-1">
          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
          Future Releases
        </Badge>
      </h2>
      <BookCarousel
        title={title}
        books={comingSoonBooks}
        isLoading={isLoading}
        showPublishedDate={true}
      />
    </div>
  );
}