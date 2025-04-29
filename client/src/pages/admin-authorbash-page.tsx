import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link, Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { AdminAuthorBashManager } from "@/components/admin-authorbash-manager";

export default function AdminAuthorBashPage() {
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
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin">Admin Panel</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin/authorbash">AuthorBash</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Link href="/admin">
        <div className="flex items-center text-muted-foreground hover:text-foreground mb-4 cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to Admin Panel</span>
        </div>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>AuthorBash Management</CardTitle>
          <CardDescription>
            Manage AuthorBash questions, view responses, and track performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAuthorBashManager />
        </CardContent>
      </Card>
    </div>
  );
}