import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Book } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { BookCarousel } from "./book-carousel";
import { BookGrid } from "./book-grid";

// Define the HomepageSection interface based on what's in the schema
interface HomepageSection {
  id: string;
  type: string;
  displayMode: "carousel" | "grid";
  title: string;
  itemCount: number;
  customViewId?: number;
  visible: boolean;
}

interface DynamicHomeSectionsProps {
  // Optional manual sections if you want to override the homepage layout
  sections?: HomepageSection[];
}

export function DynamicHomeSections({ sections: manualSections }: DynamicHomeSectionsProps) {
  const { user } = useAuth();
  const [visibleSections, setVisibleSections] = useState<HomepageSection[]>([]);
  
  // Fetch the user's homepage layout
  const { data: layoutSections, isLoading: isLoadingLayout } = useQuery<HomepageSection[]>({
    queryKey: ["/api/homepage-layout"],
    enabled: !!user && !manualSections,
  });
  
  // Set sections based on props or fetched data
  useEffect(() => {
    if (manualSections) {
      setVisibleSections(manualSections);
    } else if (layoutSections) {
      // Filter to only visible sections
      setVisibleSections(layoutSections.filter(section => section.visible));
    }
  }, [layoutSections, manualSections]);
  
  // If no sections are provided or loaded, don't render anything
  if ((!layoutSections && !manualSections) || isLoadingLayout) {
    return null;
  }
  
  return (
    <div className="space-y-12">
      {visibleSections.map((section) => (
        <HomepageSectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}

// Individual section component
function HomepageSectionRenderer({ section }: { section: HomepageSection }) {
  const { user } = useAuth();
  
  // Type guard to check if user is authenticated for certain section types
  if (!user && ["authors_you_follow", "wishlist", "reviewed", "completed"].includes(section.type)) {
    return null;
  }
  
  // Get the appropriate API endpoint for each section type
  let endpoint: string | null = null;
  
  switch (section.type) {
    case "authors_you_follow":
      endpoint = `/api/recommendations/followed-authors?count=${section.itemCount}`;
      break;
    case "wishlist":
      endpoint = `/api/recommendations/wishlist?count=${section.itemCount}`;
      break;
    case "reviewed":
      endpoint = `/api/recommendations/reviewed?count=${section.itemCount}`;
      break;
    case "completed":
      endpoint = `/api/recommendations/completed?count=${section.itemCount}`;
      break;
    case "popular":
      endpoint = "/api/books"; // We'll filter for popularity later
      break;
    case "you_may_also_like":
      endpoint = "/api/recommendations";
      break;
    case "unreviewed":
      // This will need custom filtering based on what books the user hasn't reviewed
      endpoint = "/api/books";
      break;
    case "custom_genre_view":
      // Custom genre views would need another endpoint
      endpoint = section.customViewId 
        ? `/api/genres/view/${section.customViewId}?count=${section.itemCount}` 
        : null;
      break;
    default:
      return null;
  }
  
  // If no endpoint is determined, don't render
  if (!endpoint) {
    return null;
  }
  
  // Fetch books for this section
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: [endpoint],
    enabled: !!endpoint,
  });
  
  // For sections that need additional filtering
  let displayBooks = books;
  
  if (section.type === "popular" && books) {
    // Sort by impressions or some popularity metric
    displayBooks = [...books].sort((a, b) => 
      (b.impressionCount || 0) - (a.impressionCount || 0)
    ).slice(0, section.itemCount);
  } else if (section.type === "unreviewed" && books && user) {
    // Filter for books that haven't been reviewed by the user
    // This is a placeholder and would need to be implemented properly
    displayBooks = books.slice(0, section.itemCount);
  }
  console.log("Display Books:",section.title,displayBooks)
  // Render the section with the appropriate display mode
  return section.displayMode === "carousel" ? (
    <BookCarousel 
      title={section.title} 
      books={displayBooks} 
      isLoading={isLoading} 
    />
  ) : (
    <BookGrid 
      title={section.title} 
      books={displayBooks} 
      isLoading={isLoading} 
    />
  );
}