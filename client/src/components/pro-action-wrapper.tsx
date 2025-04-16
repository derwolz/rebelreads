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
  const { user, isAuthor } = useAuth();
  const [showFullPaywall, setShowFullPaywall] = useState(false);
  
  const { data: credits } = useQuery<string>({
    queryKey: ["/api/credits"],
    enabled: isAuthor,
  });

  // Check if user is pro
  const isPro = user && user.is_pro;

  // If user is pro, show the full content
  if (isPro) {
    return <>{children}</>;
  }

  // Simple wrapper for non-Pro users
  // Just add an upgrade banner at the top
  const upgradeOverlay = (
    <div className="mt-4 sm:mt-8 mb-8 sm:mb-12 bg-primary/5 border border-primary/20 rounded-lg p-4 sm:p-6 text-center">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Unlock Your Author Potential</h2>
      <p className="text-sm text-muted-foreground mb-4">Boost your visibility and reach more readers with Pro features</p>
      <Button 
        size="default" 
        className="w-full sm:w-auto"
        onClick={() => setShowFullPaywall(true)}
      >
        Upgrade to Pro
      </Button>
    </div>
  );

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Take Action</h1>
        </div>

        {/* Upgrade banner */}
        {upgradeOverlay}
        
        {/* The page already has the proper Pro/non-Pro handling for buttons */}
        {children}
      </div>
      
      {/* Full paywall dialog */}
      <Dialog open={showFullPaywall} onOpenChange={setShowFullPaywall}>
        <DialogContent className="max-w-[90vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto px-4 pt-5 sm:px-6 sm:pt-6">
          <ProPaywall onClose={() => setShowFullPaywall(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}