import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart2, BookCopy, UsersRound, Settings, Key, BookMarked } from "lucide-react";
import { Redirect } from "wouter";
import { AdminBookCsvUploadWizard } from "@/components/admin-book-csv-upload-wizard";
import { AdminAnalyticsDashboard } from "@/components/admin-analytics-dashboard";
import { AdminBetaKeysManager } from "@/components/admin-beta-keys-manager";
import { AdminGenresManager } from "@/components/admin-genres-manager";

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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UsersRound className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="books" className="flex items-center gap-2">
                <BookCopy className="h-4 w-4" />
                <span>Books</span>
              </TabsTrigger>
              <TabsTrigger value="genres" className="flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                <span>Genres</span>
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
              <div className="text-center text-muted-foreground py-10">
                User management functionality coming soon.
              </div>
            </TabsContent>
            
            <TabsContent value="books" className="py-4">
              <h3 className="text-lg font-semibold mb-4">Book Management</h3>
              <AdminBookCsvUploadWizard />
            </TabsContent>
            
            <TabsContent value="genres" className="py-4">
              <h3 className="text-lg font-semibold mb-4">Genre Management</h3>
              <AdminGenresManager />
            </TabsContent>
            
            <TabsContent value="beta" className="py-4">
              <AdminBetaKeysManager />
            </TabsContent>
            
            <TabsContent value="settings" className="py-4">
              <h3 className="text-lg font-semibold mb-4">Site Settings</h3>
              <div className="text-center text-muted-foreground py-10">
                Site settings functionality coming soon.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}