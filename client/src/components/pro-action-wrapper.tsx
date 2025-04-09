import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ProPaywall } from "@/components/pro-paywall";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LockIcon } from "lucide-react";

interface ProActionWrapperProps {
  children: React.ReactNode;
}

export function ProActionWrapper({ children }: ProActionWrapperProps) {
  const { user } = useAuth();
  const [showFullPaywall, setShowFullPaywall] = useState(false);
  
  const { data: credits } = useQuery<string>({
    queryKey: ["/api/credits"],
    enabled: !!user?.isAuthor,
  });

  // Check if user is pro
  const isPro = user?.isPro;

  // If user is pro, show the full content
  if (isPro) {
    return <>{children}</>;
  }

  // Special handling for non-Pro users
  // Extract the action cards section and campaign table section from children
  const childrenArray = React.Children.toArray(children);
  let childContent = null;
  
  if (childrenArray.length > 0 && React.isValidElement(childrenArray[0])) {
    // Clone the child element to modify it
    childContent = React.cloneElement(childrenArray[0] as React.ReactElement);
  }

  const upgradeOverlay = (
    <div className="mt-8 mb-12 bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
      <h2 className="text-2xl font-bold mb-2">Unlock Your Author Potential</h2>
      <p className="text-muted-foreground mb-4">Boost your visibility and reach more readers with Pro features</p>
      <Button 
        size="lg" 
        onClick={() => setShowFullPaywall(true)}
      >
        Upgrade to Pro
      </Button>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Take Action</h1>
        </div>

        {/* Upgrade banner */}
        {upgradeOverlay}
        
        {/* Action cards with Pro indicator */}
        <div className="relative">
          {childContent}
          
          {/* Overlay divs with "Pro Feature" on each card button */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 h-full">
              {Array(3).fill(null).map((_, i) => (
                <div key={i} className="flex flex-col justify-between">
                  <div></div>
                  <div className="px-6 pb-6">
                    <div className="bg-primary/10 text-primary rounded-md py-1 px-2 text-xs font-medium flex items-center justify-center mb-2">
                      <LockIcon className="h-3 w-3 mr-1" />
                      Pro Feature
                    </div>
                    <Button disabled className="w-full opacity-70 cursor-not-allowed">
                      <LockIcon className="h-3 w-3 mr-1" />
                      Upgrade to Access
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Campaign table overlay */}
            <div className="absolute top-[calc(100%-160px)] left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent flex flex-col items-center justify-end pb-8">
              <p className="text-muted-foreground mb-2">Upgrade to Pro to view and manage your campaigns</p>
              <Button 
                size="sm" 
                variant="outline"
                className="pointer-events-auto"
                onClick={() => setShowFullPaywall(true)}
              >
                <LockIcon className="h-3 w-3 mr-1" />
                Upgrade to Pro
              </Button>
            </div>
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