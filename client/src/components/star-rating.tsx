import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  onChange?: (rating: number) => void;
  className?: string;
  readOnly?: boolean;
  size?: "sm" | "default";
}

export function StarRating({ 
  rating = 0, 
  onChange, 
  className, 
  readOnly = false,
  size = "default" 
}: StarRatingProps) {
  const starSize = size === "sm" ? "w-3 h-3" : "w-5 h-5";

  return (
    <div className={cn("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            "cursor-pointer transition-colors",
            star <= rating ? "fill-primary text-primary" : "text-muted",
            readOnly && "cursor-default"
          )}
          onClick={() => !readOnly && onChange?.(star)}
        />
      ))}
    </div>
  );
}