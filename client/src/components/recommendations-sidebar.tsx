import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Book } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { BookOpen, ThumbsUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function RecommendationsSidebar() {
  // Fetch recommendations based on user's rating preferences
  const { data: recommendedBooks, isLoading } = useQuery<Book[]>({
    queryKey: ['/api/books'],
    staleTime: 60000,
  });

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-primary" />
          Recommended for You
        </CardTitle>
        <CardDescription>
          Based on your rating preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 pb-3 last:pb-0 border-b last:border-0">
                <Skeleton className="w-10 h-14 rounded" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {recommendedBooks?.slice(0, 3).map((book) => (
              <div key={book.id} className="flex items-start gap-3 pb-3 last:pb-0 border-b last:border-0">
                <div className="block w-10 h-14 shrink-0">
                  <Link href={`/books/${book.id}`}>
                    <img
                      src={book.images?.find(img => img.imageType === "mini")?.imageUrl || "/images/placeholder-book.png"}
                      alt={book.title}
                      className="w-full h-full object-cover rounded cursor-pointer"
                    />
                  </Link>
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    <Link href={`/books/${book.id}`}>
                      <span className="hover:text-primary cursor-pointer">{book.title}</span>
                    </Link>
                  </h4>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="truncate">{book.authorName}</span>
                  </div>
                  <StarRating
                    rating={4}
                    readOnly
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </>
        )}
        
        <Button variant="outline" size="sm" className="w-full gap-1 mt-2">
          <BookOpen className="h-4 w-4" />
          <span>View More Books</span>
        </Button>
      </CardContent>
    </Card>
  );
}