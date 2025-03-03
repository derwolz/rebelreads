import { useState } from "react";
import { Rating, calculateWeightedRating } from "@shared/schema";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";

interface ReviewCardProps {
  rating: Rating;
}

const REVIEW_PREVIEW_LENGTH = 200;

export function ReviewCard({ rating }: ReviewCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasLongReview = rating.review && rating.review.length > REVIEW_PREVIEW_LENGTH;

  return (
    <div className="p-4 bg-muted rounded-lg space-y-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <StarRating rating={Math.round(calculateWeightedRating(rating))} readOnly size="sm" />
          <span className="text-sm text-muted-foreground">Overall Rating</span>
        </div>
      </div>

      {rating.review && (
        <div className="text-sm">
          <p className={`max-w-prose ${!isOpen && hasLongReview ? "line-clamp-3" : undefined}`}>
            {rating.review}
          </p>
          {hasLongReview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card expansion when clicking the review button
                setIsOpen(!isOpen);
              }}
              className="mt-2"
            >
              {isOpen ? "Show Less" : "Read More"}
            </Button>
          )}
        </div>
      )}

      <div className={`grid gap-2 text-sm border-t pt-2 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        <div className="flex justify-between items-center">
          <span>Enjoyment (30%)</span>
          <StarRating rating={rating.enjoyment} readOnly size="sm" />
        </div>
        <div className="flex justify-between items-center">
          <span>Writing Style (30%)</span>
          <StarRating rating={rating.writing} readOnly size="sm" />
        </div>
        <div className="flex justify-between items-center">
          <span>Themes (20%)</span>
          <StarRating rating={rating.themes} readOnly size="sm" />
        </div>
        <div className="flex justify-between items-center">
          <span>Characters (10%)</span>
          <StarRating rating={rating.characters} readOnly size="sm" />
        </div>
        <div className="flex justify-between items-center">
          <span>World Building (10%)</span>
          <StarRating rating={rating.worldbuilding} readOnly size="sm" />
        </div>
      </div>
    </div>
  );
}