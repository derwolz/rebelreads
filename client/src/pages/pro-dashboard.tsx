import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ProDashboardSidebar } from "@/components/pro-dashboard-sidebar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
import { ReviewManagement } from "@/components/review-management";
import { ProBookManagement } from "@/components/pro-book-management";
import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Book } from "@shared/schema";

interface MetricsResponse {
  bookId: number;
  impressions: number;
  clicks: number;
  referrers: { [key: string]: number };
}

const METRICS = [
  { id: "impressions", label: "Impressions" },
  { id: "clicks", label: "Clicks" },
  { id: "referrals", label: "Referral Clicks" },
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
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(["impressions"]);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const { data: dashboardData } = useQuery({
    queryKey: ["/api/pro/dashboard"],
    queryFn: () => fetch("/api/pro/dashboard").then((res) => res.json()),
    enabled: !!user?.isAuthor,
  });

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: !!user?.isAuthor,
  });

  const { data: metricsData } = useQuery<MetricsResponse[]>({
    queryKey: ["/api/findmetrics", selectedBookIds, timeRange],
    queryFn: async () => {
      const response = await fetch("/api/findmetrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookIds: selectedBookIds,
          days: parseInt(timeRange),
        }),
      });
      return response.json();
    },
    enabled: !!user?.isAuthor && selectedBookIds.length > 0,
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

  // Process metrics data for the chart
  const chartData = metricsData?.map(metric => {
    const book = books?.find(b => b.id === metric.bookId);
    if (!book) return null;

    const dataPoint: any = {
      title: book.title,
    };

    if (selectedMetrics.includes("impressions")) {
      dataPoint[`${book.title}_impressions`] = metric.impressions;
    }
    if (selectedMetrics.includes("clicks")) {
      dataPoint[`${book.title}_clicks`] = metric.clicks;
    }
    if (selectedMetrics.includes("referrals")) {
      dataPoint[`${book.title}_referrals`] = Object.values(metric.referrers).reduce((a, b) => a + b, 0);
    }

    return dataPoint;
  }).filter(Boolean);

  const renderContent = () => {
    if (location === "/pro/reviews") {
      return <ReviewManagement />;
    }

    if (location === "/pro/book-management") {
      return <ProBookManagement />;
    }

    return (
      <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Author Analytics</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {dashboardData?.totalReviews}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {dashboardData?.averageRating.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {dashboardData?.recentReports}
              </p>
            </CardContent>
          </Card>
        </div>

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
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedBookIds.map((bookId) => {
                    const book = books?.find((b) => b.id === bookId);
                    if (!book) return null;

                    return selectedMetrics.map((metric) => {
                      const strokeStyle =
                        metric === "referrals"
                          ? "5 5"
                          : metric === "impressions"
                            ? "3 3"
                            : undefined;

                      return (
                        <Line
                          key={`${book.id}_${metric}`}
                          type="monotone"
                          dataKey={`${book.title}_${metric}`}
                          name={`${book.title} (${metric})`}
                          stroke={`hsl(${bookId * 30}, 70%, 50%)`}
                          strokeDasharray={strokeStyle}
                        />
                      );
                    });
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="h-full pt-8">
            <ProDashboardSidebar />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex gap-8">
        <div className="hidden md:block w-60">
          <ProDashboardSidebar />
        </div>

        <div className="flex-1 min-w-0">{renderContent()}</div>
      </div>
    </main>
  );
}