import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FollowerTest() {
  const [timeRange, setTimeRange] = useState("30");
  
  const { data: followerData, isLoading } = useQuery({
    queryKey: ["/api/pro/follower-metrics", timeRange],
    queryFn: () => fetch(`/api/pro/follower-metrics?timeRange=${timeRange}`).then((res) => res.json()),
  });

  console.log("Raw follower data:", followerData);

  const followerChartData = (() => {
    if (!followerData || !followerData.trending) {
      console.log("No follower data available");
      return [];
    }

    // Format date for display
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    };

    // Process the data for chart display
    const chartData = followerData.trending.map((item: any) => {
      const followers = isFinite(Number(item.followers)) ? Number(item.followers) : 0;
      const unfollows = isFinite(Number(item.unfollows)) ? Number(item.unfollows) : 0;
      console.log(`Date: ${item.date}, followers: ${followers}, unfollows: ${unfollows}`);
      
      return {
        date: formatDate(item.date),
        followers,
        unfollows,
        netChange: followers - unfollows
      };
    });
    
    console.log("Processed chart data:", chartData);
    return chartData;
  })();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Follower Metrics Test</h1>
      
      <div className="flex justify-end mb-4">
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
            <SelectItem value="7">Last Week</SelectItem>
            <SelectItem value="30">Last Month</SelectItem>
            <SelectItem value="90">Last 3 Months</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Follower Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading follower data...</p>
          ) : followerData?.total !== undefined ? (
            <>
              <p className="mb-4">Total followers: {followerData.total}</p>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={followerChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => (isNaN(Number(value)) ? '0' : value)} />
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
            </>
          ) : (
            <p>No follower data available</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}