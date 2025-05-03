import React from 'react';
import { cn } from '@/lib/utils';

interface SeashellRatingProps {
  score: number; // -3 to +3 scale
  className?: string;
}

export const SeashellRating: React.FC<SeashellRatingProps> = ({
  score,
  className,
}) => {
  // Constrain score to the valid range
  const normalizedScore = Math.max(-3, Math.min(3, score));
  
  // Generate an array of seashells based on the score
  const seashells = [];
  
  // Logic:
  // - Positive scores (1 to 3) show 1 to 3 purple seashells
  // - Negative scores (-1 to -3) show 1 to 3 red seashells
  // - Score of 0 shows no seashells
  const absScore = Math.abs(normalizedScore);
  const isPositive = normalizedScore > 0;
  const isNegative = normalizedScore < 0;
  
  // Add the appropriate number of seashells
  for (let i = 0; i < absScore; i++) {
    seashells.push(
      <div 
        key={i} 
        className={cn(
          "h-6 w-6", 
          isPositive ? "text-purple-500" : "text-red-500"
        )}
      >
        {/* SVG of a seashell */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.484 9.6c-.328-.295-.74-.519-1.16-.519-.525 0-1.09.382-1.496.077-.407-.304-.407-.81-.407-1.255 0-.764.261-1.523.68-2.124.287-.41.487-.896.487-1.45C19.588 3.6 18.8 3 17.878 3c-1.821 0-3.31 1.563-3.31 3.5v.128c-1.292-.972-2.52-1.942-3.57-2.856V5.69c0 1.165.699 2.305 2.058 3.152.855.535 1.92.899 2.994 1.231 1.997.617 4.065 1.256 5.566 2.779.71.722 1.07 1.518 1.07 2.37 0 1.249-1.12 2.47-3.059 3.35-1.72.779-4.038 1.208-6.535 1.208-5.081 0-9.096-1.954-9.096-4.43 0-1.358 1.383-2.598 3.78-3.399-.263-.156-.485-.295-.665-.42C5.015 9.98 3.069 8.67 3.069 6.75c0-1.946 1.28-2.533 3.021-2.533 1.878 0 3.971.442 5.72 1.184.307-.544.877-.915 1.509-.915.313 0 .617.089.879.256.263-.169.568-.256.88-.256.633 0 1.201.371 1.508.915 1.748-.742 3.84-1.184 5.717-1.184 1.742 0 3.023.587 3.023 2.533 0 .989-.5 1.7-1.313 2.37.485.42.975.868 1.437 1.372 2.106 2.292 3.551 4.66 3.551 4.66-.698-.044-1.365-.153-2.008-.297-.644.962-1.674 1.803-3.013 2.387-1.824.797-4.126 1.235-6.49 1.235-5.945 0-10.212-2.3-10.212-5.5 0-1.08.606-2.076 1.674-2.892-2.312-1.292-3.496-3.24-3.496-5.425 0-3.156 2.353-4.368 5.025-4.368 1.982 0 4.1.52 5.892 1.39.605-.501 1.364-.797 2.187-.797.31 0 .612.049.898.147.285-.097.586-.147.895-.147.823 0 1.582.296 2.188.797 1.794-.87 3.91-1.39 5.893-1.39 2.67 0 5.022 1.212 5.022 4.368 0 1.28-.462 2.428-1.212 3.394z" />
        </svg>
      </div>
    );
  }
  
  return (
    <div className={cn("flex items-center justify-center space-x-1", className)}>
      {/* Display text representation of the score */}
      <span className="sr-only">
        Rating: {normalizedScore} {normalizedScore === 1 ? 'seashell' : 'seashells'}
      </span>
      
      {/* Display the seashells */}
      {seashells.length > 0 ? (
        seashells
      ) : (
        <span className="text-muted-foreground text-sm">Neutral</span>
      )}
    </div>
  );
};

export default SeashellRating;