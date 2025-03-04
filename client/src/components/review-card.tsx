import { useState } from "react";
import { Rating, calculateWeightedRating } from "@shared/schema";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReviewCardProps {
  review: Rating;
}

const REVIEW_PREVIEW_LENGTH = 200;

export function ReviewCard({ review }: ReviewCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasLongReview = review.review && review.review.length > REVIEW_PREVIEW_LENGTH;

  return (
    <div className="p-4 bg-muted rounded-lg space-y-2 cursor-pointer w-full" onClick={() => setIsOpen(!isOpen)}>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <StarRating rating={Math.round(calculateWeightedRating(review))} readOnly size="sm" />
          <span className="text-sm text-muted-foreground">Overall Rating</span>
        </div>
      </div>

      {review.review && (
        <div className="text-sm">
          <p className={`break-words ${!isOpen && hasLongReview ? "line-clamp-3" : undefined}`}>
            {review.review}
          </p>
          {hasLongReview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
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
          <StarRating rating={review.enjoyment} readOnly size="sm" />
        </div>
        <div className="flex justify-between items-center">
          <span>Writing Style (20%)</span>
          <StarRating rating={review.writing} readOnly size="sm" />
        </div>
        <div className="flex justify-between items-center">
          <span>Themes (20%)</span>
          <StarRating rating={review.themes} readOnly size="sm" />
        </div>
        <div className="flex justify-between items-center">
          <span>Characters (10%)</span>
          <StarRating rating={review.characters} readOnly size="sm" />
        </div>
        <div className="flex justify-between items-center">
          <span>World Building (10%)</span>
          <StarRating rating={review.worldbuilding} readOnly size="sm" />
        </div>
      </div>
    </div>
  );
}