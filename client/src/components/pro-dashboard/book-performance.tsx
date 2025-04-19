import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MetricType } from "./book-search";

interface BookPerformanceItem {
  bookId: number;
  title: string;
  metrics: {
    impressions?: Array<{ date: string; count: number }>;
    clicks?: Array<{ date: string; count: number }>;
    referrals?: Array<{ date: string; count: number }>;
  };
}

interface BookPerformanceProps {
  performanceData: BookPerformanceItem[] | undefined;
  selectedBookIds: number[];
  selectedMetrics: MetricType[];
}

export function BookPerformance({ 
  performanceData, 
  selectedBookIds, 
  selectedMetrics 
}: BookPerformanceProps) {
  // Transform the API response data into the format Recharts expects
  const chartData = useMemo(() => {
    if (!performanceData || performanceData.length === 0) return [];
    
    // Get all dates from all books and metrics
    const allDates = new Set<string>();
    
    // Collect all dates from all books and metrics
    performanceData.forEach(book => {
      if (book.metrics.impressions) {
        book.metrics.impressions.forEach(item => allDates.add(item.date));
      }
      if (book.metrics.clicks) {
        book.metrics.clicks.forEach(item => allDates.add(item.date));
      }
      if (book.metrics.referrals) {
        book.metrics.referrals.forEach(item => allDates.add(item.date));
      }
    });
    
    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort();
    
    // Create a map of dates to data points
    return sortedDates.map(date => {
      // Start with the date
      const dataPoint: any = { date };
      
      // Add data for each book and metric
      performanceData.forEach(book => {
        const { bookId, title } = book;
        
        // Add impressions data
        if (book.metrics.impressions && selectedMetrics.includes('impressions')) {
          const impression = book.metrics.impressions.find(item => item.date === date);
          dataPoint[`Book ${bookId} (impressions)`] = impression ? Number(impression.count) : 0;
        }
        
        // Add clicks data
        if (book.metrics.clicks && selectedMetrics.includes('clicks')) {
          const click = book.metrics.clicks.find(item => item.date === date);
          dataPoint[`Book ${bookId} (clicks)`] = click ? Number(click.count) : 0;
        }
        
        // Add referrals/CTR data
        if (book.metrics.referrals && selectedMetrics.includes('ctr')) {
          const referral = book.metrics.referrals.find(item => item.date === date);
          dataPoint[`Book ${bookId} (ctr)`] = referral ? Number(referral.count) : 0;
        }
      });
      
      return dataPoint;
    });
  }, [performanceData, selectedMetrics]);

  return (
    <Card className="w-full md:w-[calc(50%-8px)]">
      <CardHeader>
        <CardTitle>Book Performance Analytics</CardTitle>
        <CardDescription>
          Track your book performance metrics over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip formatter={(value: any) => (isNaN(Number(value)) ? '0' : value)} />
              <Legend />
              {selectedBookIds.map((bookId) =>
                selectedMetrics.map((metric) => (
                  <Line
                    key={`${bookId}_${metric}`}
                    type="monotone"
                    dataKey={`Book ${bookId} (${metric})`}
                    name={`Book ${bookId} (${metric})`}
                    stroke={`hsl(${bookId * 30}, 70%, 50%)`}
                  />
                )),
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}