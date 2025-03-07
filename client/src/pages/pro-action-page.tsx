import { useState } from "react";
import { ReviewBoostWizard } from "@/components/review-boost-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { ProDashboardSidebar } from "@/components/pro-dashboard-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Megaphone, Star, LineChart } from "lucide-react";
import { CampaignTable } from "@/components/campaign-table";
import { AdBiddingWizard } from "@/components/ad-bidding-wizard";

export default function ProActionPage() {
  const [isReviewBoostOpen, setIsReviewBoostOpen] = useState(false);
  const [isAdBiddingOpen, setIsAdBiddingOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
  });

  const handleCreateSurvey = () => {
    toast({
      title: "Coming Soon",
      description: "Survey creation features will be available soon!",
    });
  };

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
          <h1 className="text-3xl font-bold mb-8">Actions</h1>

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
                <Button onClick={handleCreateSurvey} className="w-full">
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
        </div>
      </div>
    </main>
  );
}