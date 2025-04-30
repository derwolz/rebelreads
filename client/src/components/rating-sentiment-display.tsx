import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SentimentLevel } from "@shared/schema";

// Icons for each criteria
const CRITERIA_ICONS = {
  worldbuilding: "🏔", // mountains for world building
  themes: "🌙", // moon for themes
  characters: "🎭", // drama masks for characters
  enjoyment: "😃", // smiley for enjoyment
  writing: "🖋", // pen for writing style
};

// Tooltip descriptions for each criteria
const CRITERIA_DESCRIPTIONS = {
  worldbuilding: "World Building - How well-developed the setting, magic systems, and environments are",
  themes: "Themes - The depth and exploration of ideas and concepts",
  characters: "Characters - How compelling, interesting, and well-developed the characters are",
  enjoyment: "Enjoyment - How entertaining and engaging the book is",
  writing: "Writing - Quality of prose, plot structure, and overall skill",
};

// Colors for each sentiment level
const SENTIMENT_COLORS = {
  overwhelmingly_positive: "text-green-600",
  very_positive: "text-green-500",
  mostly_positive: "text-green-400",
  mixed: "text-amber-500",
  mostly_negative: "text-red-400",
  very_negative: "text-red-500",
  overwhelmingly_negative: "text-red-600",
};

// Descriptions for sentiment levels
const SENTIMENT_DESCRIPTIONS = {
  overwhelmingly_positive: "Overwhelmingly Positive",
  very_positive: "Very Positive", 
  mostly_positive: "Mostly Positive",
  mixed: "Mixed",
  mostly_negative: "Mostly Negative",
  very_negative: "Very Negative",
  overwhelmingly_negative: "Overwhelmingly Negative",
};

interface RatingSentimentProps {
  ratings: {
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  };
  ratingsCount: number;
  className?: string;
}

export function RatingSentimentDisplay({ ratings, ratingsCount, className }: RatingSentimentProps) {
  const [sentiments, setSentiments] = useState<Record<string, SentimentLevel | null>>({
    worldbuilding: null,
    themes: null,
    characters: null,
    enjoyment: null,
    writing: null,
  });

  useEffect(() => {
    // This would normally fetch the thresholds from the API and calculate sentiments
    // For now, we'll use a simplified approach based on the ratings
    const calculatedSentiments: Record<string, SentimentLevel | null> = {};
    
    Object.entries(ratings).forEach(([criteria, value]) => {
      // Skip if no ratings
      if (ratingsCount === 0) {
        calculatedSentiments[criteria] = null;
        return;
      }
      
      // Convert -1 to 1 rating scale to our sentiment levels
      // Each level has specific required counts, but for demo we'll simplify
      if (ratingsCount >= 100 && value >= 0.9) {
        calculatedSentiments[criteria] = "overwhelmingly_positive";
      } else if (ratingsCount >= 30 && value >= 0.5) {
        calculatedSentiments[criteria] = "very_positive";
      } else if (ratingsCount >= 10 && value >= 0.1) {
        calculatedSentiments[criteria] = "mostly_positive";
      } else if (ratingsCount >= 5 && value >= -0.1 && value <= 0.1) {
        calculatedSentiments[criteria] = "mixed";
      } else if (ratingsCount >= 10 && value <= -0.1) {
        calculatedSentiments[criteria] = "mostly_negative";
      } else if (ratingsCount >= 30 && value <= -0.5) {
        calculatedSentiments[criteria] = "very_negative";
      } else if (ratingsCount >= 100 && value <= -0.9) {
        calculatedSentiments[criteria] = "overwhelmingly_negative";
      } else {
        // Not enough ratings to make a determination
        calculatedSentiments[criteria] = null;
      }
    });
    
    setSentiments(calculatedSentiments);
  }, [ratings, ratingsCount]);

  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      <h3 className="text-sm font-medium">Community Sentiment</h3>
      <div className="flex flex-wrap gap-3 justify-start">
        {Object.entries(sentiments).map(([criteria, sentiment]) => (
          <TooltipProvider key={criteria}>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border",
                    sentiment ? SENTIMENT_COLORS[sentiment] : "text-gray-400 opacity-50"
                  )}
                >
                  <span className="text-lg">
                    {CRITERIA_ICONS[criteria as keyof typeof CRITERIA_ICONS]}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-2 max-w-[220px]">
                <p className="font-medium">
                  {CRITERIA_DESCRIPTIONS[criteria as keyof typeof CRITERIA_DESCRIPTIONS]}
                </p>
                {sentiment ? (
                  <p className="text-sm mt-1">
                    {SENTIMENT_DESCRIPTIONS[sentiment]}: {ratings[criteria as keyof typeof ratings].toFixed(2)} 
                    <span className="text-xs ml-1">({ratingsCount} ratings)</span>
                  </p>
                ) : (
                  <p className="text-sm mt-1">Not enough ratings to determine sentiment</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}