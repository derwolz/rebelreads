import { useState, useCallback } from "react";
import { BookSpineProps, BookSpineBase } from "./book-spine-base";
import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";

// BookSpineB - Version with rating indicator and glow effect
export function BookSpineB(props: BookSpineProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle hover state
  const handleHover = useCallback((hover: boolean) => {
    setIsHovered(hover);
    if (props.onHover) props.onHover(hover);
  }, [props.onHover]);

  // Mock rating for demo purposes - in real app, would come from book data
  const rating = props.book.id % 5 + 1; // Just a way to generate different ratings (1-5)
  const isNew = props.book.publishedDate && 
    (new Date().getTime() - new Date(props.book.publishedDate).getTime() < 30 * 24 * 60 * 60 * 1000);
  
  return (
    <div className="relative">
      <BookSpineBase 
        {...props}
        onHover={handleHover}
        className={cn(
          "transition-all duration-300",
          isHovered && "shadow-lg"
        )}
      />
      
      {/* Glowing effect when hovered */}
      {isHovered && (
        <div className="absolute inset-0 bg-primary/5 blur-md rounded-md -z-10"></div>
      )}
      
      {/* Rating indicator at the bottom */}
      <div 
        className={cn(
          "absolute bottom-2 left-[50%] translate-x-[-50%] flex items-center transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-70"
        )}
      >
        <StarIcon className="h-3 w-3 text-yellow-500 fill-yellow-500" />
        <span className="text-[10px] font-bold text-foreground ml-[1px]">
          {rating.toFixed(1)}
        </span>
      </div>
      
      {/* New indicator */}
      {isNew && (
        <div 
          className={cn(
            "absolute top-2 left-[50%] translate-x-[-50%] w-[8px] h-[8px] rounded-full bg-blue-500",
            isHovered ? "opacity-100" : "opacity-70"
          )}
        />
      )}
    </div>
  );
}