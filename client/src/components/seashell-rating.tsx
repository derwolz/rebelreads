import React from "react";
import { Shell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  // Compatibility score is from -3 to +3
  // We want to display 0-3 shells with different colors
  
  // How many shells to show (absolute value of score, max 3)
  const shellCount = Math.min(3, Math.abs(Math.round(compatibilityScore)));
  
  // Whether the compatibility is positive or negative
  const isPositive = compatibilityScore >= 0;
  
  // Shell colors based on positive/negative and intensity
  const getShellColor = (position: number) => {
    if (!isLoggedIn) return "text-muted-foreground opacity-50";
    
    // Only show shells up to the absolute score value
    if (position > shellCount) return "text-muted-foreground opacity-30";
    
    // Get increasing intensity based on position
    if (isPositive) {
      // Purple gradient for positive compatibility
      return position === 1 ? "text-purple-300" :
             position === 2 ? "text-purple-400" :
                             "text-purple-600";
    } else {
      // Red gradient for negative compatibility
      return position === 1 ? "text-red-300" :
             position === 2 ? "text-red-500" :
                             "text-red-700";
    }
  };
  
  // Badge color based on score
  const getBadgeColor = () => {
    if (compatibilityScore >= 2) return "bg-purple-600";
    if (compatibilityScore >= 1) return "bg-purple-500";
    if (compatibilityScore >= 0) return "bg-purple-300";
    if (compatibilityScore >= -1) return "bg-red-300";
    if (compatibilityScore >= -2) return "bg-red-500";
    return "bg-red-700";
  };
  
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
      <div className="flex items-center justify-center">
        {[1, 2, 3].map((position) => (
          <Shell
            key={position}
            className={cn(
              "h-6 w-6",
              getShellColor(position),
              // Flip shells for negative compatibility
              !isPositive && "transform rotate-180"
            )}
          />
        ))}
      </div>
      
      {showLabel && isLoggedIn && (
        <Badge className={`${getBadgeColor()} text-white border-0`}>
          {label}
        </Badge>
      )}
    </div>
  );
};