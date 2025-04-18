import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ReviewManagement } from "@/components/review-management";
import { ProBookManagement } from "@/components/pro-book-management";
import { ProAnalyticsWrapper } from "@/components/pro-analytics-wrapper";
import { ProLayout } from "@/components/pro-layout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, AreaChart, Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const { user, isAuthor } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "impressions",
  ]);
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
    enabled: isAuthor && selectedBookIds.length > 0,
  });
  console.log("performanceData", performanceData);
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

  // The API now returns data already in the format Recharts needs
  const chartData = performanceData;

  const followerChartData = (() => {
    if (!followerData || !followerData.trending) return [];

    // Format date for display
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    };

    // The backend now provides daily followers and unfollows directly
    return followerData.trending.map((item) => {
      return {
        date: formatDate(item.date),
        followers: isFinite(Number(item.followers)) ? Number(item.followers) : 0,
        unfollows: isFinite(Number(item.unfollows)) ? Number(item.unfollows) : 0,
        netChange: isFinite(Number(item.netChange)) ? Number(item.netChange) : 0
      };
    });
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
          <TabsContent value="performance" className="space-y-6">
            {/* Book search section */}
            <Card>
              <CardHeader>
                <CardTitle>Book Search</CardTitle>
                <CardDescription>
                  Search for your books to analyze their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
                  <Input 
                    type="text" 
                    placeholder="Search your books..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {(searchResults || books)?.map((book) => (
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
                
                <div className="flex flex-wrap gap-4 mt-4">
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
              </CardContent>
            </Card>
            
            {/* Analytics charts - now in a flex row wrap layout */}
            <div className="flex flex-row flex-wrap gap-4">
              {/* Book Performance Analytics Card - now 50% width on larger screens */}
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

              {/* Follower Growth Analytics Card - now 50% width on larger screens */}
              <Card className="w-full md:w-[calc(50%-8px)]">
                <CardHeader>
                  <CardTitle>Follower Growth Analytics</CardTitle>
                  <CardDescription>
                    Track your follower growth over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={followerChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip formatter={(value: any) => (isNaN(Number(value)) ? '0' : value)} />
                        <Legend />
                        <Bar
                          dataKey="followers"
                          fill="hsl(145, 70%, 50%)"
                          name="New Followers"
                        />
                        <Bar
                          dataKey="unfollows"
                          fill="hsl(0, 70%, 50%)"
                          name="Unfollows"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-6">
            {/* Book search for comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Book Search for Comparison</CardTitle>
                <CardDescription>
                  Select books to compare with similar titles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
                  <Input 
                    type="text" 
                    placeholder="Search your books..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {(searchResults || books)?.map((book) => (
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
              </CardContent>
            </Card>
            
            {/* Book comparison cards - in flex layout */}
            <div className="flex flex-row flex-wrap gap-4">
              <Card className="w-full md:w-[calc(50%-8px)]">
                <CardHeader>
                  <CardTitle>Book Comparison</CardTitle>
                  <CardDescription>
                    Compare your books to the conversion values of similar novels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md mb-2">
                      We're currently building a system that will let you compare your books with similar titles 
                      based on genre taxonomy and conversion metrics.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="w-full md:w-[calc(50%-8px)]">
                <CardHeader>
                  <CardTitle>Market Position</CardTitle>
                  <CardDescription>
                    See where your books stand in the market
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      This feature will help you understand how your books perform compared to similar titles in the market.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Ratings Tab */}
          <TabsContent value="ratings" className="space-y-6">
            {/* Book search for ratings */}
            <Card>
              <CardHeader>
                <CardTitle>Book Ratings Search</CardTitle>
                <CardDescription>
                  Find ratings and reviews for your books
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
                  <Input 
                    type="text" 
                    placeholder="Search your books..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {(searchResults || books)?.map((book) => (
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
              </CardContent>
            </Card>
            
            {/* Ratings analytics cards - in flex layout */}
            <div className="flex flex-row flex-wrap gap-4">
              <Card className="w-full md:w-[calc(50%-8px)]">
                <CardHeader>
                  <CardTitle>Ratings Trends</CardTitle>
                  <CardDescription>
                    Track ratings over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md mb-2">
                      We're building a comprehensive analytics system to track your book ratings over time.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="w-full md:w-[calc(50%-8px)]">
                <CardHeader>
                  <CardTitle>Review Analysis</CardTitle>
                  <CardDescription>
                    Analyze your reviews for insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      This will provide insights into how readers are responding to your books and help you identify trends.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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