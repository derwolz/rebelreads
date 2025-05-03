import React from 'react';
import { cn } from '@/lib/utils';

// Icons for the compatibility rating
const ShellIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn("w-5 h-5", className)}
  >
    <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
    <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
  </svg>
);

interface SeashellRatingProps {
  compatibilityScore: number;  // Range from -3 to 3
  isLoggedIn: boolean;
  className?: string;
}

/**
 * SeashellRating Component
 * 
 * Visualizes the compatibility between users using a shell icon system.
 * - Positive compatibility (1 to 3): Shows purple shells
 * - Negative compatibility (-1 to -3): Shows red shells
 * - For non-logged in users: Shows blurred placeholder
 * 
 * @param compatibilityScore - Ranges from -3 (incompatible) to 3 (highly compatible)
 * @param isLoggedIn - Whether the current user is logged in
 */
export const SeashellRating: React.FC<SeashellRatingProps> = ({
  compatibilityScore,
  isLoggedIn,
  className,
}) => {
  // Define 3 shells (empty by default)
  const shells = Array(3).fill(0);
  
  // Determine the number of filled shells based on absolute score
  const filledCount = Math.abs(compatibilityScore);
  
  // Determine color class based on compatibility direction
  const colorClass = compatibilityScore >= 0 
    ? 'text-purple-500' // positive compatibility
    : 'text-red-500';   // negative compatibility

  if (!isLoggedIn) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="text-sm text-muted-foreground">Compatibility</div>
        <div className="flex gap-1 filter blur-sm">
          {shells.map((_, i) => (
            <ShellIcon key={i} className="text-gray-400" />
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Login to discover your compatibility
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="text-sm font-medium">Compatibility</div>
      <div className="flex gap-1">
        {shells.map((_, i) => (
          <ShellIcon 
            key={i} 
            className={cn(
              i < filledCount ? colorClass : "text-gray-300"
            )} 
          />
        ))}
      </div>
      <div className="text-xs">
        {compatibilityScore === 3 && "Overwhelmingly compatible"}
        {compatibilityScore === 2 && "Very compatible"}
        {compatibilityScore === 1 && "Compatible"}
        {compatibilityScore === 0 && "Neutral compatibility"}
        {compatibilityScore === -1 && "Slight differences"}
        {compatibilityScore === -2 && "Very different tastes"}
        {compatibilityScore === -3 && "Overwhelmingly different"}
      </div>
    </div>
  );
};