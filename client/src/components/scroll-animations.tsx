import React, { useEffect, useRef, ReactNode } from 'react';

type AnimationType = 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'grow' | 'none';
type AnimationDelay = 'none' | 'short' | 'medium' | 'long';

interface AnimateOnScrollProps {
  children: ReactNode;
  type?: AnimationType;
  delay?: AnimationDelay;
  className?: string;
  threshold?: number; // How much of the element should be visible before animating
}

export const AnimateOnScroll: React.FC<AnimateOnScrollProps> = ({
  children,
  type = 'fade-in',
  delay = 'none',
  className = '',
  threshold = 0.2, // Increased threshold for better visibility before animation
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const element = elementRef.current;
    if (!element) return;
    
    // Set initial opacity to 0 for smoother start
    element.style.opacity = '0';
    element.style.willChange = 'opacity, transform';
    
    // IMPORTANT FIX: Add pointer-events: none to prevent click blocking when invisible
    element.style.pointerEvents = 'none';
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When element is visible
        if (entry.isIntersecting) {
          // Add animation class based on type
          if (type === 'fade-in') {
            element.classList.add('animate-fade-in');
          } else if (type === 'slide-up') {
            element.classList.add('animate-slide-bottom');
          } else if (type === 'slide-left') {
            element.classList.add('animate-slide-left');
          } else if (type === 'slide-right') {
            element.classList.add('animate-slide-right');
          } else if (type === 'grow') {
            element.classList.add('animate-fade-scale');
          }
          
          // IMPORTANT FIX: Re-enable pointer events once animation starts
          // This ensures elements become interactive only when they're actually visible
          element.style.pointerEvents = 'auto';

          // Remove element from observation once animation is applied
          observer.unobserve(element);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold,
      }
    );
    
    // Small delay before observing to prevent flickering during page load
    setTimeout(() => {
      observer.observe(element);
    }, 100);
    
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [type, threshold]);
  
  // Calculate delay class based on prop
  const delayClass = delay === 'none' 
    ? '' 
    : delay === 'short' 
      ? 'animation-delay-200' 
      : delay === 'medium' 
        ? 'animation-delay-500' 
        : 'animation-delay-700';
  
  return (
    <div 
      ref={elementRef} 
      className={`${delayClass} ${className}`}
      style={{ opacity: 0, pointerEvents: 'none' /* Initial state: invisible and non-interactive */ }}
    >
      {children}
    </div>
  );
};

// Chart animation component specifically for growing charts
export const AnimatedChart: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const chart = chartRef.current;
    if (!chart) return;
    
    // Set initial styles for growth animation
    chart.style.transform = 'scale(0.7)';
    chart.style.opacity = '0';
    chart.style.willChange = 'transform, opacity';
    // IMPORTANT FIX: Add pointer-events: none to prevent click blocking when invisible
    chart.style.pointerEvents = 'none';
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Use the predefined animation class
          chart.classList.add('animate-grow-chart');
          
          // IMPORTANT FIX: Re-enable pointer events once animation starts
          // This ensures elements become interactive only when they're actually visible
          chart.style.pointerEvents = 'auto';
          
          // Remove element from observation once animation is applied
          observer.unobserve(chart);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.3, // Higher threshold for chart to ensure it's more visible
      }
    );
    
    // Small delay before observing to prevent flickering during page load
    setTimeout(() => {
      observer.observe(chart);
    }, 100);
    
    return () => {
      if (chart) {
        observer.unobserve(chart);
      }
    };
  }, []);
  
  return (
    <div 
      ref={chartRef} 
      className={className}
      style={{ opacity: 0, transform: 'scale(0.7)', pointerEvents: 'none' /* Initial state: invisible and non-interactive */ }}
    >
      {children}
    </div>
  );
};