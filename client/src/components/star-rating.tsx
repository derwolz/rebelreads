import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  maxRating?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "primary" | "muted";
}

export function StarRating({ 
  rating = 0, 
  maxRating = 5,
  onChange, 
  readOnly = false,
  size = "md",
  variant = "primary"
}: StarRatingProps) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  // Create stars array
  const stars = [];
  const fullStars = Math.floor(rating);
  
  for (let i = 0; i < maxRating; i++) {
    // Determine if this star should be filled or empty
    const isFilled = i < fullStars;
    
    stars.push(
      <Star
        key={i}
        className={cn(
          sizeClasses,
          "transition-colors",
          isFilled ? "text-purple-500" : "text-gray-400",
          readOnly ? "cursor-default" : "cursor-pointer"
        )}
        style={{ fill: isFilled ? '#9333ea' : 'none' }}
        onClick={() => !readOnly && onChange?.(i + 1)}
      />
    );
  }

  return (
    <div className="flex gap-0.5">
      {stars}
    </div>
  );
}