import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ProDashboardSidebar } from "@/components/pro-dashboard-sidebar";
import { ReviewManagement } from "@/components/review-management";
import { ProBookManagement } from "@/components/pro-book-management";
import { ProAnalyticsWrapper } from "@/components/pro-analytics-wrapper";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Book } from "@shared/schema";

interface MetricsResponse {
  date: string;
  [key: string]: number | string;
}

const METRICS = [
  { id: "impressions", label: "Impressions" },
  { id: "clicks", label: "Clicks" },
  { id: "ctr", label: "CTR" },
] as const;

type MetricType = (typeof METRICS)[number]["id"];

const TIME_RANGES = [
  { value: "7", label: "Last Week" },
  { value: "30", label: "Last Month" },
  { value: "90", label: "Last 3 Months" },
  { value: "365", label: "Last Year" },
] as const;

export default function ProDashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "impressions",
  ]);
  const [timeRange, setTimeRange] = useState("30");

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: !!user?.isAuthor,
  });

  const { data: performanceData } = useQuery<MetricsResponse[]>({
    queryKey: ["/api/pro/metrics", selectedBookIds, timeRange, selectedMetrics],
    queryFn: async () => {
      const response = await fetch("/api/pro/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookIds: selectedBookIds,
          days: parseInt(timeRange),
          metrics: selectedMetrics,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }
      return response.json();
    },
    enabled: !!user?.isAuthor && selectedBookIds.length > 0,
  });
  console.log("performanceData", performanceData);
  const { data: dashboardData } = useQuery<ProDashboardData>({
    queryKey: ["/api/pro/dashboard"],
    enabled: !!user?.isAuthor,
  });

  const { data: followerData } = useQuery<FollowerAnalytics>({
    queryKey: ["/api/pro/follower-metrics", timeRange],
    queryFn: () => fetch("/api/pro/follower-metrics").then((res) => res.json()),
    enabled: !!user?.isAuthor,
  });

  const handleBookSelect = (bookId: number) => {
    if (selectedBookIds.includes(bookId)) {
      setSelectedBookIds(selectedBookIds.filter((id) => id !== bookId));
    } else if (selectedBookIds.length < 5) {
      setSelectedBookIds([...selectedBookIds, bookId]);
    }
  };

  const handleMetricToggle = (metric: MetricType) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const chartData = performanceData?.map((item) => {
    // Start with the date
    const processedData: { [key: string]: string | number } = {
      date: item.date,
    };

    // For each selected book and metric combination
    selectedBookIds.forEach((bookId) => {
      selectedMetrics.forEach((metric) => {
        const key = `Book ${bookId}_${metric}`;
        // Convert string values to numbers and default to 0 if missing
        processedData[key] = item[key]
          ? parseFloat(item[key] as string) || 0
          : 0;
      });
    });

    return processedData;
  });

  const followerChartData = (() => {
    if (!followerData) return [];

    const dates = new Set([
      ...followerData.follows.map((f) => f.date),
      ...followerData.unfollows.map((u) => u.date),
    ]);

    return Array.from(dates)
      .map((date) => {
        const follows =
          followerData.follows.find((f) => f.date === date)?.count || 0;
        const unfollows =
          followerData.unfollows.find((u) => u.date === date)?.count || 0;
        return {
          date,
          "New Followers": follows,
          "Lost Followers": unfollows,
          "Net Change": follows - unfollows,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  const renderContent = () => {
    if (location === "/pro/reviews") {
      return <ReviewManagement />;
    }

    if (location === "/pro/book-management") {
      return <ProBookManagement />;
    }

    // Analytics dashboard with Pro check
    const analyticsContent = (
      <div className="flex-1 space-y-8">
       
       <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Book Performance Analytics</CardTitle>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Select
                  value={timeRange}
                  onValueChange={(value) => setTimeRange(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                {books?.map((book) => (
                  <Button
                    key={book.id}
                    variant={
                      selectedBookIds.includes(book.id) ? "default" : "outline"
                    }
                    onClick={() => handleBookSelect(book.id)}
                    className="text-sm"
                  >
                    {book.title}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {METRICS.map((metric) => (
                  <div key={metric.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.id}
                      checked={selectedMetrics.includes(metric.id)}
                      onCheckedChange={() => handleMetricToggle(metric.id)}
                    />
                    <label
                      htmlFor={metric.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {metric.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedBookIds.map((bookId) =>
                    selectedMetrics.map((metric) => (
                      <Line
                        key={`${bookId}_${metric}`}
                        type="monotone"
                        dataKey={`Book ${bookId}_${metric}`}
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

        <Card>
          <CardHeader>
            <CardTitle>Follower Growth Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={followerChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="New Followers"
                    fill="hsl(145, 70%, 50%)"
                    stackId="stack"
                  />
                  <Bar
                    dataKey="Lost Followers"
                    fill="hsl(0, 70%, 50%)"
                    stackId="stack"
                  />
                  <Line
                    type="monotone"
                    dataKey="Net Change"
                    stroke="hsl(200, 70%, 50%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(200, 70%, 50%)" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );

    return <ProAnalyticsWrapper>{analyticsContent}</ProAnalyticsWrapper>;
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="h-full pt-8">
            <ProDashboardSidebar />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-60">
          <ProDashboardSidebar />
        </div>

        <div className="flex-1 min-w-0">{renderContent()}</div>
      </div>
    </main>
  );
}

interface BookPerformance {
  bookId: number;
  title: string;
  metrics: {
    impressions?: Array<{ date: string; count: number }>;
    clicks?: Array<{ date: string; count: number }>;
    referrals?: Array<{ date: string; count: number }>;
  };
}

interface FollowerAnalytics {
  follows: Array<{ date: string; count: number }>;
  unfollows: Array<{ date: string; count: number }>;
}

interface ProDashboardData {
  totalReviews: number;
  averageRating: number;
  recentReports: number;
}
