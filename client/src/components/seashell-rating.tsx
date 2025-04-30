import React from "react";
import { cn } from "@/lib/utils";
import { Shell } from "lucide-react";

export interface SeashellRatingProps {
  compatibility: number;
  maxRating?: number;
  size?: "xs" | "sm" | "md" | "lg";
  readOnly?: boolean;
  onChange?: (value: number) => void;
}

/**
 * SeashellRating component for displaying compatibility ratings as seashells
 * Takes a compatibility score and renders the appropriate number of seashells
 */
export function SeashellRating({
  compatibility,
  maxRating = 5,
  size = "md",
  readOnly = false,
  onChange,
}: SeashellRatingProps) {
  // Get appropriate classes based on size
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size];

  // Determine color class based on compatibility value
  const getColorClass = (value: number) => {
    // Negative compatibility (red)
    if (value < 0) return "text-red-500 fill-red-500";
    // Positive compatibility (purple/accent)
    return "text-purple-500 fill-purple-500";
  };

  // Create an array to hold the seashells we need to render
  const seashells = [];
  
  // Get the absolute value for rendering purposes
  const absCompatibility = Math.abs(compatibility);
  
  // Calculate whole and fractional parts
  const fullSeashells = Math.floor(absCompatibility);
  const fractionalPart = absCompatibility - fullSeashells;
  
  // Color class based on whether compatibility is positive or negative
  const colorClass = getColorClass(compatibility);
  
  // Render full, partial, and empty seashells
  for (let i = 0; i < maxRating; i++) {
    if (i < fullSeashells) {
      // Full seashell
      seashells.push(
        <Shell
          key={i}
          className={cn(
            sizeClasses,
            "cursor-pointer transition-colors",
            colorClass,
            readOnly && "cursor-default"
          )}
          onClick={() => !readOnly && onChange?.(i + 1)}
        />
      );
    } else if (i === fullSeashells && fractionalPart >= 0.25 && fractionalPart < 0.75) {
      // Half seashell
      seashells.push(
        <div key={i} className="relative">
          <Shell
            className={cn(
              sizeClasses,
              "cursor-pointer transition-colors text-muted",
              readOnly && "cursor-default"
            )}
          />
          <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
            <Shell
              className={cn(
                sizeClasses,
                "cursor-pointer transition-colors",
                colorClass,
                readOnly && "cursor-default"
              )}
            />
          </div>
        </div>
      );
    } else if (i === fullSeashells && fractionalPart >= 0.75) {
      // Almost full seashell but not quite
      seashells.push(
        <Shell
          key={i}
          className={cn(
            sizeClasses,
            "cursor-pointer transition-colors",
            colorClass,
            readOnly && "cursor-default"
          )}
          onClick={() => !readOnly && onChange?.(i + 1)}
        />
      );
    } else {
      // Empty seashell
      seashells.push(
        <Shell
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
      {seashells}
    </div>
  );
}