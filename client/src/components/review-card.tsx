import { useState } from "react";
import { Rating, calculateWeightedRating } from "@shared/schema";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ReviewCardProps {
  rating: Rating;
}

const REVIEW_PREVIEW_LENGTH = 200;

export function ReviewCard({ rating }: ReviewCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasLongReview = rating.review && rating.review.length > REVIEW_PREVIEW_LENGTH;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="p-4 bg-muted rounded-lg space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <StarRating rating={Math.round(calculateWeightedRating(rating))} readOnly size="sm" />
          <span className="text-sm text-muted-foreground">Overall Rating</span>
        </div>
        {hasLongReview && (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
              <span className="sr-only">Toggle details</span>
            </Button>
          </CollapsibleTrigger>
        )}
      </div>

      {rating.review && (
        <div className="text-sm">
          <p className={!isOpen && hasLongReview ? "line-clamp-3" : undefined}>
            {rating.review}
          </p>
        </div>
      )}

      <CollapsibleContent className="space-y-2 pt-2">
        <div className="grid gap-2 text-sm border-t pt-2">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
