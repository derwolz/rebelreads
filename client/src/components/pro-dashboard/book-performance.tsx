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
    hovers?: Array<{ date: string; count: number }>;
    referrals?: Array<{ date: string; count: number }>;
  };
}

interface BookPerformanceProps {
  performanceData: BookPerformanceItem[] | undefined;
  selectedBookIds: number[];
  selectedMetrics: MetricType[];
}

// Define colors for different metrics
const METRIC_COLORS = {
  impressions: "#4338ca", // indigo
  clicks: "#059669",      // emerald
  hovers: "#d97706",      // amber
  ctr: "#db2777",         // pink
};

// Define friendly display names for the metrics
const METRIC_DISPLAY_NAMES = {
  impressions: "Impressions",
  clicks: "Clicks",
  hovers: "Hovers",
  ctr: "Referrals"
};

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
      // Add hovers data when available
      if (book.metrics.hovers) {
        book.metrics.hovers.forEach(item => allDates.add(item.date));
      }
      // Add referrals data when available
      if (book.metrics.referrals) {
        book.metrics.referrals.forEach((item: { date: string; count: number }) => allDates.add(item.date));
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
        const bookTitle = title || `Book ${bookId}`;
        
        // If multiple books are selected, we add book-specific metrics
        // If only one book is selected, we simplify and just show metrics without book prefix
        const isMultiBook = selectedBookIds.length > 1;
        const prefix = isMultiBook ? `${bookTitle} - ` : "";
        
        // Add impressions data
        if (book.metrics.impressions && selectedMetrics.includes('impressions')) {
          const impression = book.metrics.impressions.find(item => item.date === date);
          const key = `${prefix}Impressions`;
          dataPoint[key] = impression ? Number(impression.count) : 0;
        }
        
        // Add clicks data
        if (book.metrics.clicks && selectedMetrics.includes('clicks')) {
          const click = book.metrics.clicks.find(item => item.date === date);
          const key = `${prefix}Clicks`;
          dataPoint[key] = click ? Number(click.count) : 0;
        }
        
        // Add hovers data if available
        if (book.metrics.hovers && selectedMetrics.includes('hovers')) {
          const hover = book.metrics.hovers.find(item => item.date === date);
          const key = `${prefix}Hovers`;
          dataPoint[key] = hover ? Number(hover.count) : 0;
        }
        
        // Add referrals/CTR data
        if (book.metrics.referrals && selectedMetrics.includes('ctr')) {
          const referral = book.metrics.referrals.find(item => item.date === date);
          const key = `${prefix}Referrals`;
          dataPoint[key] = referral ? Number(referral.count) : 0;
        }
      });
      
      return dataPoint;
    });
  }, [performanceData, selectedBookIds, selectedMetrics]);

  // Get book titles for better labeling
  const bookTitles = useMemo(() => {
    const titles: {[key: number]: string} = {};
    if (performanceData) {
      performanceData.forEach(book => {
        titles[book.bookId] = book.title || `Book ${book.bookId}`;
      });
    }
    return titles;
  }, [performanceData]);

  // Create line series for the chart
  const renderLineChartSeries = () => {
    // If no books selected, return empty
    if (selectedBookIds.length === 0) return null;

    // If a single book is selected, just show metric lines
    if (selectedBookIds.length === 1) {
      return selectedMetrics.map((metric) => {
        const metricName = METRIC_DISPLAY_NAMES[metric] || metric;
        return (
          <Line
            key={metric}
            type="monotone"
            dataKey={metricName}
            name={metricName}
            stroke={METRIC_COLORS[metric]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        );
      });
    }

    // If multiple books, show book-specific lines
    const lines: JSX.Element[] = [];
    
    selectedBookIds.forEach((bookId) => {
      const bookTitle = bookTitles[bookId] || `Book ${bookId}`;
      
      selectedMetrics.forEach((metric) => {
        const metricName = METRIC_DISPLAY_NAMES[metric] || metric;
        const lineKey = `${bookTitle} - ${metricName}`;
        
        lines.push(
          <Line
            key={`${bookId}_${metric}`}
            type="monotone"
            dataKey={lineKey}
            name={lineKey}
            stroke={METRIC_COLORS[metric]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        );
      });
    });
    
    return lines;
  };

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
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip formatter={(value: any) => (isNaN(Number(value)) ? '0' : value)} />
                <Legend />
                {renderLineChartSeries()}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Select a book to view performance metrics</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}