import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainNav } from "@/components/main-nav";
import { ProDashboardSidebar } from "@/components/pro-dashboard-sidebar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookInterest {
  date: string;
  [key: string]: number | string;
}

interface ProDashboardData {
  bookInterest: BookInterest[];
  totalReviews: number;
  averageRating: number;
  recentReports: number;
}

export default function ProDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery<ProDashboardData>({
    queryKey: ["/api/pro/dashboard"],
    enabled: !!user?.isAuthor,
  });

  if (!user?.isAuthor) {
    return (
      <div>
        <MainNav />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p>You need to be an author to access this page.</p>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <MainNav />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-[400px] bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <ProDashboardSidebar />
          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Author Analytics</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <p className="text-3xl font-bold">{dashboardData?.averageRating.toFixed(1)}</p>
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
              <CardHeader>
                <CardTitle>Book Interest Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData?.bookInterest || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {Object.keys(dashboardData?.bookInterest?.[0] || {})
                        .filter(key => key !== 'date')
                        .map((book, index) => (
                          <Line
                            key={book}
                            type="monotone"
                            dataKey={book}
                            stroke={`hsl(${index * 30}, 70%, 50%)`}
                            strokeWidth={2}
                          />
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
