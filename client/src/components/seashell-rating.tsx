import React from "react";
import { Shell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SeashellRatingProps {
  compatibilityScore: number;
  compatibilityLabel?: string;
  isLoggedIn: boolean;
  showLabel?: boolean;
}

export const SeashellRating: React.FC<SeashellRatingProps> = ({ 
  compatibilityScore, 
  compatibilityLabel,
  isLoggedIn,
  showLabel = true
}) => {
  // Normalize score to a scale of 1-5, where 3 is neutral
  // compatibilityScore is from -3 to +3
  const normalizedScore = Math.max(1, Math.min(5, compatibilityScore + 3));
  
  // Define color based on score
  let badgeColor = "bg-yellow-500";
  if (compatibilityScore >= 2) badgeColor = "bg-green-500";
  else if (compatibilityScore >= 1) badgeColor = "bg-emerald-400";
  else if (compatibilityScore >= 0) badgeColor = "bg-yellow-400";
  else if (compatibilityScore >= -1) badgeColor = "bg-orange-400";
  else if (compatibilityScore >= -2) badgeColor = "bg-red-400";
  else badgeColor = "bg-red-600";
  
  // Default compatibility label if none provided
  const label = compatibilityLabel || (
    compatibilityScore >= 3 ? "Overwhelmingly compatible" :
    compatibilityScore >= 2 ? "Very compatible" :
    compatibilityScore >= 1 ? "Mostly compatible" :
    compatibilityScore >= 0 ? "Mixed compatibility" :
    compatibilityScore >= -1 ? "Mostly incompatible" :
    compatibilityScore >= -2 ? "Very incompatible" :
    "Overwhelmingly incompatible"
  );
  
  return (
    <div className="flex flex-col space-y-2">
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
      
      {showLabel && isLoggedIn && (
        <Badge className={`${badgeColor} text-white border-0`}>
          {label}
        </Badge>
      )}
    </div>
  );
};