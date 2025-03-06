import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainNav } from "@/components/main-nav";
import { ProDashboardSidebar } from "@/components/pro-dashboard-sidebar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
import { ProAuthorSettings } from "@/components/pro-author-settings";
import { useState } from "react";
import type { Book } from "@shared/schema";

interface BookPerformance {
  bookId: number;
  title: string;
  metrics: {
    impressions?: Array<{ date: string; count: number }>;
    clicks?: Array<{ date: string; count: number }>;
    referrals?: Array<{ date: string; count: number }>;
  };
}

interface ProDashboardData {
  totalReviews: number;
  averageRating: number;
  recentReports: number;
}

const METRICS = [
  { id: 'impressions', label: 'Impressions' },
  { id: 'clicks', label: 'Clicks' },
  { id: 'referrals', label: 'Referral Clicks' }
] as const;

type MetricType = typeof METRICS[number]['id'];

export default function ProDashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['impressions']);
  const [timeRange, setTimeRange] = useState("30"); // days

  const { data: dashboardData } = useQuery<ProDashboardData>({
    queryKey: ["/api/pro/dashboard"],
    enabled: !!user?.isAuthor,
  });

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: !!user?.isAuthor,
  });

  const { data: performanceData } = useQuery<BookPerformance[]>({
    queryKey: ["/api/pro/book-performance", selectedBookIds, selectedMetrics, timeRange],
    enabled: !!user?.isAuthor && selectedBookIds.length > 0,
  });

  const handleBookSelect = (bookId: number) => {
    if (selectedBookIds.includes(bookId)) {
      setSelectedBookIds(selectedBookIds.filter(id => id !== bookId));
    } else if (selectedBookIds.length < 5) {
      setSelectedBookIds([...selectedBookIds, bookId]);
    }
  };

  const handleMetricToggle = (metric: MetricType) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  // Transform performance data for the chart
  const chartData = performanceData?.reduce((acc: any[], book) => {
    const dates = new Set(
      Object.values(book.metrics).flatMap(metric => 
        metric?.map(entry => entry.date) || []
      )
    );

    dates.forEach(date => {
      const existingDate = acc.find(d => d.date === date);
      if (existingDate) {
        if (book.metrics.impressions && selectedMetrics.includes('impressions')) {
          existingDate[`${book.title}_impressions`] = 
            book.metrics.impressions.find(i => i.date === date)?.count || 0;
        }
        if (book.metrics.clicks && selectedMetrics.includes('clicks')) {
          existingDate[`${book.title}_clicks`] = 
            book.metrics.clicks.find(c => c.date === date)?.count || 0;
        }
        if (book.metrics.referrals && selectedMetrics.includes('referrals')) {
          existingDate[`${book.title}_referrals`] = 
            book.metrics.referrals.find(r => r.date === date)?.count || 0;
        }
      } else {
        const newEntry: any = { date };
        if (book.metrics.impressions && selectedMetrics.includes('impressions')) {
          newEntry[`${book.title}_impressions`] = 
            book.metrics.impressions.find(i => i.date === date)?.count || 0;
        }
        if (book.metrics.clicks && selectedMetrics.includes('clicks')) {
          newEntry[`${book.title}_clicks`] = 
            book.metrics.clicks.find(c => c.date === date)?.count || 0;
        }
        if (book.metrics.referrals && selectedMetrics.includes('referrals')) {
          newEntry[`${book.title}_referrals`] = 
            book.metrics.referrals.find(r => r.date === date)?.count || 0;
        }
        acc.push(newEntry);
      }
    });

    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const renderContent = () => {
    if (location === "/pro/reviews") {
      return <ReviewManagement />;
    }

    if (location === "/pro/author-settings") {
      return <ProAuthorSettings />;
    }

    // Default analytics view
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
              <p className="text-3xl font-bold">{dashboardData?.totalReviews}</p>
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
              <p className="text-3xl font-bold">{dashboardData?.recentReports}</p>
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
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                {books?.map((book) => (
                  <Button
                    key={book.id}
                    variant={selectedBookIds.includes(book.id) ? "default" : "outline"}
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
                  {selectedBookIds.map((bookId) => {
                    const book = books?.find(b => b.id === bookId);
                    if (!book) return null;

                    return selectedMetrics.map(metric => {
                      const strokeStyle = metric === 'referrals' ? "5 5" 
                        : metric === 'impressions' ? "3 3" 
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
    <div>
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="hidden md:block">
            <ProDashboardSidebar />
          </div>

          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>

          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}