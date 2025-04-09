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

  // Extract the stats section from children
  const extractStatsContent = () => {
    try {
      // Clone the children element to extract and modify it
      const childrenArray = React.Children.toArray(children);
      
      // If we have React elements, we'll try to extract what we need
      if (childrenArray.length > 0 && React.isValidElement(childrenArray[0])) {
        const mainChild = childrenArray[0] as React.ReactElement;
        
        // Try to get the first div with stats cards (if it follows expected structure)
        if (mainChild.props?.children?.props?.children) {
          const contentChildren = mainChild.props.children.props.children;
          
          // Look for the stats grid (assuming it's the first item after the header)
          if (Array.isArray(contentChildren) && contentChildren.length >= 2) {
            // Return just the header and stats sections
            return [contentChildren[0], contentChildren[1]];
          }
        }
      }
    } catch (e) {
      console.error("Error extracting stats content:", e);
    }
    
    // Fallback if we can't extract
    return null;
  };

  // Get the stats section (if possible)
  const statsContent = extractStatsContent();

  return (
    <>
      {/* Show real data stats at top */}
      <div className="space-y-6">
        {/* Either use extracted stats from children, or fallback to basic stats */}
        {statsContent || (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Author Analytics</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </>
        )}
        
        {/* Blurred charts with paywall overlay */}
        <div className="relative mt-8">
          <div className="pointer-events-none filter blur-[2px] opacity-40">
            {children}
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold">Unlock Your Author Potential</h2>
              <p className="text-muted-foreground">Access detailed analytics and boost your success</p>
            </div>
            <Button 
              size="lg" 
              className="pointer-events-auto"
              onClick={() => setShowFullPaywall(true)}
            >
              Upgrade to Pro
            </Button>
          </div>
          
          {/* Gradient overlay for follower chart (bottom) */}
          <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-background via-background/80 to-transparent"></div>
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