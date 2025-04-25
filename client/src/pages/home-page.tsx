import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { HeroCarousel } from "@/components/hero-carousel";
import { BookGrid } from "@/components/book-grid";
import { BookCarousel } from "@/components/book-carousel";
import { WhatsHotSidebar } from "@/components/whats-hot-sidebar";
import { HeroBannerAd, VerticalBannerAd, HorizontalBannerAd } from "@/components/banner-ads";
import { DynamicHomeSections } from "@/components/dynamic-home-sections";
import { ComingSoonSection } from "@/components/coming-soon-section";
import { Book } from "@/types";

// Define the homepage section types for manual layout
interface HomepageSection {
  id: string;
  type: string;
  displayMode: "carousel" | "grid" | "book_rack";
  title: string;
  itemCount: number;
  customViewId?: number;
  visible: boolean;
}

export default function HomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("title");

  // Main book data query
  const { data: booksData, isLoading } = useQuery({
    queryKey: ["/api/books"],
  });
  // Type assertion to convert from server Book to client Book
  const books = booksData as Book[];

  // Get genre-specific book lists
  const { data: fantasyBooksData, isLoading: isLoadingFantasy } = useQuery({
    queryKey: ["/api/genres/view/1"], // Fantasy genre view
  });
  const fantasyBooks = fantasyBooksData as Book[];

  const { data: isekaiBooksData, isLoading: isLoadingIsekai } = useQuery({
    queryKey: ["/api/genres/view/2"], // Isekai RPG genre view
  });
  const isekaiBooks = isekaiBooksData as Book[];

  const { data: scifiBooksData, isLoading: isLoadingScifi } = useQuery({
    queryKey: ["/api/genres/view/3"], // Sci-fi genre view
  });
  const scifiBooks = scifiBooksData as Book[];

  // Get personalized recommendations if user is logged in
  const { data: recommendedBooksData, isLoading: isLoadingRecommended } = useQuery({
    queryKey: ["/api/recommendations"],
    enabled: !!user,
  });
  const recommendedBooks = recommendedBooksData as Book[];

  // Get books from authors the user follows
  const { data: followedAuthorsBooksData, isLoading: isLoadingFollowed } = useQuery({
    queryKey: ["/api/recommendations/followed-authors"],
    enabled: !!user,
  });
  const followedAuthorsBooks = followedAuthorsBooksData as Book[];

  // Get books on user's wishlist
  const { data: wishlistBooksData, isLoading: isLoadingWishlist } = useQuery({
    queryKey: ["/api/recommendations/wishlist"],
    enabled: !!user,
  });
  const wishlistBooks = wishlistBooksData as Book[];

  // Create manual homepage sections for non-authenticated users
  const [manualSections, setManualSections] = useState<HomepageSection[]>([]);

  useEffect(() => {
    if (!user) {
      // Only set manual sections if there's no user (for guests)
      setManualSections([
        {
          id: "fantasy",
          type: "custom_genre_view",
          displayMode: "carousel",
          title: "Fantasy",
          itemCount: 10,
          customViewId: 1,
          visible: true
        },
        {
          id: "isekai",
          type: "custom_genre_view",
          displayMode: "book_rack", // Changed to book_rack view
          title: "Explore Isekai RPG Books",
          itemCount: 10,
          customViewId: 2,
          visible: true
        },
        {
          id: "scifi",
          type: "custom_genre_view",
          displayMode: "grid",
          title: "Science Fiction",
          itemCount: 12,
          customViewId: 3,
          visible: true
        }
      ]);
    }
  }, [user]);

  // Filter new books (published in the last 7 days and not in the future)
  const newBooks = books?.filter(book => {
    if (!book.publishedDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of today
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0); // Set to beginning of one week ago
    
    const publishedDate = new Date(book.publishedDate);
    publishedDate.setHours(0, 0, 0, 0); // Set to beginning of published date
    
    // Only show books published in the last 7 days and not in the future
    return publishedDate > oneWeekAgo && publishedDate <= today;
  });

  // Get featured book for hero ad if available
  const featuredBook = books?.find(book => book.promoted === true) || 
                      (books && books.length > 0 ? books[0] : null);

  return (
    <div className="bg-background min-h-screen flex justify-center">
      <main className="container max-w-[95vw] overflow-hidden mx-auto pb-8">
        {/* Hero Section - Full Width */}
        <section className="w-full mb-8">
          <HeroCarousel />
        </section>

        {/* What's Hot Section - Mobile: Appears directly after banner */}
        <div className="block lg:hidden mb-8">
          <h2 className="text-xl font-medium mb-4">What's Hot</h2>
          <div className="whats-hot-mobile-container">
            <WhatsHotSidebar />
          </div>
        </div>

        {/* Main Content Area with Sidebar Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area - Left Side on Desktop */}
          <div className="flex-1 order-2 lg:order-1">
            {/* New Arrivals Section */}
            {newBooks && newBooks.length > 0 && (
              <div className="max-w-[1024px] mb-8">
                <BookCarousel 
                  title="Recently Updated"
                  books={newBooks}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Coming Soon Section - Books with future publication dates */}
            <div className="max-w-[1024px] mb-8">
              <ComingSoonSection title="Coming Soon" limit={8} />
            </div>

            {/* Dynamic Home Sections for logged-in users */}
            {user ? (
              <DynamicHomeSections />
            ) : (
              <DynamicHomeSections sections={manualSections} />
            )}

            {/* Second Horizontal Banner Ad - After 2 sections */}
            {books && books.length > 2 && (
              <div className="my-8">
                <HorizontalBannerAd
                  campaignId={1}
                  bookId={books[2].id}
                  imageSrc={books[2].images?.find(img => img.imageType === "background")?.imageUrl || "/images/placeholder-book.png"}
                  title={books[2].title}
                  description={books[2].description?.substring(0, 100) + '...'}
                  source="home-mid-content"
                  position="between-sections"
                />
              </div>
            )}
          </div>

          {/* What's Hot Sidebar - Right Side on Desktop only */}
          <div className="lg:w-72 hidden lg:block lg:order-2">
            {/* What's Hot Section - Desktop: Vertical */}
            <div className="sticky top-20">
              <WhatsHotSidebar isSticky={true} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}