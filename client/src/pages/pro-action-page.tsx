import { useState } from "react";
import { ReviewBoostWizard } from "@/components/review-boost-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Megaphone, Star, LineChart, Wallet, Plus, LockIcon } from "lucide-react";
import { CampaignTable } from "@/components/campaign-table";
import { AdBiddingWizard } from "@/components/ad-bidding-wizard";
import { SurveyBuilderWizard } from "@/components/survey-builder-wizard";
import { PurchaseCreditsModal } from "@/components/purchase-credits-modal";
import { ProActionWrapper } from "@/components/pro-action-wrapper";
import { ProPaywall } from "@/components/pro-paywall";
import { useAuth } from "@/hooks/use-auth";
import { ProLayout } from "@/components/pro-layout";

export default function ProActionPage() {
  const [isReviewBoostOpen, setIsReviewBoostOpen] = useState(false);
  const [isAdBiddingOpen, setIsAdBiddingOpen] = useState(false);
  const [isSurveyBuilderOpen, setIsSurveyBuilderOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [showProPaywall, setShowProPaywall] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isPro = user?.is_pro;
  
  // Function to show "coming soon" toast message
  const showComingSoonToast = (featureName: string) => {
    toast({
      title: "Coming Soon",
      description: `We're still working on the ${featureName} feature. Stay tuned!`,
      duration: 3000,
    });
  };

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
  });

  const { data: credits } = useQuery<string>({
    queryKey: ["/api/credits"],
  });

  // Content to be wrapped
  const actionContent = (
    <div>
      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Ad Management */}
        <Card className="h-full">
          <CardHeader className="p-4 sm:p-6">
            <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2" />
            <CardTitle className="text-lg sm:text-xl">Ad Management</CardTitle>
            <CardDescription className="text-sm">
              Create and manage advertising campaigns for your books
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ul className="space-y-2 mb-4 sm:mb-6 text-xs sm:text-sm">
              <li>• Target specific reader demographics</li>
              <li>• Set custom budgets and schedules</li>
              <li>• Track campaign performance</li>
              <li>• Optimize your reach</li>
            </ul>
            {isPro ? (
              <Button 
                onClick={() => showComingSoonToast("Ad Management")} 
                className="w-full text-sm relative bg-muted text-muted-foreground"
                disabled
              >
                <span className="relative z-10">Manage Ads</span>
                <div className="absolute inset-0 flex items-center justify-center z-0">
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-md">Coming Soon</span>
                </div>
              </Button>
            ) : (
              <Button 
                className="w-full opacity-70 cursor-not-allowed text-sm" 
                variant="outline"
                disabled
                onClick={() => setShowProPaywall(true)}
              >
                <LockIcon className="h-3 w-3 mr-1" />
                Upgrade to Access
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Review Boost */}
        <Card className="h-full">
          <CardHeader className="p-4 sm:p-6">
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2" />
            <CardTitle className="text-lg sm:text-xl">Boost Reviews</CardTitle>
            <CardDescription className="text-sm">
              Increase your book's visibility with authentic reader reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ul className="space-y-2 mb-4 sm:mb-6 text-xs sm:text-sm">
              <li>• Connect with engaged readers</li>
              <li>• Get honest, quality feedback</li>
              <li>• Improve book visibility</li>
              <li>• Build social proof</li>
            </ul>
            {isPro ? (
              <Button 
                onClick={() => showComingSoonToast("Review Boost")} 
                className="w-full text-sm relative bg-muted text-muted-foreground"
                disabled
              >
                <span className="relative z-10">Start Boost</span>
                <div className="absolute inset-0 flex items-center justify-center z-0">
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-md">Coming Soon</span>
                </div>
              </Button>
            ) : (
              <Button 
                className="w-full opacity-70 cursor-not-allowed text-sm" 
                variant="outline"
                disabled
                onClick={() => setShowProPaywall(true)}
              >
                <LockIcon className="h-3 w-3 mr-1" />
                Upgrade to Access
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Create Survey */}
        <Card className="h-full">
          <CardHeader className="p-4 sm:p-6">
            <LineChart className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2" />
            <CardTitle className="text-lg sm:text-xl">Create Survey</CardTitle>
            <CardDescription className="text-sm">
              Gather valuable insights from your readers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ul className="space-y-2 mb-4 sm:mb-6 text-xs sm:text-sm">
              <li>• Create custom questionnaires</li>
              <li>• Collect reader feedback</li>
              <li>• Analyze responses</li>
              <li>• Make data-driven decisions</li>
            </ul>
            {isPro ? (
              <Button 
                onClick={() => showComingSoonToast("Survey Creation")} 
                className="w-full text-sm relative bg-muted text-muted-foreground"
                disabled
              >
                <span className="relative z-10">Create Survey</span>
                <div className="absolute inset-0 flex items-center justify-center z-0">
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-md">Coming Soon</span>
                </div>
              </Button>
            ) : (
              <Button 
                className="w-full opacity-70 cursor-not-allowed text-sm" 
                variant="outline"
                disabled
                onClick={() => setShowProPaywall(true)}
              >
                <LockIcon className="h-3 w-3 mr-1" />
                Upgrade to Access
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns Table */}
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between flex-wrap gap-2 p-4 sm:p-6">
          <div>
            <CardTitle className="text-lg sm:text-xl">Active Campaigns</CardTitle>
            <CardDescription className="text-sm">
              Monitor and manage your ongoing promotional campaigns
            </CardDescription>
          </div>
          {!isPro && (
            <div className="bg-primary/10 text-primary rounded-md py-1 px-2 text-xs font-medium flex items-center">
              <LockIcon className="h-3 w-3 mr-1" />
              Pro Feature
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-0">
          {isPro ? (
            <CampaignTable />
          ) : (
            <div className="text-center py-6 sm:py-8 border border-dashed rounded-md border-muted-foreground/30 mx-4 sm:mx-0 mb-4 sm:mb-0">
              <LockIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground mb-4 text-sm">Upgrade to Pro to view your campaigns</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowProPaywall(true)}
              >
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <ProLayout>
      {/* Wrap action content in ProActionWrapper */}
      <ProActionWrapper>
        {actionContent}
      </ProActionWrapper>

      <ReviewBoostWizard
        open={isReviewBoostOpen}
        onClose={() => setIsReviewBoostOpen(false)}
        books={books || []}
      />

      <AdBiddingWizard
        open={isAdBiddingOpen}
        onClose={() => setIsAdBiddingOpen(false)}
        books={books || []}
      />

      <SurveyBuilderWizard
        open={isSurveyBuilderOpen}
        onClose={() => setIsSurveyBuilderOpen(false)}
      />

      <PurchaseCreditsModal
        open={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />
      
      <Dialog open={showProPaywall} onOpenChange={setShowProPaywall}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ProPaywall onClose={() => setShowProPaywall(false)} />
        </DialogContent>
      </Dialog>
    </ProLayout>
  );
}