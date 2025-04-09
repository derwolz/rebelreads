import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ProPaywall } from "@/components/pro-paywall";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface ProAnalyticsWrapperProps {
  children: React.ReactNode;
}

interface ProDashboardData {
  totalReviews: number;
  averageRating: number;
  recentReports: number;
}

export function ProAnalyticsWrapper({ children }: ProAnalyticsWrapperProps) {
  const { user } = useAuth();
  const [showFullPaywall, setShowFullPaywall] = useState(false);
  
  const { data: dashboardData } = useQuery<ProDashboardData>({
    queryKey: ["/api/pro/dashboard"],
    enabled: !!user?.isAuthor,
  });

  // Check if user is pro
  const isPro = user?.isPro;

  // If user is pro, show the full content
  if (isPro) {
    return <>{children}</>;
  }

  // Basic statistics to show for non-pro users
  const basicStats = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {dashboardData?.totalReviews || 0}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Average Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {dashboardData?.averageRating?.toFixed(1) || "0.0"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {dashboardData?.recentReports || 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {/* Show limited data version */}
      <div className="space-y-6">
        {basicStats}
        
        {/* Show blurred version of full content with paywall overlay */}
        <div className="relative">
          <ProPaywall showPartialData>
            {children}
          </ProPaywall>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Button 
              size="lg" 
              className="pointer-events-auto animate-bounce"
              onClick={() => setShowFullPaywall(true)}
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
      
      {/* Full paywall dialog */}
      <Dialog open={showFullPaywall} onOpenChange={setShowFullPaywall}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ProPaywall onClose={() => setShowFullPaywall(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}