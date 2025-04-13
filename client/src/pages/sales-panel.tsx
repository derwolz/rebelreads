import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { SalesPublisherManager } from "@/components/sales-publisher-manager";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";

export default function SalesPanel() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if the user is a seller
  const { data: sellerStatus, isLoading } = useQuery({
    queryKey: ['/api/sales/check-status'],
    queryFn: async () => {
      if (!user) return { isSeller: false };
      const res = await fetch('/api/sales/check-status');
      if (!res.ok) {
        const error = await res.json();
        toast({
          title: "Error checking seller status",
          description: error.error || "Failed to check seller status",
          variant: "destructive"
        });
        return { isSeller: false };
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Loading sales panel...</h1>
      </div>
    );
  }

  // Verify seller access
  if (!sellerStatus?.isSeller) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Access Denied</h1>
        <p>You do not have seller permissions to access this page.</p>
        <p className="mt-4">
          <a href="/settings" className="text-primary hover:underline">
            Go to settings
          </a>
          {" to apply for seller status."}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sales Management Panel</h1>
      <SalesPublisherManager />
    </div>
  );
}