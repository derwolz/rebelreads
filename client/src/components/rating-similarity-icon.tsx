import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Sparkles,
  Palette,
  Users,
  Mountain
} from "lucide-react";

interface RatingSimilarityIconProps {
  criterion: string;
  similarity: number; // 0-1 where 1 is identical
  label?: string;
  size?: "sm" | "md" | "lg";
}

// This component displays a visual icon for rating similarity/compatibility
// Instead of showing numbers, it displays an icon with a color indicating compatibility
export const RatingSimilarityIcon: React.FC<RatingSimilarityIconProps> = ({ 
  criterion, 
  similarity, 
  label,
  size = "md"
}) => {
  // Convert numeric difference to percentage similarity
  const similarityPercent = Math.max(0, Math.min(100, Math.round((1 - similarity) * 100)));
  
  // Determine color based on similarity percentage
  const getColor = () => {
    if (similarityPercent >= 90) return "text-green-500";
    if (similarityPercent >= 70) return "text-green-400";
    if (similarityPercent >= 50) return "text-amber-400";
    if (similarityPercent >= 30) return "text-orange-500";
    return "text-rose-500";
  };
  
  // Get the appropriate icon based on the criteria
  const getIcon = () => {
    switch (criterion.toLowerCase()) {
      case "enjoyment":
        return <ThumbsUp className={cn(getColor(), "stroke-2")} />;
      case "writing":
        return <BookOpen className={cn(getColor(), "stroke-2")} />;
      case "themes":
        return <Sparkles className={cn(getColor(), "stroke-2")} />;
      case "characters":
        return <Users className={cn(getColor(), "stroke-2")} />;
      case "worldbuilding":
        return <Mountain className={cn(getColor(), "stroke-2")} />;
      default:
        return <Palette className={cn(getColor(), "stroke-2")} />;
    }
  };
  
  // Get the appropriate size class
  const getSizeClass = () => {
    switch (size) {
      case "sm": return "h-4 w-4";
      case "lg": return "h-8 w-8";
      case "md":
      default: return "h-6 w-6";
    }
  };
  
  // Get the appropriate description based on similarity
  const getDescription = () => {
    if (similarityPercent >= 90) return "Extremely similar";
    if (similarityPercent >= 70) return "Very similar";
    if (similarityPercent >= 50) return "Somewhat similar";
    if (similarityPercent >= 30) return "Quite different";
    return "Very different";
  };
  
  const displayLabel = label || `${criterion}: ${similarityPercent}% similar (${getDescription()})`;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex flex-col items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`${getSizeClass()}`}>
              {getIcon()}
            </div>
            <span className="text-xs capitalize truncate max-w-20">
              {criterion}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{displayLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};