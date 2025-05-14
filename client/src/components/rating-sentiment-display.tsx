import React from "react";
import { RatingSimilarityIcon } from "./rating-similarity-icon";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Lock } from "lucide-react";

interface RatingCategory {
  criteriaName: string;
  totalPositive: number;
  totalNegative: number;
  sentiment: string;
}

interface RatingSentimentDisplayProps {
  ratings: RatingCategory[];
  isLoggedIn?: boolean;
  isAuthor?: boolean;
  totalRatings?: number;
  neverLock?: boolean;
  className?: string;
}

// Calculate sentiment based on positive/negative ratio or rating value
const calculateSentiment = (positive: number, negative: number): string => {
  if (positive + negative === 0) return "mixed";
  
  const ratio = positive / (positive + negative);
  
  if (ratio >= 0.95) return "overwhelmingly_positive";
  if (ratio >= 0.85) return "very_positive";
  if (ratio >= 0.70) return "mostly_positive";
  if (ratio >= 0.40 && ratio <= 0.60) return "mixed";
  if (ratio >= 0.30) return "mostly_negative";
  if (ratio >= 0.15) return "very_negative";
  return "overwhelmingly_negative";
};

// Calculate sentiment from a rating value (typically -1 to 1 range)
const getSentimentFromRating = (rating: number): string => {
  if (rating > 0.8) return "overwhelmingly_positive";
  if (rating > 0.6) return "very_positive";
  if (rating > 0.3) return "mostly_positive";
  if (rating >= -0.3 && rating <= 0.3) return "mixed";
  if (rating >= -0.6) return "mostly_negative";
  if (rating >= -0.8) return "very_negative";
  return "overwhelmingly_negative";
};

// Sample data for non-logged in users
const sampleRatings: RatingCategory[] = [
  { 
    criteriaName: "enjoyment", 
    totalPositive: 75, 
    totalNegative: 25, 
    sentiment: "mostly_positive" 
  },
  { 
    criteriaName: "writing", 
    totalPositive: 60, 
    totalNegative: 40, 
    sentiment: "mixed" 
  },
  { 
    criteriaName: "themes", 
    totalPositive: 5, 
    totalNegative: 5, 
    sentiment: "mixed" 
  },
  { 
    criteriaName: "characters", 
    totalPositive: 65, 
    totalNegative: 35, 
    sentiment: "mostly_positive" 
  },
  { 
    criteriaName: "worldbuilding", 
    totalPositive: 40, 
    totalNegative: 60, 
    sentiment: "mostly_negative" 
  }
];

export const RatingSentimentDisplay: React.FC<RatingSentimentDisplayProps> = ({
  ratings,
  isLoggedIn = true,
  isAuthor = false,
  totalRatings = 0,
  neverLock = false,
  className = ""
}) => {
  // Convert ratings to array format if it's an object
  let displayRatings: RatingCategory[] = [];
  
  if (Array.isArray(ratings)) {
    // If ratings is already an array, use it directly
    displayRatings = ratings;
  } else if (ratings && typeof ratings === 'object') {
    // If ratings is an object (like averageRatings from book-details), convert it to array format
    displayRatings = Object.entries(ratings)
      .filter(([key]) => !['overall', 'compatibility', 'id', 'bookId', 'userId'].includes(key))
      .map(([criteriaName, value]: [string, any]) => {
        // Use more nuanced sentiment calculation based on the value
        const numValue = parseFloat(value);
        // Convert from 0-5 scale to -1 to +1 scale for sentiment
        const normalizedValue = (numValue - 2.5) / 2.5;
        const sentiment = getSentimentFromRating(normalizedValue);
        return {
          criteriaName,
          totalPositive: normalizedValue > 0 ? Math.round(50 + (normalizedValue * 50)) : 0,
          totalNegative: normalizedValue <= 0 ? Math.round(50 - (normalizedValue * 50)) : 0,
          sentiment
        };
      });
  }
  
  // For authors, show progress toward 10 ratings if less than 10
  if (isAuthor && totalRatings !== undefined && totalRatings < 10) {
    const ratingsToGo = 10 - totalRatings;
    const progressValue = totalRatings * 10;
    
    return (
      <div className={`flex flex-col items-center p-4 gap-2 ${className}`}>
        <p className="text-sm text-center mb-2">
          You need {ratingsToGo} more ratings to see detailed sentiment analysis
        </p>
        <Progress value={progressValue} className="w-full max-w-md" />
        <p className="text-xs text-muted-foreground mt-1">
          {totalRatings}/10 ratings received
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-center gap-4 sm:gap-6 md:gap-8 flex-wrap">
        {displayRatings.map((category) => (
          <div 
            key={category.criteriaName} 
            className="relative"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <RatingSimilarityIcon
                      criterion={category.criteriaName}
                      similarity={0} // Not used for coloring
                      sentiment={category.sentiment}
                      size="lg"
                      label={`${category.criteriaName.charAt(0).toUpperCase() + category.criteriaName.slice(1)}: ${category.totalPositive} 👍 ${category.totalNegative} 👎`}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <div className="font-medium capitalize mb-1">{category.criteriaName}</div>
                    <div>👍 {category.totalPositive} positive</div>
                    <div>👎 {category.totalNegative} negative</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* No lock overlay - ratings are always visible */}
          </div>
        ))}
      </div>
    </div>
  );
};