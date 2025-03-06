import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCard } from "@/components/book-card";
import { ReviewCard } from "@/components/review-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { SocialMediaLinks } from "@/components/social-media-links";

interface DashboardData {
  user: {
    username: string;
    bio: string | null;
    profileImageUrl: string | null;
    followingCount: number;
    followerCount: number;
    socialMediaLinks?: any[];
  };
  readingStats: {
    wishlisted: number;
    completed: number;
  };
  averageRatings: {
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  } | null;
  recentReviews: any[];
  recommendations: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <div>
        <MainNav />
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-8">
            <Skeleton className="h-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { readingStats, averageRatings, recentReviews, recommendations } = dashboardData;

  return (
    <div>
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* User Profile Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {dashboardData.user.profileImageUrl ? (
                  <img
                    src={dashboardData.user.profileImageUrl}
                    alt={dashboardData.user.username}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">{dashboardData.user.username}</CardTitle>
                  {dashboardData.user.bio && (
                    <p className="text-muted-foreground mt-2">{dashboardData.user.bio}</p>
                  )}
                  <div className="flex gap-4 mt-2">
                    <span>{dashboardData.user.followingCount} Following</span>
                    <span>{dashboardData.user.followerCount} Followers</span>
                  </div>
                  {dashboardData.user.socialMediaLinks && dashboardData.user.socialMediaLinks.length > 0 && (
                    <div className="mt-4">
                      <SocialMediaLinks links={dashboardData.user.socialMediaLinks} />
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Reading Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Wishlist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{readingStats.wishlisted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{readingStats.completed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Rating Stats */}
          {averageRatings && (
            <Card>
              <CardHeader>
                <CardTitle>Your Rating Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Overall Rating</span>
                    <span>{averageRatings.overall.toFixed(1)}/5</span>
                  </div>
                  <Progress value={averageRatings.overall * 20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Enjoyment (30%)</span>
                    <span>{averageRatings.enjoyment.toFixed(1)}/5</span>
                  </div>
                  <Progress value={averageRatings.enjoyment * 20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Writing (30%)</span>
                    <span>{averageRatings.writing.toFixed(1)}/5</span>
                  </div>
                  <Progress value={averageRatings.writing * 20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Themes (20%)</span>
                    <span>{averageRatings.themes.toFixed(1)}/5</span>
                  </div>
                  <Progress value={averageRatings.themes * 20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Characters (10%)</span>
                    <span>{averageRatings.characters.toFixed(1)}/5</span>
                  </div>
                  <Progress value={averageRatings.characters * 20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Worldbuilding (10%)</span>
                    <span>{averageRatings.worldbuilding.toFixed(1)}/5</span>
                  </div>
                  <Progress value={averageRatings.worldbuilding * 20} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Reviews */}
          {recentReviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}