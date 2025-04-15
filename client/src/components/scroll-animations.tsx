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
      style={{ opacity: 0 }}
    >
      {children}
    </div>
  );
};

// Chart animation component with slide in animation
// The actual data line animation is handled by useState and useEffect in the page component
export const AnimatedChart: React.FC<{
  children: ReactNode;
  className?: string;
  onVisible?: () => void; // Callback for when the chart becomes visible
}> = ({ children, className = '', onVisible }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const chart = chartRef.current;
    if (!chart) return;
    
    // Set initial styles for slide animation
    chart.style.transform = 'translateX(-20px)';
    chart.style.opacity = '0';
    chart.style.willChange = 'transform, opacity';
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // First, slide in the entire chart container
          chart.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
          chart.style.transform = 'translateX(0)';
          chart.style.opacity = '1';
          
          // Call the onVisible callback after a slight delay to start data animation
          if (onVisible) {
            setTimeout(() => {
              onVisible();
            }, 800); // Wait for the slide-in animation to complete
          }
          
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
  }, [onVisible]);
  
  return (
    <div 
      ref={chartRef} 
      className={className}
      style={{ opacity: 0, transform: 'translateX(-20px)' }}
    >
      {children}
    </div>
  );
};