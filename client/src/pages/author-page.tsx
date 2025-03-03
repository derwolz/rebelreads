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
import type { Book, User } from "@shared/schema";
import { format } from 'date-fns';

interface AuthorDetails extends User {
  books: Book[];
  followerCount: number;
  genres: { genre: string; count: number }[];
  birthDate?: string;
  deathDate?: string;
  website?: string;
  aggregateRatings?: {
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  };
}

export default function AuthorPage() {
  const [, params] = useRoute("/authors/:id");
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: author } = useQuery<AuthorDetails>({
    queryKey: [`/api/authors/${params?.id}`],
  });

  if (!author) return null;

  const filteredBooks = author.books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <MainNav />
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
                  <div className="text-sm text-muted-foreground mt-2">
                    Born: {format(new Date(author.birthDate), "MMMM d, yyyy")}
                    {author.deathDate && (
                      <>
                        {" • "}Died: {format(new Date(author.deathDate), "MMMM d, yyyy")}
                      </>
                    )}
                  </div>
                )}
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
              </div>
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
                <StarRating rating={Math.round(author.aggregateRatings.overall)} readOnly />
                <span className="text-sm text-muted-foreground">
                  Average across all books
                </span>
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Enjoyment (30%)</span>
                  <StarRating rating={Math.round(author.aggregateRatings.enjoyment)} readOnly size="sm" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Writing Style (30%)</span>
                  <StarRating rating={Math.round(author.aggregateRatings.writing)} readOnly size="sm" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Themes (20%)</span>
                  <StarRating rating={Math.round(author.aggregateRatings.themes)} readOnly size="sm" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Characters (10%)</span>
                  <StarRating rating={Math.round(author.aggregateRatings.characters)} readOnly size="sm" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">World Building (10%)</span>
                  <StarRating rating={Math.round(author.aggregateRatings.worldbuilding)} readOnly size="sm" />
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
                  <CarouselItem key={book.id} className="md:basis-1/2 lg:basis-1/3">
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