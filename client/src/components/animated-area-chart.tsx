import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface DataPoint {
  name: string;
  impressions: number;
  referrals: number;
  [key: string]: any;
}

interface AnimatedAreaChartProps {
  data: DataPoint[];
  width?: string | number;
  height?: number;
  margin?: { top: number; right: number; left: number; bottom: number };
  className?: string;
}

export const AnimatedAreaChart: React.FC<AnimatedAreaChartProps> = ({
  data,
  width = '100%',
  height = 300,
  margin = { top: 10, right: 30, left: 0, bottom: 0 },
  className = '',
}) => {
  const [animatedData, setAnimatedData] = useState<DataPoint[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Animation duration in milliseconds
  const animationDuration = 1500;
  
  // Start animation when chart becomes visible
  useEffect(() => {
    if (!chartRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.3,
      }
    );
    
    observer.observe(chartRef.current);
    
    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, []);
  
  // Handle the animation of data values
  useEffect(() => {
    if (!isVisible || animationComplete) return;
    
    // Initialize with zero values
    const initialData = data.map(item => ({
      ...item,
      impressions: 0,
      referrals: 0,
    }));
    
    setAnimatedData(initialData);
    
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Update data with interpolated values
      const newData = data.map((item, index) => {
        return {
          ...item,
          impressions: Math.floor(progress * item.impressions),
          referrals: Math.floor(progress * item.referrals),
        };
      });
      
      setAnimatedData(newData);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimationComplete(true);
        setAnimatedData(data); // Ensure final data is exact
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, data, animationComplete]);
  
  return (
    <div ref={chartRef} className={className}>
      <ResponsiveContainer width={width} height={height}>
        <AreaChart
          data={animatedData}
          margin={margin}
        >
          <defs>
            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A06CD5" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#A06CD5" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EFA738" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#EFA738" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#888888" />
          <YAxis stroke="#888888" />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              borderColor: "#333",
              color: "#fff",
            }}
          />
          <Area
            type="monotone"
            dataKey="impressions"
            stroke="#A06CD5"
            fillOpacity={1}
            fill="url(#colorImpressions)"
            name="Content Views"
          />
          <Area
            type="monotone"
            dataKey="referrals"
            stroke="#EFA738"
            fillOpacity={1}
            fill="url(#colorReferrals)"
            name="Reader Referrals"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};