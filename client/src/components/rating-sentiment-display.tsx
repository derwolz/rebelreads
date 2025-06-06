import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Drama, CircleX, CircleDashed, 
  Lightbulb, Pencil, Heart, BookMarked, GlobeIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SentimentLevel } from '../../../shared/schema';



// Define category icons
const CATEGORY_ICONS = {
  enjoyment: Heart,
  writing: Pencil,
  themes: Lightbulb, 
  characters: Drama,
  worldbuilding: GlobeIcon,
};

// Map sentiment levels to readable descriptions
const SENTIMENT_LABELS: Record<SentimentLevel, string> = {
  overwhelmingly_positive: 'Overwhelmingly Positive',
  very_positive: 'Very Positive',
  mostly_positive: 'Mostly Positive',
  mixed: 'Mixed',
  mostly_negative: 'Mostly Negative',
  very_negative: 'Very Negative',
  overwhelmingly_negative: 'Overwhelmingly Negative',
};

// Map sentiment levels to colors - Using Sirened purple for positive sentiments (colorblind friendly)
const SENTIMENT_COLORS: Record<SentimentLevel, string> = {
  overwhelmingly_positive: 'text-[hsl(271,56%,45%)] fill-[hsl(271,56%,25%)]', // primary-600 - Darker purple for strongest contrast
  very_positive: 'text-[hsl(271,56%,45%)]',          // primary-500 - Medium dark purple
  mostly_positive: 'text-[hsl(271,56%,70%)]',        // primary-400 - Main purple
  mixed: 'text-amber-500',                          // Keep amber for mixed
  mostly_negative: 'text-red-400',                  // Keep red for negative
  very_negative: 'text-red-500',                    // Keep red for negative
  overwhelmingly_negative: 'text-red-600 fill-red-900',          // Keep red for negative
};

interface RatingSentimentThreshold {
  id: number;
  criteriaName: string;
  sentimentLevel: SentimentLevel;
  ratingMin: number;
  ratingMax: number;
  requiredCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RatingSentimentResult {
  criteriaName: string;
  sentimentLevel: SentimentLevel | null;
  averageRating: number;
  count: number;
  hasEnoughRatings: boolean;
}

// Define our own rating type to avoid import issues
interface Rating {
  id: number;
  userId: number;
  bookId: number;
  enjoyment: number;
  writing: number;
  themes: number;
  characters: number;
  worldbuilding: number;
  review?: string | null;
  createdAt: string;
}

// Define aggregated ratings type
interface AggregatedRatings {
  overall: number;
  enjoyment: number;
  writing: number;
  themes: number;
  characters: number;
  worldbuilding: number;
}

interface RatingSentimentDisplayProps {
  ratings: Rating[] | AggregatedRatings;
  ratingsCount?: number;
  className?: string;
  showCount?: boolean;
}

/**
 * Format count with abbreviations (k, m) for large numbers
 * @param count Number to format
 * @returns Formatted string with abbreviation
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    // For numbers >= 1M, format as #.##m
    return (Math.floor(count / 10000) / 100).toFixed(2).replace(/\.0+$/, '') + 'm';
  } else if (count >= 1000) {
    // For numbers >= 1k, format as #.##k
    return (Math.floor(count / 10) / 100).toFixed(2).replace(/\.0+$/, '') + 'k';
  }
  // For small numbers, no abbreviation
  return count.toString();
}

const RatingSentimentDisplay: React.FC<RatingSentimentDisplayProps> = ({ 
  ratings, 
  ratingsCount = 0,
  className,
  showCount = false
}) => {
  const [sentimentResults, setSentimentResults] = useState<RatingSentimentResult[]>([]);

  // Fetch sentiment thresholds from the API
  const { data: thresholds, isLoading, error } = useQuery({
    queryKey: ['/api/rating-sentiments'],
  });

  // Calculate sentiment levels based on ratings and thresholds
  useEffect(() => {
    if (!thresholds) return;

    // Determine if we have array of ratings or aggregated ratings
    const isAggregated = !Array.isArray(ratings);
    
    // Initialize result data
    const criterias = ["enjoyment", "writing", "themes", "characters", "worldbuilding"];
    const results = criterias.map(criteriaName => {
      let averageRating = 0;
      let count = ratingsCount || 0;

      if (isAggregated) {
        // If we have aggregated ratings, use those values directly
        const aggregated = ratings as AggregatedRatings;
        averageRating = aggregated[criteriaName as keyof AggregatedRatings] || 0;
      } else {
        // If we have array of ratings, calculate averages
        const ratingArray = ratings as Rating[];
        if (!ratingArray.length) {
          count = 0;
        } else {
          const ratingValues = ratingArray
            .map(r => r[criteriaName as keyof Rating] as number)
            .filter(v => typeof v === 'number');
          
          if (ratingValues.length) {
            averageRating = ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length;
            count = ratingValues.length;
          } else {
            count = 0;
          }
        }
      }

      // Find applicable thresholds for this criteria
      const criteriaThresholds = Array.isArray(thresholds) ? thresholds.filter(
        (t: RatingSentimentThreshold) => t.criteriaName === criteriaName
      ) as RatingSentimentThreshold[] : [];

      // Find matching sentiment level
      let sentimentLevel: SentimentLevel | null = null;
      let hasEnoughRatings = false;

      for (const threshold of criteriaThresholds) {
        if (
          count >= threshold.requiredCount &&
          averageRating >= threshold.ratingMin &&
          averageRating <= threshold.ratingMax
        ) {
          sentimentLevel = threshold.sentimentLevel;
          hasEnoughRatings = true;
          break;
        }
      }

      return {
        criteriaName,
        sentimentLevel,
        averageRating,
        count,
        hasEnoughRatings
      };
    });

    setSentimentResults(results);
  }, [ratings, thresholds, ratingsCount]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading sentiment ratings...</div>;
  }

  if (error) {
    console.error('Error loading sentiment thresholds:', error);
    return null;
  }

  if (
    (Array.isArray(ratings) && ratings.length === 0) ||
    (!Array.isArray(ratings) && !Object.values(ratings).some(v => v > 0))
  ) {
    return null;
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <h3 className="text-sm font-medium">Rating Sentiment</h3>
      <div className="flex flex-wrap gap-2">
        {sentimentResults.map((result) => {
          // Get the appropriate icon for this criteria
          const IconComponent = CATEGORY_ICONS[result.criteriaName as keyof typeof CATEGORY_ICONS] || CircleDashed;
          
          // Calculate thumbs up and thumbs down counts
          const thumbsUpCount = Math.round(result.count * (1 + result.averageRating) / 2);
          const thumbsDownCount = Math.round(result.count * (1 - result.averageRating) / 2);
          
          return (
            <TooltipProvider key={result.criteriaName}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <IconComponent 
                      className={cn(
                        "h-6 w-6", 
                        result.hasEnoughRatings && result.sentimentLevel
                          ? SENTIMENT_COLORS[result.sentimentLevel]
                          : "text-muted-foreground"
                      )} 
                    />
                    {showCount && (
                      <span className="absolute -bottom-1 -right-1 text-[10px] font-semibold">
                        {result.count}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-semibold capitalize">{result.criteriaName}</p>
                    {result.hasEnoughRatings && result.sentimentLevel ? (
                      <p className={SENTIMENT_COLORS[result.sentimentLevel]}>
                        {SENTIMENT_LABELS[result.sentimentLevel]}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Not enough ratings yet ({result.count}/{Array.isArray(thresholds) && thresholds.find(
                          (t: RatingSentimentThreshold) => 
                            t.criteriaName === result.criteriaName && 
                            t.sentimentLevel === 'mixed'
                        )?.requiredCount || 5})
                      </p>
                    )}
                    <div className="flex justify-between mt-1">
                      <p className="text-[hsl(271,56%,63%)]">👍 {formatCount(thumbsUpCount)}</p>
                      <p className="text-red-500">👎 {formatCount(thumbsDownCount)}</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

export { RatingSentimentDisplay };