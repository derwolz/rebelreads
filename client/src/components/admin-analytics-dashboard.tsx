import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Users, 
  BookOpen, 
  MousePointerClick, 
  Clock, 
  Search,
  FileSpreadsheet,
  BarChart4,
  Loader2
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Search component for authors/books
const AnalyticsSearch = ({ onSearch }: { onSearch: (authorId?: number, bookId?: number) => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: any) => {
    if (result.type === 'author') {
      onSearch(result.id, undefined);
    } else if (result.type === 'book') {
      onSearch(result.authorId, result.id);
    }
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search for authors or books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} variant="outline" className="flex-shrink-0">
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      
      {searchResults.length > 0 && (
        <div className="border rounded-md shadow-sm bg-white dark:bg-gray-800 p-2 absolute z-10 w-full max-h-60 overflow-y-auto">
          {searchResults.map((result) => (
            <div 
              key={`${result.type}-${result.id}`}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md"
              onClick={() => handleSelectResult(result)}
            >
              {result.type === 'author' ? (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <div>
                    <p className="font-medium">{result.displayName || result.username}</p>
                    <p className="text-xs text-gray-500">{result.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <div>
                    <p className="font-medium">{result.title}</p>
                    <p className="text-xs text-gray-500">by {result.author}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// User Statistics Component
const UserStatistics = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/analytics/user-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics/user-stats');
      if (!res.ok) throw new Error('Failed to fetch user stats');
      return res.json();
    }
  });

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500 p-4">Error loading user statistics</div>;

  const userStats = [
    { name: 'Total Users', value: data.totalUsers, icon: <Users className="h-5 w-5" /> },
    { name: 'Total Authors', value: data.totalAuthors, icon: <BookOpen className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">{stat.icon}</div>
              <div>
                <p className="text-sm font-medium">{stat.name}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Page Views Component
const PageViewsAnalytics = ({ authorId }: { authorId?: number }) => {
  const [timeRange, setTimeRange] = useState("30");
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/analytics/page-views', timeRange, authorId],
    queryFn: async () => {
      let url = `/api/admin/analytics/page-views?days=${timeRange}`;
      if (authorId) url += `&authorId=${authorId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch page views');
      return res.json();
    }
  });

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500 p-4">Error loading page views</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 Days</SelectItem>
            <SelectItem value="14">14 Days</SelectItem>
            <SelectItem value="30">30 Days</SelectItem>
            <SelectItem value="90">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page views by URL */}
        <Card>
          <CardHeader>
            <CardTitle>Most Viewed Pages</CardTitle>
            <CardDescription>Top pages by view count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.pageViewsByUrl.slice(0, 10)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="pageUrl" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Views']} labelFormatter={(label) => `Page: ${label}`} />
                  <Bar dataKey="count" name="Views" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Average duration by URL */}
        <Card>
          <CardHeader>
            <CardTitle>Time Spent on Pages</CardTitle>
            <CardDescription>Average duration in seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.pageViewsByUrl.slice(0, 10)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="pageUrl" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Seconds']} labelFormatter={(label) => `Page: ${label}`} />
                  <Bar dataKey="avgDuration" name="Avg. Duration (sec)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Page views over time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Page Views Over Time</CardTitle>
            <CardDescription>Daily page views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.pageViewsByDate}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Views']} />
                  <Line type="monotone" dataKey="count" name="Page Views" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Author Actions Component
const AuthorActionsAnalytics = ({ authorId }: { authorId?: number }) => {
  const [timeRange, setTimeRange] = useState("30");
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/analytics/author-actions', timeRange, authorId],
    queryFn: async () => {
      let url = `/api/admin/analytics/author-actions?days=${timeRange}`;
      if (authorId) url += `&authorId=${authorId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch author actions');
      return res.json();
    }
  });

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500 p-4">Error loading author actions</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 Days</SelectItem>
            <SelectItem value="14">14 Days</SelectItem>
            <SelectItem value="30">30 Days</SelectItem>
            <SelectItem value="90">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions by type */}
        <Card>
          <CardHeader>
            <CardTitle>Author Actions by Type</CardTitle>
            <CardDescription>Frequency of different actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.actionsByType}
                    dataKey="count"
                    nameKey="actionType"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={(entry) => entry.actionType}
                  >
                    {data.actionsByType.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Actions over time */}
        <Card>
          <CardHeader>
            <CardTitle>Author Actions Over Time</CardTitle>
            <CardDescription>Daily action frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.actionsByDate}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Actions']} />
                  <Line type="monotone" dataKey="count" name="Actions" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Form Analytics Component
const FormAnalytics = ({ authorId }: { authorId?: number }) => {
  const [timeRange, setTimeRange] = useState("30");
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/analytics/form-data', timeRange, authorId],
    queryFn: async () => {
      let url = `/api/admin/analytics/form-data?days=${timeRange}`;
      if (authorId) url += `&authorId=${authorId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch form data');
      return res.json();
    }
  });

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500 p-4">Error loading form analytics</div>;
  if (!data?.length) return <div className="p-4 text-center">No form data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 Days</SelectItem>
            <SelectItem value="14">14 Days</SelectItem>
            <SelectItem value="30">30 Days</SelectItem>
            <SelectItem value="90">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form completion rates */}
        <Card>
          <CardHeader>
            <CardTitle>Form Completion Rates</CardTitle>
            <CardDescription>Percentage of completed forms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formId" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                  <Tooltip formatter={(value) => [`${Math.round(Number(value) * 100)}%`, 'Completion Rate']} />
                  <Bar dataKey="completionRate" name="Completion Rate" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Form usage stats */}
        <Card>
          <CardHeader>
            <CardTitle>Form Usage Statistics</CardTitle>
            <CardDescription>Started vs Completed vs Abandoned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formId" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="started" name="Started" fill="#8884d8" />
                  <Bar dataKey="completed" name="Completed" fill="#82ca9d" />
                  <Bar dataKey="abandoned" name="Abandoned" fill="#ff8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Average duration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Average Form Completion Time</CardTitle>
            <CardDescription>Average time in seconds to complete forms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formId" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Seconds']} />
                  <Bar dataKey="avgDuration" name="Avg. Duration (sec)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main Admin Analytics Dashboard Component
export function AdminAnalyticsDashboard() {
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | undefined>(undefined);
  const [selectedBookId, setSelectedBookId] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("user-stats");
  
  const handleSearch = (authorId?: number, bookId?: number) => {
    setSelectedAuthorId(authorId);
    setSelectedBookId(bookId);
  };

  const handleClearFilters = () => {
    setSelectedAuthorId(undefined);
    setSelectedBookId(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <AnalyticsSearch onSearch={handleSearch} />
        
        {(selectedAuthorId || selectedBookId) && (
          <div className="flex items-center gap-2 mt-2">
            <div className="text-sm font-medium">
              Filtered by: {selectedAuthorId && "Author"} {selectedBookId && "Book"}
            </div>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="user-stats" className="flex gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">User Stats</span>
          </TabsTrigger>
          <TabsTrigger value="page-views" className="flex gap-2">
            <MousePointerClick className="h-4 w-4" />
            <span className="hidden md:inline">Page Views</span>
          </TabsTrigger>
          <TabsTrigger value="author-actions" className="flex gap-2">
            <BarChart4 className="h-4 w-4" />
            <span className="hidden md:inline">Author Actions</span>
          </TabsTrigger>
          <TabsTrigger value="form-analytics" className="flex gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden md:inline">Form Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-stats">
          <UserStatistics />
        </TabsContent>

        <TabsContent value="page-views">
          <PageViewsAnalytics authorId={selectedAuthorId} />
        </TabsContent>

        <TabsContent value="author-actions">
          <AuthorActionsAnalytics authorId={selectedAuthorId} />
        </TabsContent>

        <TabsContent value="form-analytics">
          <FormAnalytics authorId={selectedAuthorId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}