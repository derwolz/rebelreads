import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Book } from "../types"; // Import from client types instead of shared schema
import { useAuth } from "@/hooks/use-auth";
import { BookCarousel } from "./book-carousel";
import { BookGrid } from "./book-grid";
import { BookRack } from "./book-rack";
import { useWindowSize } from "@/hooks/use-window-size";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

// Define the HomepageSection interface based on what's in the schema
interface HomepageSection {
  id: string;
  type: string;
  displayMode: "carousel" | "grid" | "book_rack";
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
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  
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
    case "coming_soon":
      // Get books with future publication dates
      endpoint = `/api/coming-soon?limit=${section.itemCount}`;
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
  
  // Filter out books with release dates after today (future releases)
  const filterOutFutureReleases = (books?: Book[]) => {
    if (!books) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of today
    
    return books.filter(book => {
      // If no published date, assume it's already published
      if (!book.publishedDate) return true;
      
      // Convert the published date string to a Date object
      const publishedDate = new Date(book.publishedDate);
      publishedDate.setHours(0, 0, 0, 0); // Set to beginning of published date
      
      // Keep book if published date is today or earlier
      return publishedDate <= today;
    });
  };
  
  // For sections that need additional filtering
  let displayBooks = [];
  
  // For coming_soon section, we want to show future releases, not filter them out
  if (section.type === "coming_soon") {
    displayBooks = books || [];
    // Sort by publishedDate for coming soon section
    if (displayBooks.length > 0) {
      displayBooks.sort((a, b) => {
        if (!a.publishedDate) return 1;
        if (!b.publishedDate) return -1;
        return new Date(a.publishedDate).getTime() - new Date(b.publishedDate).getTime();
      });
    }
  } else {
    // For all other sections, filter out future releases
    displayBooks = books ? filterOutFutureReleases(books) : [];
  }
  
  if (section.type === "popular" && displayBooks.length > 0) {
    // Sort by impressions or some popularity metric
    displayBooks = [...displayBooks].sort((a, b) => 
      (b.impressionCount || 0) - (a.impressionCount || 0)
    ).slice(0, section.itemCount);
  } else if (section.type === "unreviewed" && displayBooks.length > 0 && user) {
    // Filter for books that haven't been reviewed by the user
    // This is a placeholder and would need to be implemented properly
    displayBooks = displayBooks.slice(0, section.itemCount);
  }
  
  // Define what happens when "Discover More" is clicked
  const handleDiscoverMore = () => {
    let searchPath = '';
    
    switch (section.type) {
      case "authors_you_follow":
        searchPath = '/discover/followed-authors';
        break;
      case "wishlist":
        searchPath = '/discover/wishlist';
        break;
      case "reviewed":
        searchPath = '/discover/reviewed';
        break;
      case "completed":
        searchPath = '/discover/completed';
        break;
      case "popular":
        searchPath = '/discover/popular';
        break;
      case "you_may_also_like":
        searchPath = '/discover/recommendations';
        break;
      case "unreviewed":
        searchPath = '/discover/to-review';
        break;
      case "coming_soon":
        searchPath = '/discover/coming-soon';
        break;
      case "custom_genre_view":
        // For genre views, include the view ID
        searchPath = section.customViewId 
          ? `/discover/genre/${section.customViewId}` 
          : '/discover';
        break;
      default:
        searchPath = '/discover';
    }
    
    navigate(searchPath);
  };
  
  // Get window size for book_rack calculations
  const { width: windowWidth } = useWindowSize();
  
  // For book_rack, calculate how many books we can fit
  // First, calculate available spines based on window width divided by spine width (56px)
  // Then reduce to 80% to leave some empty space, and ensure it's not more than 1000
  let bookRackCount = section.itemCount;
  if (section.displayMode === "book_rack" && windowWidth > 0) {
    // Calculate based on windowWidth / 56 (spine width)
    const maxSpines = Math.floor(windowWidth / 56);
    // Take 80% and ensure it's not more than 1000
    bookRackCount = Math.min(Math.floor(maxSpines * 0.8), 1000);
    
    // Ensure we're requesting the correct number of books if the endpoint supports it
    if (endpoint.includes('?count=')) {
      endpoint = endpoint.replace(/count=\d+/, `count=${bookRackCount}`);
    } else if (endpoint.includes('?')) {
      endpoint += `&count=${bookRackCount}`;
    } else {
      endpoint += `?count=${bookRackCount}`;
    }
  }
  
  // Add book discovery button component that can be used with BookCarousel
  const DiscoverMoreButton = () => (
    <button 
      onClick={handleDiscoverMore}
      className="text-primary hover:underline font-medium flex items-center absolute right-0 top-0 mt-2" 
    >
      Discover More
    </button>
  );

  // Render the section with the appropriate display mode
  // Force carousel mode on mobile devices for all sections
  if (isMobile || section.displayMode === "carousel") {
    return (
      <div className="relative">
        <BookCarousel 
          title={section.title} 
          books={displayBooks} 
          isLoading={isLoading}
          showPublishedDate={section.type === "coming_soon"} // Show published dates for coming soon section
        />
        <DiscoverMoreButton />
      </div>
    );
  } else if (section.displayMode === "book_rack") {
    return (
      <div className="relative">
        <BookRack
          title={section.title}
          books={displayBooks || []}
          isLoading={isLoading}
          className="" // Optional class name
        />
        <DiscoverMoreButton />
      </div>
    );
  } else {
    return (
      <BookGrid 
        title={section.title} 
        books={displayBooks} 
        isLoading={isLoading}
        onDiscoverMore={handleDiscoverMore}
      />
    );
  }
}