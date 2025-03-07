import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BookCarousel } from "@/components/book-carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StarRating } from "@/components/star-rating";
import { SocialMediaLinks } from "@/components/social-media-links";
import { FollowButton } from "@/components/follow-button";
import { Book } from "@shared/schema";

interface AuthorSearchResult {
  id: number;
  username: string;
  authorName: string | null;
  authorBio: string | null;
  authorImageUrl: string | null;
  socialMediaLinks: any[];
  books: Book[];
  followerCount: number;
  aggregateRatings?: {
    overall: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  };
}

export function SearchAuthorsPage() {
  const [location] = useLocation();
  const query = new URLSearchParams(location.split("?")[1]).get("q") || "";

  const { data: searchResults, isLoading } = useQuery<{
    authors: AuthorSearchResult[];
  }>({
    queryKey: ["/api/search/authors", query],
    queryFn: () =>
      fetch(`/api/search/authors?q=${query}`) // Correctly fetch the results using the API
        .then((response) => response.json()),
    enabled: query.length > 1,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Searching for "{query}"...</h1>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full animate-pulse">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-1/3 bg-muted rounded" />
                    <div className="h-4 w-1/4 bg-muted rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded mb-4" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Author Results for "{query}"</h1>
      {!searchResults?.authors?.length ? (
        <div className="text-center text-muted-foreground">
          No authors found matching your search.
        </div>
      ) : (
        <div className="space-y-8">
          {searchResults.authors.map((author) => (
            <Card key={author.id} className="w-full">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={author.authorImageUrl || undefined}
                      alt={author.authorName || author.username}
                    />
                    <AvatarFallback>
                      {(author.authorName || author.username)[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {author.authorName || author.username}
                        </h2>
                        <p className="text-muted-foreground">
                          {author.followerCount} followers
                        </p>
                      </div>
                      <FollowButton
                        authorId={author.id}
                        authorName={author.authorName || author.username}
                      />
                    </div>
                    {author.aggregateRatings && (
                      <div className="mt-2">
                        <StarRating
                          rating={author.aggregateRatings.overall}
                          readOnly
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {author.authorBio && (
                  <p className="text-muted-foreground mb-4">
                    {author.authorBio}
                  </p>
                )}
                <SocialMediaLinks links={author.socialMediaLinks} />
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Books by {author.authorName || author.username}
                  </h3>
                  {author.books.length > 0 ? (
                    <BookCarousel
                      books={author.books}
                      title={`Books by ${author.authorName || author.username}`}
                      isLoading={false}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      No books published yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
