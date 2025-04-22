import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCard } from "@/components/book-card";
import { ReviewCard } from "@/components/review-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { SocialMediaLinks } from "@/components/social-media-links";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Book, BookShelf } from "@shared/schema";
import { CompletedBooksGrid } from "@/components/completed-books-grid";
import { BookshelfCarousel } from "@/components/bookshelf-carousel";

interface DashboardData {
  wishlistCount: number;
  completedCount: number;
  ratingCount: number;
  followingCount: number;
  isPublisher: boolean;
  isAuthor: boolean;
  recentActivity: any[];
}

export default function DashboardPage(): React.JSX.Element {
  const { user } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState<string>("all");

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const { data: wishlistedBooks } = useQuery<Book[]>({
    queryKey: ["/api/wishlist/books"],
    enabled: !!user,
  });
  
  const { data: completedBooks, isLoading: isLoadingCompletedBooks } = useQuery<Book[]>({
    queryKey: ["/api/collections/completed"],
    enabled: !!user,
  });
  
  // Fetch user's bookshelves
  const { data: bookshelves, isLoading: isLoadingBookshelves } = useQuery<BookShelf[]>({
    queryKey: ["/api/bookshelves"],
    enabled: !!user,
  });

  // Temporarily handling genres with 'as any' during migration to taxonomy system
  const uniqueGenres = wishlistedBooks
    ? Array.from(new Set(wishlistedBooks.flatMap(book => (book as any).genres || [])))
    : [];

  const filteredBooks = wishlistedBooks?.filter(book =>
    selectedGenre === "all" || ((book as any).genres || []).includes(selectedGenre)
  );

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    // Return a loading placeholder instead of null
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Could not load dashboard data. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const { wishlistCount, completedCount, followingCount } = dashboardData;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user?.username || 'User'}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">{user?.username || 'User'}</CardTitle>
                {user?.bio && (
                  <p className="text-muted-foreground mt-2">{user.bio}</p>
                )}
                <div className="flex gap-4 mt-2">
                  <span>{followingCount} Following</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Bookshelves Carousel */}
        <Card>
          <CardHeader>
            <CardTitle>My Bookshelves</CardTitle>
          </CardHeader>
          <CardContent>
            <BookshelfCarousel 
              bookshelves={bookshelves} 
              isLoading={isLoadingBookshelves} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Wishlist</CardTitle>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {uniqueGenres.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {filteredBooks?.map((book) => (
                  <div key={book.id} className="flex-none w-[250px] snap-start pb-24 relative">
                    <BookCard book={book} />
                  </div>
                ))}
                {filteredBooks?.length === 0 && (
                  <p className="text-muted-foreground">No books found in this genre.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Wishlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{wishlistCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        {completedCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Completed Books</CardTitle>
              <p className="text-sm text-muted-foreground">
                Books you've finished reading. Books that need a review are highlighted.
              </p>
            </CardHeader>
            <CardContent>
              <CompletedBooksGrid 
                books={completedBooks || []}
                isLoading={isLoadingCompletedBooks}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}