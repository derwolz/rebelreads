import React from "react";

/**
 * FloatingShape component represents a triangle shape with animation
 */
const FloatingShape = ({ className }: { className?: string }) => (
  <div
    style={{ transition: "all 0.1s ease-in-out" }}
    className={`absolute animate-float ${className}`}
  >
    <svg
      width="380"
      height="380"
      viewBox="0 0 120 120"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M60 10L110 95H10L60 10Z" />
    </svg>
  </div>
);

/**
 * CircleShape component with delayed floating animation
 */
const CircleShape = ({ className }: { className?: string }) => (
  <div
    className={`absolute transition-all duration-800 ease-in-out animate-float-delayed ${className}`}
  >
    <svg
      width="560"
      height="560"
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="40" />
    </svg>
  </div>
);

/**
 * SquareShape component with reverse floating animation
 */
const SquareShape = ({ className }: { className?: string }) => (
  <div
    className={`absolute transition-all duration-1350 ease-in-out animate-float-reverse ${className}`}
  >
    <svg
      width="540"
      height="540"
      viewBox="0 0 80 80"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="80" height="80" transform="rotate(45 40 40)" />
    </svg>
  </div>
);

/**
 * StarShape component with floating animation
 */
const StarShape = ({ className }: { className?: string }) => (
  <div
    className={`absolute transition-all duration-1400 ease-in-out animate-float ${className}`}
  >
    <svg
      width="520"
      height="520"
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 5L61 39H97L68 61L79 95L50 73L21 95L32 61L3 39H39L50 5Z" />
    </svg>
  </div>
);

/**
 * HexagonShape component with delayed floating animation
 */
const HexagonShape = ({ className }: { className?: string }) => (
  <div
    className={`absolute transition-all duration-1550 ease-in-out animate-float-delayed ${className}`}
  >
    <svg
      width="570"
      height="570"
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z" />
    </svg>
  </div>
);

interface FrostedGlassBackgroundProps {
  /**
   * Optional CSS class name to be applied to the background container
   */
  className?: string;
  
  /**
   * Blur intensity for the frosted glass effect
   * Default is "45px"
   */
  blurIntensity?: string;
  
  /**
   * Whether to show the frosted glass backdrop
   * Default is true
   */
  showBackdrop?: boolean;
  
  /**
   * Whether to make the background fixed position
   * Default is true
   */
  fixed?: boolean;
}

/**
 * FrostedGlassBackground component creates a decorative background with animated
 * geometric shapes and a frosted glass effect
 */
export function FrostedGlassBackground({
  className = "",
  blurIntensity = "45px",
  showBackdrop = true,
  fixed = true,
}: FrostedGlassBackgroundProps): React.JSX.Element {
  const positionClass = fixed ? "fixed" : "absolute";
  
  return (
    <>
      <div className={`${positionClass} inset-0 overflow-hidden pointer-events-none ${className}`}>
        <FloatingShape className="text-primary/30 top-1/3 left-[35%]" />
        <CircleShape className="text-[#40E0D0]/30 top-1/4 right-[40%]" />
        <SquareShape className="text-primary/35 bottom-[45%] left-[45%]" />
        <FloatingShape className="text-[#40E0D0]/20 bottom-[40%] right-[35%] rotate-180" />
        <CircleShape className="text-primary/20 top-[05%] left-[20%]" />
        <SquareShape className="text-primary/15 top-[35%] right-[45%] rotate-45" />
        <StarShape className="text-[#40E0D0]/20 bottom-[35%] right-[30%]" />
        <HexagonShape className="text-[#40E0D0]/20 top-[40%] left-[40%]" />
      </div>

      {showBackdrop && (
        <div 
          className={`${positionClass} inset-0 pointer-events-none`}
          style={{ backdropFilter: `blur(${blurIntensity})` }}
        />
      )}
    </>
  );
}