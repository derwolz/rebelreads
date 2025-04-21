import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { AdminCampaignManager } from "@/components/admin-campaign-manager";

export default function AdminCampaignManagementPage() {
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
      <AdminCampaignManager />
    </div>
  );
}