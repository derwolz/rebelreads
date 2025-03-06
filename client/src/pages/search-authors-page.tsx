import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BookCarousel } from "@/components/book-carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StarRating } from "@/components/star-rating";
import { SocialMediaLinks } from "@/components/social-media-links";
import { FollowButton } from "@/components/follow-button";
import { Book } from "@shared/schema";

interface AuthorWithDetails {
  id: number;
  username: string;
  authorName: string;
  authorBio: string;
  authorImageUrl: string;
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

  const { data: searchResults, isLoading } = useQuery<{ authors: AuthorWithDetails[] }>({
    queryKey: ["/api/search", query, "authors"],
    enabled: query.length > 1,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Author Results for "{query}"</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-8">
          {searchResults?.authors.map((author) => (
            <Card key={author.id} className="w-full">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={author.authorImageUrl} alt={author.authorName} />
                    <AvatarFallback>{author.authorName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{author.authorName}</h2>
                        <p className="text-muted-foreground">{author.followerCount} followers</p>
                      </div>
                      <FollowButton authorId={author.id} />
                    </div>
                    {author.aggregateRatings && (
                      <div className="mt-2">
                        <StarRating rating={author.aggregateRatings.overall} />
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{author.authorBio}</p>
                <SocialMediaLinks links={author.socialMediaLinks} />
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Books by {author.authorName}</h3>
                  <BookCarousel books={author.books} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {searchResults?.authors.length === 0 && (
        <div className="text-center text-muted-foreground">
          No authors found matching your search.
        </div>
      )}
    </div>
  );
}
