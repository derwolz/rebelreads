import { useState } from "react";
import { ReviewBoostWizard } from "@/components/review-boost-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { ProDashboardSidebar } from "@/components/pro-dashboard-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Megaphone, Star, LineChart, Wallet, Plus, LockIcon, Menu } from "lucide-react";
import { CampaignTable } from "@/components/campaign-table";
import { AdBiddingWizard } from "@/components/ad-bidding-wizard";
import { SurveyBuilderWizard } from "@/components/survey-builder-wizard";
import { PurchaseCreditsModal } from "@/components/purchase-credits-modal";
import { ProActionWrapper } from "@/components/pro-action-wrapper";
import { ProPaywall } from "@/components/pro-paywall";
import { useAuth } from "@/hooks/use-auth";

export default function ProActionPage() {
  const [isReviewBoostOpen, setIsReviewBoostOpen] = useState(false);
  const [isAdBiddingOpen, setIsAdBiddingOpen] = useState(false);
  const [isSurveyBuilderOpen, setIsSurveyBuilderOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [showProPaywall, setShowProPaywall] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isPro = user?.isPro;

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Ad Management */}
        <Card>
          <CardHeader>
            <Megaphone className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Ad Management</CardTitle>
            <CardDescription>
              Create and manage advertising campaigns for your books
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm">
              <li>• Target specific reader demographics</li>
              <li>• Set custom budgets and schedules</li>
              <li>• Track campaign performance</li>
              <li>• Optimize your reach</li>
            </ul>
            {isPro ? (
              <Button onClick={() => setIsAdBiddingOpen(true)} className="w-full">
                Manage Ads
              </Button>
            ) : (
              <Button 
                className="w-full opacity-70 cursor-not-allowed" 
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
        <Card>
          <CardHeader>
            <Star className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Boost Reviews</CardTitle>
            <CardDescription>
              Increase your book's visibility with authentic reader reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm">
              <li>• Connect with engaged readers</li>
              <li>• Get honest, quality feedback</li>
              <li>• Improve book visibility</li>
              <li>• Build social proof</li>
            </ul>
            {isPro ? (
              <Button onClick={() => setIsReviewBoostOpen(true)} className="w-full">
                Start Boost
              </Button>
            ) : (
              <Button 
                className="w-full opacity-70 cursor-not-allowed" 
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
        <Card>
          <CardHeader>
            <LineChart className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Create Survey</CardTitle>
            <CardDescription>
              Gather valuable insights from your readers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm">
              <li>• Create custom questionnaires</li>
              <li>• Collect reader feedback</li>
              <li>• Analyze responses</li>
              <li>• Make data-driven decisions</li>
            </ul>
            {isPro ? (
              <Button onClick={() => setIsSurveyBuilderOpen(true)} className="w-full">
                Create Survey
              </Button>
            ) : (
              <Button 
                className="w-full opacity-70 cursor-not-allowed" 
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>
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
        <CardContent>
          {isPro ? (
            <CampaignTable />
          ) : (
            <div className="text-center py-8 border border-dashed rounded-md border-muted-foreground/30">
              <LockIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Upgrade to Pro to view your campaigns</p>
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
    <main className="container mx-auto px-4 py-8">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="h-full pt-8">
            <ProDashboardSidebar />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-60">
          <ProDashboardSidebar />
        </div>

        <div className="flex-1">
          {/* Mobile menu button - only visible on mobile */}
          <div className="md:hidden mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </Button>
          </div>
          
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
        </div>
      </div>
    </main>
  );
}