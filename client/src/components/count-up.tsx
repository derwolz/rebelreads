import { useState, useEffect, useRef } from 'react';

interface CountUpProps {
  end: number;
  duration: number; // in milliseconds
  suffix?: string;
  onComplete?: () => void;
}

export function CountUp({ end, duration, suffix = '', onComplete }: CountUpProps) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCompleteRef = useRef(false);

  useEffect(() => {
    // Reset when end changes
    startTimeRef.current = null;
    isCompleteRef.current = false;
    setCount(0);

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const currentCount = Math.floor(progress * end);

      setCount(currentCount);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setCount(end);
        isCompleteRef.current = true;
        if (onComplete) onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [end, duration, onComplete]);

  return (
    <>{count}{suffix}</>
  );
}