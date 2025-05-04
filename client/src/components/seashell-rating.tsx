import React from "react";
import { Shell } from "lucide-react";

interface SeashellRatingProps {
  compatibilityScore: number;
  isLoggedIn: boolean;
}

export const SeashellRating: React.FC<SeashellRatingProps> = ({ compatibilityScore, isLoggedIn }) => {
  // Normalize score to a scale of 1-5, where 3 is neutral
  // compatibilityScore is from -3 to +3
  const normalizedScore = Math.max(1, Math.min(5, compatibilityScore + 3));
  
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((position) => (
        <Shell
          key={position}
          className={`h-6 w-6 ${
            position <= normalizedScore 
              ? "text-primary" 
              : "text-muted-foreground opacity-30"
          } ${!isLoggedIn ? "opacity-50" : ""}`}
        />
      ))}
    </div>
  );
};