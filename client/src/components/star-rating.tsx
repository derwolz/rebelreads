import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  onChange?: (rating: number) => void;
  className?: string;
  readOnly?: boolean;
}

export function StarRating({ rating = 0, onChange, className, readOnly = false }: StarRatingProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-5 h-5 cursor-pointer transition-colors",
            star <= rating ? "fill-primary text-primary" : "text-muted",
            readOnly && "cursor-default"
          )}
          onClick={() => !readOnly && onChange?.(star)}
        />
      ))}
    </div>
  );
}
