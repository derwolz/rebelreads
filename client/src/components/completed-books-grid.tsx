import { Book } from "@shared/schema";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "./star-rating";

interface CompletedBooksGridProps {
  books: Book[];
  isLoading: boolean;
}

function BookCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function CompletedBooksGrid({ books, isLoading }: CompletedBooksGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {isLoading
        ? Array.from({ length: 8 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))
        : books?.map((book) => (
            <CompletedBookItem key={book.id} book={book} />
          ))}
      {books?.length === 0 && !isLoading && (
        <p className="col-span-full text-center text-muted-foreground py-8">
          You haven't completed any books yet.
        </p>
      )}
    </div>
  );
}

function CompletedBookItem({ book }: { book: Book }) {
  // Check if book has been rated
  const { data: userRating } = useQuery<{
    id: number;
    userId: number;
    bookId: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
    review: string | null;
    createdAt: string;
  } | null>({
    queryKey: [`/api/books/${book.id}/user-rating`],
  });

  const needsReview = !userRating;

  return (
    <Link href={`/books/${book.id}`}>
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          needsReview ? "ring-2 ring-amber-300/40 ring-offset-2 ring-offset-background/5" : ""
        }`}
      >
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={book.images?.find(img => img.imageType === "spine")?.imageUrl || "/images/placeholder-book.png"}
            alt={book.title}
            className="w-full h-full object-cover"
          />
          
          {needsReview && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-amber-400 hover:bg-amber-500 text-black">
                Needs Review
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="pt-3 pb-2">
          <h3 className="font-medium line-clamp-1" title={book.title}>
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1" title={book.author}>
            {book.author}
          </p>
          
          {userRating && (
            <div className="mt-2">
              <StarRating 
                rating={userRating.enjoyment} 
                readOnly 
                size="sm" 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}