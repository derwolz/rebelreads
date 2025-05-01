import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

type SeashellRatingProps = {
  compatibility: number;
  readOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  onChange?: (newRating: number) => void;
};

/**
 * SeashellRating component for displaying compatibility ratings
 * 
 * Uses a -3 to +3 compatibility scale:
 * - Negative values (incompatible) are displayed in red
 * - Positive values (compatible) are displayed in purple
 * - Neutral values (near 0) are displayed in gray
 * 
 * The component displays 3 seashells and colors them based on the compatibility value
 */
export function SeashellRating({
  compatibility,
  readOnly = false,
  size = "md",
  className,
  onChange,
}: SeashellRatingProps) {
  // Clamp compatibility value between -3 and 3
  const clampedValue = Math.max(-3, Math.min(3, compatibility));
  
  // Convert the -3 to 3 range to an absolute 0 to 3 scale for display purposes
  const absoluteValue = Math.abs(clampedValue);
  
  // Determine color based on compatibility direction
  const color = clampedValue > 0 
    ? "text-purple-500" // Purple for positive/compatible
    : clampedValue < 0 
      ? "text-red-500"  // Red for negative/incompatible
      : "text-gray-400"; // Gray for neutral/no preference
  
  // Size classes
  const sizeClasses = {
    xs: "text-xs gap-0.5",
    sm: "text-sm gap-1",
    md: "text-base gap-1",
    lg: "text-lg gap-1.5",
  };
  
  // Round to the nearest integer for clearer display
  const roundedValue = Math.round(absoluteValue);
  
  // Helper function to render a single seashell
  const renderSeashell = (index: number) => {
    // If current index is less than the rounded value, render a full seashell
    if (index < roundedValue) {
      return (
        <div key={index} className={color}>
          <SeashellIcon />
        </div>
      );
    }
    
    // Otherwise render an empty (gray) seashell
    return (
      <div key={index} className="text-gray-300">
        <SeashellIcon />
      </div>
    );
  };

  // Calculate compatibility percentage (from -3/3 to percentage)
  const compatibilityPercentage = Math.round((clampedValue / 3) * 100);
  
  // Generate tooltip text based on the compatibility percentage
  const getCompatibilityTooltip = () => {
    const isPositive = clampedValue > 0;
    const absPercentage = Math.abs(compatibilityPercentage);
    
    // Direction prefix (Positive/Negative)
    const directionPrefix = isPositive ? "Positive" : "Negative";
    
    // Level description based on percentage range
    let levelDescription = "";
    if (absPercentage <= 33) {
      levelDescription = isPositive ? "Some Compatibility" : "Some Incompatibility";
    } else if (absPercentage <= 66) {
      levelDescription = isPositive ? "Medium Compatibility" : "Medium Incompatibility";
    } else {
      levelDescription = isPositive ? "High Compatibility" : "High Incompatibility";
    }
    
    return `${directionPrefix} ${absPercentage}% (${levelDescription})`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center", 
              sizeClasses[size],
              className
            )}
          >
            {/* Display 3 seashells - one for each rating point */}
            {[0, 1, 2].map(renderSeashell)}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">Compatibility Rating</p>
            <p className={clampedValue > 0 ? "text-purple-500" : clampedValue < 0 ? "text-red-500" : "text-gray-500"}>
              {getCompatibilityTooltip()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Simple seashell SVG icon
function SeashellIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="2em" 
      height="2em" 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M12.134 2a.75.75 0 0 0-.544.232 13.593 13.593 0 0 0-1.234 1.496c-.582.823-1.17 1.87-1.555 3.178-.364 1.243-.542 2.688-.384 4.322.1 1.082.366 2.308.86 3.597.254.657.571 1.348.961 2.048-.804.342-1.559.487-2.27.418-.704-.062-1.305-.327-1.787-.75-.447-.394-.775-.945-.941-1.588-.163-.622-.167-1.346-.003-2.12.09-.393.23-.81.42-1.235a.75.75 0 1 0-1.4-.532 8.111 8.111 0 0 0-.494 1.453c-.191.898-.19 1.793.019 2.591.205.779.618 1.516 1.225 2.058.642.566 1.442.913 2.328.993.9.082 1.85-.097 2.845-.518.67 1.056 1.489 2.07 2.443 2.921a.75.75 0 0 0 .554.245.75.75 0 0 0 .555-.245c.954-.851 1.773-1.865 2.444-2.921.994.421 1.944.6 2.844.518.886-.08 1.687-.427 2.33-.993.606-.542 1.019-1.279 1.223-2.058.21-.798.21-1.693.02-2.591a8.111 8.111 0 0 0-.494-1.453.75.75 0 1 0-1.4.532c.19.425.33.843.42 1.235.163.774.16 1.498-.004 2.12-.165.643-.494 1.194-.94 1.588-.483.423-1.084.688-1.788.75-.711.069-1.465-.076-2.27-.418.39-.7.708-1.391.962-2.048.494-1.289.76-2.515.859-3.597.159-1.634-.02-3.08-.383-4.322-.386-1.307-.974-2.355-1.556-3.178A13.593 13.593 0 0 0 12.678 2.232a.75.75 0 0 0-.544-.232zm0 1.61c.204.228.445.507.714.84.467.66.973 1.562 1.306 2.689.318 1.078.472 2.35.335 3.775-.087.94-.329 2.066-.783 3.26-.38.984-.888 2.047-1.572 3.092-.684-1.045-1.192-2.108-1.572-3.091-.454-1.195-.696-2.321-.783-3.261-.137-1.425.017-2.697.334-3.775.334-1.127.84-2.029 1.307-2.69.269-.332.51-.61.714-.839z" />
    </svg>
  );
}