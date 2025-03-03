import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainNav } from "@/components/main-nav";
import { BookCard } from "@/components/book-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Book, User } from "@shared/schema";

interface AuthorDetails extends User {
  books: Book[];
  followerCount: number;
  genres: { genre: string; count: number }[];
}

export default function AuthorPage() {
  const [, params] = useRoute("/authors/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: author } = useQuery<AuthorDetails>({
    queryKey: [`/api/authors/${params?.id}`],
  });

  const { data: followStatus } = useQuery({
    queryKey: [`/api/authors/${params?.id}/following`],
    enabled: !!user && author?.id !== user.id,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/authors/${params?.id}/${followStatus?.isFollowing ? 'unfollow' : 'follow'}`
      );
      if (!res.ok) throw new Error("Failed to update follow status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${params?.id}/following`] });
      toast({
        title: followStatus?.isFollowing ? "Unfollowed" : "Following",
        description: `You are ${followStatus?.isFollowing ? 'no longer' : 'now'} following ${author?.authorName || author?.username}`,
      });
    },
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
              </div>
            </div>
            {user && author.id !== user.id && (
              <Button
                variant={followStatus?.isFollowing ? "outline" : "default"}
                onClick={() => followMutation.mutate()}
              >
                {followStatus?.isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>

          {author.authorBio && (
            <div className="prose max-w-none">
              <p>{author.authorBio}</p>
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
