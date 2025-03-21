import { useState } from "react";
import { ReviewBoostWizard } from "@/components/review-boost-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { ProDashboardSidebar } from "@/components/pro-dashboard-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Megaphone, Star, LineChart, Wallet, Plus } from "lucide-react";
import { CampaignTable } from "@/components/campaign-table";
import { AdBiddingWizard } from "@/components/ad-bidding-wizard";
import { SurveyBuilderWizard } from "@/components/survey-builder-wizard";
import { PurchaseCreditsModal } from "@/components/purchase-credits-modal";

export default function ProActionPage() {
  const [isReviewBoostOpen, setIsReviewBoostOpen] = useState(false);
  const [isAdBiddingOpen, setIsAdBiddingOpen] = useState(false);
  const [isSurveyBuilderOpen, setIsSurveyBuilderOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
  });

  const { data: credits } = useQuery<string>({
    queryKey: ["/api/credits"],
  });

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Credit Balance Display */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Actions</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPurchaseModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Credits
          </Button>
          <Card className="bg-primary/10">
            <CardContent className="flex items-center gap-3 py-3">
              <Wallet className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Available Credits</p>
                <p className="text-2xl font-bold">${credits || "0"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
                <Button onClick={() => setIsAdBiddingOpen(true)} className="w-full">
                  Manage Ads
                </Button>
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
                <Button onClick={() => setIsReviewBoostOpen(true)} className="w-full">
                  Start Boost
                </Button>
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
                <Button onClick={() => setIsSurveyBuilderOpen(true)} className="w-full">
                  Create Survey
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active Campaigns Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>
                Monitor and manage your ongoing promotional campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignTable />
            </CardContent>
          </Card>

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
        </div>
      </div>
    </main>
  );
}