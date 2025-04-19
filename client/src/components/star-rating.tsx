import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingProps {
  rating?: number;
  maxRating?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export function StarRating({ 
  rating = 0, 
  maxRating = 5,
  onChange, 
  readOnly = false,
  size = "md" 
}: StarRatingProps) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  // Create an array to hold the stars we need to render
  const stars = [];
  
  // Calculate whole and fractional parts
  const fullStars = Math.floor(rating);
  const fractionalPart = rating - fullStars;
  
  // Render full, half, and empty stars
  for (let i = 0; i < maxRating; i++) {
    if (i < fullStars) {
      // Full star
      stars.push(
        <Star
          key={i}
          className={cn(
            sizeClasses,
            "cursor-pointer transition-colors fill-tertiary text-tertiary",
            readOnly && "cursor-default"
          )}
          onClick={() => !readOnly && onChange?.(i + 1)}
        />
      );
    } else if (i === fullStars && fractionalPart >= 0.25 && fractionalPart < 0.75) {
      // Half star
      stars.push(
        <div key={i} className="relative">
          <Star
            className={cn(
              sizeClasses,
              "cursor-pointer transition-colors text-muted",
              readOnly && "cursor-default"
            )}
          />
          <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
            <Star
              className={cn(
                sizeClasses,
                "cursor-pointer transition-colors fill-tertiary text-primary",
                readOnly && "cursor-default"
              )}
            />
          </div>
        </div>
      );
    } else if (i === fullStars && fractionalPart >= 0.75) {
      // Almost full star but not quite
      stars.push(
        <Star
          key={i}
          className={cn(
            sizeClasses,
            "cursor-pointer transition-colors fill-tertiary text-primary",
            readOnly && "cursor-default"
          )}
          onClick={() => !readOnly && onChange?.(i + 1)}
        />
      );
    } else {
      // Empty star
      stars.push(
        <Star
          key={i}
          className={cn(
            sizeClasses,
            "cursor-pointer transition-colors text-muted",
            readOnly && "cursor-default"
          )}
          onClick={() => !readOnly && onChange?.(i + 1)}
        />
      );
    }
  }

  return (
    <div className={cn("flex gap-1")}>
      {stars}
    </div>
  );
}