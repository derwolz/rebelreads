import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart2, BookCopy, UsersRound, Settings, Key, BookMarked, MessageSquare, UserCog, Mail, Megaphone } from "lucide-react";
import { Link, Redirect } from "wouter";
import { AdminAnalyticsDashboard } from "@/components/admin-analytics-dashboard";
import { AdminBetaKeysManager } from "@/components/admin-beta-keys-manager";
import { AdminGenresManager } from "@/components/admin-genres-manager";
import { AdminFeedbackManager } from "@/components/admin-feedback-manager";
import { AdminSellersManager } from "@/components/admin-sellers-manager";
import { Button } from "@/components/ui/button";

export default function AdminPanel() {
  const { user } = useAuth();

  // Check if user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['/api/admin/check'],
    queryFn: async () => {
      const res = await fetch('/api/admin/check');
      if (!res.ok) return false;
      return true;
    }
  });

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>Manage your website settings and content</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analytics">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UsersRound className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="sellers" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span>Sellers</span>
              </TabsTrigger>
              <TabsTrigger value="books" className="flex items-center gap-2">
                <BookCopy className="h-4 w-4" />
                <span>Books</span>
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                <span>Campaigns</span>
              </TabsTrigger>
              <TabsTrigger value="genres" className="flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                <span>Genres</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Feedback</span>
              </TabsTrigger>
              <TabsTrigger value="beta" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span>Beta Keys</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="py-4">
              <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
              <AdminAnalyticsDashboard />
            </TabsContent>
            
            <TabsContent value="users" className="py-4">
              <h3 className="text-lg font-semibold mb-4">User Management</h3>
              <div className="grid gap-4">
                <Card className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <UsersRound className="h-12 w-12 text-primary" />
                    <h4 className="text-lg font-medium">User Search and Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Search for users, view details, and manage user accounts in the system
                    </p>
                    <Link href="/admin/users">
                      <Button className="w-full">
                        Manage Users
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="sellers" className="py-4">
              <AdminSellersManager />
            </TabsContent>
            
            <TabsContent value="books" className="py-4">
              <h3 className="text-lg font-semibold mb-4">Book Management</h3>
              <div className="grid gap-4">
                <Card className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <BookCopy className="h-12 w-12 text-primary" />
                    <h4 className="text-lg font-medium">Book Search and Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Search for books, view details, and manage book entries in the system
                    </p>
                    <Link href="/admin/books">
                      <Button className="w-full">
                        Manage Books
                      </Button>
                    </Link>
                  </div>
                </Card>
                <Card className="p-6 bg-muted/50">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The bulk upload functionality has been removed.
                      Please use the external client for batch processing of books.
                    </p>
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="genres" className="py-4">
              <h3 className="text-lg font-semibold mb-4">Genre Management</h3>
              <AdminGenresManager />
            </TabsContent>
            
            <TabsContent value="feedback" className="py-4">
              <AdminFeedbackManager />
            </TabsContent>
            
            <TabsContent value="beta" className="py-4">
              <AdminBetaKeysManager />
            </TabsContent>
            
            <TabsContent value="settings" className="py-4">
              <h3 className="text-lg font-semibold mb-4">Site Settings</h3>
              <div className="text-center py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex flex-col items-center space-y-4">
                      <Mail className="h-10 w-10 text-primary" />
                      <h4 className="text-lg font-medium">Email Collection</h4>
                      <p className="text-sm text-muted-foreground text-center">
                        View and export emails collected from landing pages
                      </p>
                      <Link href="/admin/email-collection">
                        <Button className="w-full">
                          Manage Email Collection
                        </Button>
                      </Link>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex flex-col items-center space-y-4">
                      <Megaphone className="h-10 w-10 text-primary" />
                      <h4 className="text-lg font-medium">Campaign Management</h4>
                      <p className="text-sm text-muted-foreground text-center">
                        Create and manage promotional campaigns across the platform
                      </p>
                      <Link href="/admin/campaign-management">
                        <Button className="w-full">
                          Manage Campaigns
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}