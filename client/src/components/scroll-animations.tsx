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

// Chart animation component with slide in and count up effect
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
    
    // Set initial styles for slide animation
    chart.style.transform = 'translateX(-50px)';
    chart.style.opacity = '0';
    chart.style.willChange = 'transform, opacity';
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Apply slide-in animation to the chart
          chart.classList.add('animate-slide-chart');
          
          // Find all the text elements in the chart and add the count-up animation
          // This targets the text elements inside the chart (like axis labels and values)
          setTimeout(() => {
            const textElements = chart.querySelectorAll('text');
            textElements.forEach((el, index) => {
              // Skip axis labels (usually these are the first elements)
              if (index > 10) { // Skip some initial elements that might be axis labels
                // Store original text
                const originalText = el.textContent;
                if (originalText && !isNaN(parseFloat(originalText))) {
                  const value = parseFloat(originalText);
                  
                  // Start with 0
                  el.textContent = '0';
                  
                  // Add animation class
                  el.classList.add('animate-count-up');
                  
                  // Animate the number counting up
                  let start = 0 as number;
                  const duration = 1500; // 1.5 seconds
                  const step = (timestamp: number) => {
                    if (!start) start = timestamp;
                    const progress = Math.min((timestamp - start) / duration, 1);
                    const currentValue = Math.floor(progress * value);
                    el.textContent = currentValue.toString();
                    
                    if (progress < 1) {
                      window.requestAnimationFrame(step);
                    } else {
                      // Ensure final value is exactly as expected
                      el.textContent = originalText;
                    }
                  };
                  
                  // Delay the start of counting animation
                  setTimeout(() => {
                    window.requestAnimationFrame(step);
                  }, 500); // Start after slide-in is mostly complete
                }
              }
            });
          }, 1000); // Wait for slide-in animation to finish
          
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
      style={{ opacity: 0, transform: 'translateX(-50px)' }}
    >
      {children}
    </div>
  );
};