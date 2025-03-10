import { Book, Rating, calculateWeightedRating } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import { WishlistButton } from "./wishlist-button";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

export function BookCard({ book }: { book: Book }) {
  const [showDetailed, setShowDetailed] = useState(false);
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);

  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${book.id}/ratings`],
  });

  // Set up intersection observer to track when the card becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 } // Card must be 50% visible to count
    );

    const element = document.getElementById(`book-card-${book.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [book.id]);

  // Record impression when card becomes visible
  useEffect(() => {
    if (isVisible && !hasRecordedImpression) {
      const recordImpression = async () => {
        await apiRequest(
          "POST",
          `/api/books/${book.id}/impression`,
          {
            source: 'card',
            context: window.location.pathname
          }
        );
        setHasRecordedImpression(true);
      };
      recordImpression();
    }
  }, [isVisible, hasRecordedImpression, book.id]);

  const averageRatings = ratings?.length
    ? {
        overall:
          ratings.reduce((acc, r) => acc + calculateWeightedRating(r), 0) /
          ratings.length,
        enjoyment:
          ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length,
        writing:
          ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
        themes: ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
        characters:
          ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length,
        worldbuilding:
          ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length,
      }
    : null;

  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't navigate if clicking on the wishlist button
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    // Record click-through before navigation
    await apiRequest(
      "POST",
      `/api/books/${book.id}/click-through`,
      {
        source: 'card',
        referrer: window.location.pathname
      }
    );
    navigate(`/books/${book.id}`);
  };

  return (
    <div className="relative group min-h-256" style={{ marginBottom: "10rem" }}>
      <Card
        id={`book-card-${book.id}`}
        className={`
          overflow-visible cursor-pointer
          transition-all duration-300 ease-in-out
          group-hover:scale-105 group-hover:shadow-xl
          ${showDetailed ? "z-50" : "z-10"}
          relative
        `}
        onClick={handleCardClick}
        onMouseEnter={() => setShowDetailed(true)}
        onMouseLeave={() => setShowDetailed(false)}
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
          <Link
            href={`/authors/${book.authorId}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {book.author}
          </Link>

          <div className="flex flex-wrap gap-1 mt-2 mb-2">
            {book.genres.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-2">
              <StarRating
                rating={Math.round(averageRatings?.overall || 0)}
                readOnly
              />
              <span className="text-sm text-muted-foreground">
                ({ratings?.length || 0})
              </span>
            </div>
          </div>

          <div
            className={`
              absolute left-0 right-0 bg-background/95 backdrop-blur-sm
              transition-all duration-300 ease-in-out
              shadow-lg rounded-b-lg
              ${showDetailed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}
            `}
            style={{
              top: "100%",
              borderTop: "1px solid var(--border)",
              zIndex: 100,
              transformOrigin: "top",
            }}
          >
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Enjoyment (30%)</span>
                <StarRating
                  rating={Math.round(averageRatings?.enjoyment || 0)}
                  readOnly
                  size="sm"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Writing (30%)</span>
                <StarRating
                  rating={Math.round(averageRatings?.writing || 0)}
                  readOnly
                  size="sm"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Themes (20%)</span>
                <StarRating
                  rating={Math.round(averageRatings?.themes || 0)}
                  readOnly
                  size="sm"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Characters (10%)</span>
                <StarRating
                  rating={Math.round(averageRatings?.characters || 0)}
                  readOnly
                  size="sm"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">World Building (10%)</span>
                <StarRating
                  rating={Math.round(averageRatings?.worldbuilding || 0)}
                  readOnly
                  size="sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}