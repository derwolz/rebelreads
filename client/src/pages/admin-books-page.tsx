import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Redirect, Link } from "wouter";
import { AdminBookManager } from "@/components/admin-book-manager";
import { Button } from "@/components/ui/button";

export default function AdminBooksPage() {
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
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Panel
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Book Administration</CardTitle>
          <CardDescription>Search, view, and manage all books in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminBookManager />
        </CardContent>
      </Card>
    </div>
  );
}