import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface FollowerAnalytics {
  total: number;
  trending: Array<{ 
    date: string; 
    followers: number; 
    unfollows: number;
    netChange: number;
  }>;
}

interface FollowerGrowthProps {
  followerData: FollowerAnalytics | undefined;
}

export function FollowerGrowth({ followerData }: FollowerGrowthProps) {
  // Process follower data for chart
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

  return (
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
  );
}