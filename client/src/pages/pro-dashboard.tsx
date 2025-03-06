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
import { useLocation } from "wouter";
import { ReviewManagement } from "@/components/review-management";
import { ProAuthorSettings } from "@/components/pro-author-settings";
import { useState, useEffect } from "react";
import { DndContext, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ReviewBoostWizard } from "@/components/review-boost-wizard";
import { format } from "date-fns";
import type { Book } from "@shared/schema";

interface BookAnalytics {
  bookId: number;
  title: string;
  metrics: {
    impressions: Array<{ date: string; count: number }>;
    clickThroughs: Array<{ date: string; count: number }>;
    referralClicks: Array<{ date: string; count: number }>;
  };
}

interface ProDashboardData {
  totalReviews: number;
  averageRating: number;
  recentReports: number;
}

export default function ProDashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState("30"); // days
  const [isReviewBoostOpen, setIsReviewBoostOpen] = useState(false);

  const { data: dashboardData } = useQuery<ProDashboardData>({
    queryKey: ["/api/pro/dashboard"],
    enabled: !!user?.isAuthor,
  });

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: !!user?.isAuthor,
  });

  const { data: analyticsData } = useQuery<BookAnalytics[]>({
    queryKey: ["/api/pro/book-analytics", selectedBookIds, timeRange],
    enabled: !!user?.isAuthor && selectedBookIds.length > 0,
  });

  const handleBookSelect = (bookId: number) => {
    if (selectedBookIds.includes(bookId)) {
      setSelectedBookIds(selectedBookIds.filter(id => id !== bookId));
    } else if (selectedBookIds.length < 5) {
      setSelectedBookIds([...selectedBookIds, bookId]);
    }
  };

  // Transform analytics data for the chart
  const chartData = analyticsData?.reduce((acc: any[], book) => {
    const dates = new Set([
      ...book.metrics.impressions.map(i => i.date),
      ...book.metrics.clickThroughs.map(c => c.date),
      ...book.metrics.referralClicks.map(r => r.date)
    ]);

    dates.forEach(date => {
      const existingDate = acc.find(d => d.date === date);
      if (existingDate) {
        existingDate[`${book.title}_impressions`] = 
          book.metrics.impressions.find(i => i.date === date)?.count || 0;
        existingDate[`${book.title}_clicks`] = 
          book.metrics.clickThroughs.find(c => c.date === date)?.count || 0;
        existingDate[`${book.title}_referrals`] = 
          book.metrics.referralClicks.find(r => r.date === date)?.count || 0;
      } else {
        acc.push({
          date,
          [`${book.title}_impressions`]: book.metrics.impressions.find(i => i.date === date)?.count || 0,
          [`${book.title}_clicks`]: book.metrics.clickThroughs.find(c => c.date === date)?.count || 0,
          [`${book.title}_referrals`]: book.metrics.referralClicks.find(r => r.date === date)?.count || 0
        });
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
                    return (
                      <>
                        <Line
                          type="monotone"
                          dataKey={`${book.title}_impressions`}
                          name={`${book.title} (Impressions)`}
                          stroke={`hsl(${bookId * 30}, 70%, 50%)`}
                          strokeDasharray="3 3"
                        />
                        <Line
                          type="monotone"
                          dataKey={`${book.title}_clicks`}
                          name={`${book.title} (Clicks)`}
                          stroke={`hsl(${bookId * 30}, 70%, 50%)`}
                        />
                        <Line
                          type="monotone"
                          dataKey={`${book.title}_referrals`}
                          name={`${book.title} (Referrals)`}
                          stroke={`hsl(${bookId * 30}, 70%, 50%)`}
                          strokeDasharray="5 5"
                        />
                      </>
                    );
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