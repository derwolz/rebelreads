import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { AdminBookCsvUploadWizard } from "@/components/admin-book-csv-upload-wizard";

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
          <Tabs defaultValue="books">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="books">Books</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <h3 className="text-lg font-semibold mb-4">User Management</h3>
              {/* User management content will go here */}
            </TabsContent>
            <TabsContent value="books">
              <h3 className="text-lg font-semibold mb-4">Book Management</h3>
              <AdminBookCsvUploadWizard />
            </TabsContent>
            <TabsContent value="reports">
              <h3 className="text-lg font-semibold mb-4">Report Management</h3>
              {/* Report management content will go here */}
            </TabsContent>
            <TabsContent value="settings">
              <h3 className="text-lg font-semibold mb-4">Site Settings</h3>
              {/* Settings content will go here */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}