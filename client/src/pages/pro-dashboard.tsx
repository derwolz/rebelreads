import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainNav } from "@/components/main-nav";
import { ProDashboardSidebar } from "@/components/pro-dashboard-sidebar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ReviewManagement } from "@/components/review-management";
import { ProAuthorSettings } from "@/components/pro-author-settings";
import { Menu } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

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
  const [location] = useLocation();

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

  // Render different content based on the current route
  const renderContent = () => {
    if (location === "/pro/reviews") {
      return <ReviewManagement />;
    }

    if (location === "/pro/author-settings") {
      return <ProAuthorSettings />;
    }

    if (location === "/pro/reports") {
      return (
        <div className="flex-1 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Take Action</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Survey</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Create custom surveys to gather feedback from your readers.
                </p>
                <Button variant="secondary" disabled className="w-full">
                  Make a Survey (Planned)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advertisement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Start an advertising campaign to reach more readers.
                </p>
                <Button className="w-full">Start Ad Campaign</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
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
              <p className="text-3xl font-bold">{dashboardData?.averageRating.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 md:col-span-1">
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
            <div className="h-[300px] md:h-[400px]">
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
    );
  };

  return (
    <div>
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Mobile Sidebar */}
          <div className="md:hidden">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Dashboard Menu</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-4">
                  <ProDashboardSidebar />
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <ProDashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}