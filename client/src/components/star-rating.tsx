import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className={cn("flex gap-1")}>
      {[...Array(maxRating)].map((_, star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses,
            "cursor-pointer transition-colors",
            star < rating ? "fill-primary text-primary" : "text-muted",
            readOnly && "cursor-default"
          )}
          onClick={() => !readOnly && onChange?.(star + 1)}
        />
      ))}
    </div>
  );
}