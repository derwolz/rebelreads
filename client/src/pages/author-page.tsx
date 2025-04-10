import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainNav } from "@/components/main-nav";
import { BookCard } from "@/components/book-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { FollowButton } from "@/components/follow-button";
import { StarRating } from "@/components/star-rating";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Book, SocialMediaLink } from "@shared/schema";
import { format } from "date-fns";
import { SocialMediaLinks } from "@/components/social-media-links";

interface AuthorDetails {
  id: number;
  username: string;
  authorName: string | null;
  authorBio: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  website?: string | null;
  books: Book[];
  followerCount: number;
  genres: { genre: string; count: number }[];
  aggregateRatings?: {
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  };
  socialMediaLinks?: SocialMediaLink[];
}

export default function AuthorPage() {
  const [, params] = useRoute("/authors/:id");
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: author,
    isLoading,
    error,
  } = useQuery<AuthorDetails>({
    queryKey: [`/api/authors/${params?.id}`],
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div>
        <MainNav />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div>
        <MainNav />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Error loading author</h1>
            <p className="text-muted-foreground">Please try again later</p>
          </div>
        </main>
      </div>
    );
  }
  console.log("Author: ", author);
  const filteredBooks = author.books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {author.authorName || author.username}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{author.followerCount} followers</span>
                <span>•</span>
                <span>{author.books.length} books</span>
                {author.birthDate && (
                  <>
                    <span>•</span>
                    <span className="text-sm">
                      Born: {format(new Date(author.birthDate), "MMMM d, yyyy")}
                      {author.deathDate && (
                        <>
                          {" • "}Died:{" "}
                          {format(new Date(author.deathDate), "MMMM d, yyyy")}
                        </>
                      )}
                    </span>
                  </>
                )}
              </div>
              {author.website && (
                <a
                  href={author.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  Visit Website
                </a>
              )}
              {author.socialMediaLinks &&
                author.socialMediaLinks.length > 0 && (
                  <div className="mt-4">
                    <SocialMediaLinks links={author.socialMediaLinks} />
                  </div>
                )}
            </div>
            <FollowButton
              authorId={author.id}
              authorName={author.authorName || author.username}
            />
          </div>

          {author.authorBio && (
            <div className="prose max-w-none">
              <p>{author.authorBio}</p>
            </div>
          )}

          {author.aggregateRatings && (
            <div className="bg-muted rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-semibold">Overall Ratings</h2>
              <div className="flex items-center gap-2">
                <StarRating
                  rating={Math.round(author.aggregateRatings.overall)}
                  readOnly
                />
                <span className="text-sm text-muted-foreground">
                  Average across all books
                </span>
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Enjoyment (30%)</span>
                  <StarRating
                    rating={Math.round(author.aggregateRatings.enjoyment)}
                    readOnly
                    size="sm"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Writing Style (30%)</span>
                  <StarRating
                    rating={Math.round(author.aggregateRatings.writing)}
                    readOnly
                    size="sm"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Themes (20%)</span>
                  <StarRating
                    rating={Math.round(author.aggregateRatings.themes)}
                    readOnly
                    size="sm"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Characters (10%)</span>
                  <StarRating
                    rating={Math.round(author.aggregateRatings.characters)}
                    readOnly
                    size="sm"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">World Building (10%)</span>
                  <StarRating
                    rating={Math.round(author.aggregateRatings.worldbuilding)}
                    readOnly
                    size="sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {author.genres.map(({ genre, count }) => (
              <Badge key={genre} variant="secondary" className="text-sm">
                {genre} ({count})
              </Badge>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Books</h2>
              <Input
                placeholder="Search books..."
                className="max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Carousel className="w-full">
              <CarouselContent>
                {filteredBooks.map((book) => (
                  <CarouselItem
                    key={book.id}
                    className="md:basis-1/2 lg:basis-1/3 pl-0 pr-1 pb-40"
                  >
                    <BookCard book={book} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </main>
    </div>
  );
}
