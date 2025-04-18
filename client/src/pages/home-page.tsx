import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { HeroCarousel } from "@/components/hero-carousel";
import { BookGrid } from "@/components/book-grid";
import { BookCarousel } from "@/components/book-carousel";
import { WhatsHotSidebar } from "@/components/whats-hot-sidebar";
import { HeroBannerAd, VerticalBannerAd, HorizontalBannerAd } from "@/components/banner-ads";
import { DynamicHomeSections } from "@/components/dynamic-home-sections";

// Define the homepage section types for manual layout
interface HomepageSection {
  id: string;
  type: string;
  displayMode: "carousel" | "grid";
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
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Get genre-specific book lists
  const { data: fantasyBooks, isLoading: isLoadingFantasy } = useQuery<Book[]>({
    queryKey: ["/api/genres/view/1"], // Fantasy genre view
  });

  const { data: isekaiBooks, isLoading: isLoadingIsekai } = useQuery<Book[]>({
    queryKey: ["/api/genres/view/2"], // Isekai RPG genre view
  });

  const { data: scifiBooks, isLoading: isLoadingScifi } = useQuery<Book[]>({
    queryKey: ["/api/genres/view/3"], // Sci-fi genre view
  });

  // Get personalized recommendations if user is logged in
  const { data: recommendedBooks, isLoading: isLoadingRecommended } = useQuery<Book[]>({
    queryKey: ["/api/recommendations"],
    enabled: !!user,
  });

  // Get books from authors the user follows
  const { data: followedAuthorsBooks, isLoading: isLoadingFollowed } = useQuery<Book[]>({
    queryKey: ["/api/recommendations/followed-authors"],
    enabled: !!user,
  });

  // Get books on user's wishlist
  const { data: wishlistBooks, isLoading: isLoadingWishlist } = useQuery<Book[]>({
    queryKey: ["/api/recommendations/wishlist"],
    enabled: !!user,
  });

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
          displayMode: "carousel",
          title: "Isekai RPG",
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

  // Filter new books (published in the last 7 days)
  const newBooks = books?.filter(book => {
    if (!book.publishedDate) return false;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(book.publishedDate) > oneWeekAgo;
  });

  // Get featured book for hero ad if available
  const featuredBook = books?.find(book => book.promoted === true) || 
                      (books && books.length > 0 ? books[0] : null);

  return (
    <div className="bg-background min-h-screen  flex justify-center">
      <main className="container max-w-[95vw] overflow-hidden mx-auto pb-8">
        {/* Hero Section - Full Width */}
        <section className="w-full  mb-8">
          <HeroCarousel />
        </section>

        {/* Main Content Area */}
        <div className="w-full">
          {/* Content Area */}
          <div className="w-full lg:pr-8">
            {/* New Arrivals Section */}
            {newBooks && newBooks.length > 0 && (
              <div className="max-w-[1024px]  mb-8">
                <BookCarousel 
                  title="Recently Updated"
                  books={newBooks}
                  isLoading={isLoading}
                />
              </div>
            )}

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
            
            {/* Vertical Banner Ad that was previously in sidebar - only shown on mobile */}
            {books && books.length > 1 && (
              <div className="mt-8 block lg:hidden">
                <VerticalBannerAd
                  campaignId={1}
                  bookId={books[1].id}
                  imageSrc={books[1].images?.find(img => img.imageType === "book-card")?.imageUrl || "/images/placeholder-book.png"}
                  title={books[1].title}
                  description={books[1].description?.substring(0, 80) + '...'}
                  source="home-sidebar"
                />
              </div>
            )}
          </div>
          
          {/* The WhatsHotSidebar is now floating, added to the page outside the layout */}
          <WhatsHotSidebar />
        </div>
      </main>
    </div>
  );
}