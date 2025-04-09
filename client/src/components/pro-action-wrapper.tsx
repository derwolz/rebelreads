import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ProPaywall } from "@/components/pro-paywall";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

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

  return (
    <>
      {/* Show credit balance at top */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Take Action</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {credits || "0"}
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Blurred action content with paywall overlay */}
        <div className="relative mt-8">
          <div className="pointer-events-none filter blur-[2px] opacity-40">
            {children}
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold">Unlock Your Author Potential</h2>
              <p className="text-muted-foreground">Boost your visibility and reach more readers</p>
            </div>
            <Button 
              size="lg" 
              className="pointer-events-auto"
              onClick={() => setShowFullPaywall(true)}
            >
              Upgrade to Pro
            </Button>
          </div>
          
          {/* Gradient overlay */}
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