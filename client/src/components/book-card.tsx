import { Book, Rating, calculateWeightedRating } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import { RatingDialog } from "./rating-dialog";
import { WishlistButton } from "./wishlist-button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function BookCard({ book }: { book: Book }) {
  const [showDetailed, setShowDetailed] = useState(false);

  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${book.id}/ratings`],
  });

  const averageRatings = ratings?.length ? {
    overall: ratings.reduce((acc, r) => acc + calculateWeightedRating(r), 0) / ratings.length,
    enjoyment: ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length,
    writing: ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
    themes: ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
    characters: ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length,
    worldbuilding: ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length,
  } : null;

  return (
    <Card className="overflow-hidden">
      <img 
        src={book.coverUrl} 
        alt={book.title}
        className="w-full h-64 object-cover"
      />
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{book.title}</h3>
        <Link href={`/authors/${book.authorId}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
          {book.author}
        </Link>

        <div className="flex flex-wrap gap-1 mt-2 mb-2">
          {book.genres.slice(0, 3).map((genre) => (
            <Badge key={genre} variant="secondary" className="text-xs">
              {genre}
            </Badge>
          ))}
        </div>

        <div 
          className="mt-2"
          onMouseEnter={() => setShowDetailed(true)}
          onMouseLeave={() => setShowDetailed(false)}
        >
          {!showDetailed ? (
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(averageRatings?.overall || 0)} readOnly />
              <span className="text-sm text-muted-foreground">
                ({ratings?.length || 0})
              </span>
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Enjoyment:</span>
                <StarRating rating={Math.round(averageRatings?.enjoyment || 0)} readOnly size="sm" />
              </div>
              <div className="flex justify-between">
                <span>Writing:</span>
                <StarRating rating={Math.round(averageRatings?.writing || 0)} readOnly size="sm" />
              </div>
              <div className="flex justify-between">
                <span>Themes:</span>
                <StarRating rating={Math.round(averageRatings?.themes || 0)} readOnly size="sm" />
              </div>
              <div className="flex justify-between">
                <span>Characters:</span>
                <StarRating rating={Math.round(averageRatings?.characters || 0)} readOnly size="sm" />
              </div>
              <div className="flex justify-between">
                <span>World Building:</span>
                <StarRating rating={Math.round(averageRatings?.worldbuilding || 0)} readOnly size="sm" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 flex gap-2">
        <WishlistButton bookId={book.id} />
        <RatingDialog
          bookId={book.id}
          trigger={<Button variant="outline" className="flex-1">Rate</Button>}
        />
        <Link href={`/books/${book.id}`}>
          <Button variant="secondary" className="flex-1">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}