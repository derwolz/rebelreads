import { Book, Rating, calculateWeightedRating } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import { WishlistButton } from "./wishlist-button";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function BookCard({ book }: { book: Book }) {
  const [showDetailed, setShowDetailed] = useState(false);
  const [, navigate] = useLocation();

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the wishlist button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/books/${book.id}`);
  };

  return (
    <Card 
      className="overflow-hidden relative transition-transform duration-200 hover:scale-105 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton bookId={book.id} variant="ghost" size="icon" />
      </div>
      <img 
        src={book.coverUrl} 
        alt={book.title}
        className="w-full h-64 object-cover"
      />
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{book.title}</h3>
        <Link href={`/authors/${book.authorId}`} className="text-sm text-muted-foreground hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
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
    </Card>
  );
}