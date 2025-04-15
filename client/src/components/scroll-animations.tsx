import React, { useEffect, useRef, useState } from "react";

interface AnimatedElementProps {
  children: React.ReactNode;
  animation: 
    | "fade-in" 
    | "slide-up" 
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "zoom-in"
    | "zoom-out"
    | "rotate"
    | "bounce"
    | "pulse"
    | "flip";
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  animation,
  delay = 0,
  duration = 0.7,
  threshold = 0.1,
  className = "",
  once = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If element should animate once and has already animated, do nothing
        if (once && hasAnimated) return;
        
        // Set visibility based on intersection
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) setHasAnimated(true);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasAnimated, once, threshold]);

  // Define animation classes
  const animationClasses: { [key: string]: string } = {
    "fade-in": "opacity-0 transition-opacity",
    "slide-up": "opacity-0 translate-y-8 transition-all",
    "slide-down": "opacity-0 -translate-y-8 transition-all",
    "slide-left": "opacity-0 translate-x-8 transition-all",
    "slide-right": "opacity-0 -translate-x-8 transition-all",
    "zoom-in": "opacity-0 scale-75 transition-all",
    "zoom-out": "opacity-0 scale-125 transition-all",
    "rotate": "opacity-0 rotate-90 transition-all",
    "bounce": "opacity-0 transition-all",
    "pulse": "opacity-0 transition-all",
    "flip": "opacity-0 rotateX-90 transition-all"
  };

  // Animation styles
  const style = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "none" : undefined,
    transitionDelay: `${delay}s`,
    transitionDuration: `${duration}s`,
    transitionProperty: "opacity, transform",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"
  };

  return (
    <div 
      ref={ref} 
      className={`${animationClasses[animation]} ${className} ${isVisible && animation === "bounce" ? "animate-bounce" : ""} ${isVisible && animation === "pulse" ? "animate-pulse" : ""}`}
      style={style}
    >
      {children}
    </div>
  );
};

// Staggered animation container for multiple child elements
interface StaggeredAnimationProps {
  children: React.ReactNode;
  animation: string;
  staggerDelay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  animation,
  staggerDelay = 0.1,
  duration = 0.7,
  threshold = 0.1,
  className = "",
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <AnimatedElement
          animation={animation as any}
          delay={staggerDelay * index}
          duration={duration}
          threshold={threshold}
        >
          {child}
        </AnimatedElement>
      ))}
    </div>
  );
};

// Parallax effect component for scroll-based animations
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  direction = 'vertical',
  className = "",
}) => {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const elementTop = ref.current.getBoundingClientRect().top;
      const elementHeight = ref.current.clientHeight;
      const windowHeight = window.innerHeight;
      
      // Calculate how far the element is from the center of the viewport
      const distanceFromCenter = elementTop - windowHeight / 2 + elementHeight / 2;
      
      // Set the offset based on the scroll position
      setOffset(distanceFromCenter * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize on mount
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return (
    <div 
      ref={ref} 
      className={`relative overflow-hidden ${className}`}
      style={{
        transform: direction === 'vertical' 
          ? `translateY(${offset}px)` 
          : `translateX(${offset}px)`,
        transition: 'transform 0.1s linear'
      }}
    >
      {children}
    </div>
  );
};

// Animation for tracking elements into view
export function useInView(options = {}) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return { ref: setRef, isInView };
}