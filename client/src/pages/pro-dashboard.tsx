import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ReviewManagement } from "@/components/review-management";
import { ProBookManagement } from "@/components/pro-book-management";
import { ProAnalyticsWrapper } from "@/components/pro-analytics-wrapper";
import { ProLayout } from "@/components/pro-layout";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, AreaChart, Star } from "lucide-react";
import type { Book } from "@shared/schema";
import { Performance } from "@/components/pro-dashboard-performance";
import { PerformanceCompare } from "@/components/pro-dashboard-compare";
import { Ratings } from "@/components/pro-dashboard-ratings";
import { MetricType, METRICS } from "@/components/pro-dashboard/book-search";

// Define interfaces
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
  total: number;
  trending: Array<{ 
    date: string; 
    followers: number; 
    unfollows: number;
    netChange: number;
  }>;
}

interface ProDashboardData {
  totalReviews: number;
  averageRating: number;
  recentReports: number;
}

const TIME_RANGES = [
  { value: "7", label: "Last Week" },
  { value: "30", label: "Last Month" },
  { value: "90", label: "Last 3 Months" },
  { value: "365", label: "Last Year" },
] as const;

export default function ProDashboard() {
  const { user, isAuthor } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(["impressions"]);
  const [timeRange, setTimeRange] = useState("30");
  const [activeTab, setActiveTab] = useState("performance");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[] | null>(null);

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: isAuthor,
  });
  
  // Handle book search
  const handleSearch = () => {
    if (!books) return;
    
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = books.filter(book => 
      book.title.toLowerCase().includes(query)
    );
    
    console.log("searchResults", filtered);
    setSearchResults(filtered);
  };
  
  // Reset search when query is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
    }
  }, [searchQuery]);

  const { data: performanceData } = useQuery<BookPerformance[]>({
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
    enabled: isAuthor && selectedBookIds.length > 0,
  });
  
  const { data: dashboardData } = useQuery<ProDashboardData>({
    queryKey: ["/api/pro/dashboard"],
    enabled: isAuthor,
  });

  const { data: followerData } = useQuery<FollowerAnalytics>({
    queryKey: ["/api/pro/follower-metrics", timeRange],
    queryFn: () => fetch(`/api/pro/follower-metrics?timeRange=${timeRange}`).then((res) => res.json()),
    enabled: isAuthor,
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              console.log(`Timeframe changed to: ${value} days`);
              setTimeRange(value);
            }}
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <AreaChart className="h-4 w-4" />
              <span>Compare</span>
            </TabsTrigger>
            <TabsTrigger value="ratings" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Ratings</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Performance Tab */}
          <TabsContent value="performance">
            <Performance 
              books={books}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedBookIds={selectedBookIds}
              handleBookSelect={handleBookSelect}
              selectedMetrics={selectedMetrics}
              handleMetricToggle={handleMetricToggle}
              performanceData={performanceData}
              followerData={followerData}
            />
          </TabsContent>
          
          {/* Compare Tab */}
          <TabsContent value="compare">
            <PerformanceCompare 
              books={books}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedBookIds={selectedBookIds}
              handleBookSelect={handleBookSelect}
              searchResults={searchResults}
              handleSearch={handleSearch}
            />
          </TabsContent>
          
          {/* Ratings Tab */}
          <TabsContent value="ratings">
            <Ratings 
              books={books}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedBookIds={selectedBookIds}
              handleBookSelect={handleBookSelect}
              searchResults={searchResults}
              handleSearch={handleSearch}
            />
          </TabsContent>
        </Tabs>
      </div>
    );

    return <ProAnalyticsWrapper>{analyticsContent}</ProAnalyticsWrapper>;
  };

  return (
    <ProLayout>
      {renderContent()}
    </ProLayout>
  );
}