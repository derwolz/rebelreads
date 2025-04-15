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
  threshold = 0.1,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const element = elementRef.current;
    if (!element) return;
    
    // Set initial opacity to 0 for smoother start
    element.style.opacity = '0';
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When element is visible
        if (entry.isIntersecting) {
          // Add animation class and set opacity to 1
          element.style.opacity = '1';
          
          if (type !== 'none') {
            element.classList.add(`animate-${type}`);
          }

          // Remove element from observation once animation is applied
          observer.unobserve(element);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold, // Trigger when 10% of the element is visible by default
      }
    );
    
    observer.observe(element);
    
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
      className={`transition-opacity duration-1000 ${delayClass} ${className}`}
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
    
    // Set initial transform scale to 0.7 for growth animation
    chart.style.transform = 'scale(0.7)';
    chart.style.opacity = '0';
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Animate to full size
          chart.style.transform = 'scale(1)';
          chart.style.opacity = '1';
          
          // Remove element from observation once animation is applied
          observer.unobserve(chart);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );
    
    observer.observe(chart);
    
    return () => {
      if (chart) {
        observer.unobserve(chart);
      }
    };
  }, []);
  
  return (
    <div 
      ref={chartRef} 
      className={`transition-all duration-1000 ease-in-out ${className}`}
    >
      {children}
    </div>
  );
};