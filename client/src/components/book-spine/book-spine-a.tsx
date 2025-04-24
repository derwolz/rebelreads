import { useState, useCallback } from "react";
import { BookSpineProps, BookSpineBase } from "./book-spine-base";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// BookSpineA - Version with colored trim and featured badge
export function BookSpineA(props: BookSpineProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle hover state
  const handleHover = useCallback((hover: boolean) => {
    setIsHovered(hover);
    if (props.onHover) props.onHover(hover);
  }, [props.onHover]);

  const isFeatured = props.book.promoted;
  
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
      
      {/* Colored trim on the spine top */}
      <div 
        className={cn(
          "absolute top-0 left-[50%] translate-x-[-50%] w-[54px] h-[4px] transition-opacity duration-300",
          isFeatured ? "bg-primary" : "bg-secondary",
          isHovered ? "opacity-100" : "opacity-60"
        )}
      />
      
      {/* Featured badge (only shown on featured books) */}
      {isFeatured && (
        <div className={cn(
          "absolute -top-1 -right-1 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-70"
        )}>
          <Badge 
            variant="outline" 
            className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1"
          >
            Featured
          </Badge>
        </div>
      )}
    </div>
  );
}