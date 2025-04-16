import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { Book, Campaign } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

const campaignTypeLabels = {
  ad: "Advertisement",
  survey: "Reader Survey",
  review_boost: "Review Boost",
};

export function CampaignTable() {
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/pro/campaigns"],
  });
  
  // State to track which campaign cards are expanded in mobile view
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  const toggleCardExpansion = (campaignId: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  if (isLoading) {
    return <div>Loading campaigns...</div>;
  }

  // Mobile view (card layout)
  const mobileView = (
    <div className="space-y-4 md:hidden">
      {campaigns?.map((campaign) => (
        <Card key={campaign.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{campaign.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline">
                    {campaignTypeLabels[campaign.type as keyof typeof campaignTypeLabels]}
                    {campaign.type === "ad" && ` (${campaign.adType})`}
                  </Badge>
                  <Badge
                    variant={
                      campaign.status === "active"
                        ? "default"
                        : campaign.status === "completed"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <button 
                onClick={() => toggleCardExpansion(campaign.id)}
                className="p-2 rounded-full hover:bg-secondary"
              >
                {expandedCards[campaign.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {expandedCards[campaign.id] && (
              <div className="mt-4 space-y-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium">Timeline</div>
                  <div className="text-sm mt-1">
                    <div>
                      Started:{" "}
                      {formatDistance(new Date(campaign.startDate), new Date(), {
                        addSuffix: true,
                      })}
                    </div>
                    <div className="text-muted-foreground">
                      Ends:{" "}
                      {formatDistance(new Date(campaign.endDate), new Date(), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Books</div>
                  <div className="space-y-1 mt-1">
                    {campaign.books?.map((book) => (
                      <div key={book.id} className="text-sm">
                        {book.title}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Budget</div>
                  <div className="space-y-1 mt-1">
                    <div className="text-sm">
                      ${Number(campaign.spent).toFixed(2)} spent of ${Number(campaign.budget).toFixed(2)}
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(Number(campaign.spent) / Number(campaign.budget)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Performance</div>
                  <div className="space-y-1 text-sm mt-1">
                    {campaign.type === "ad" && campaign.metrics && (
                      <>
                        <div>{campaign.metrics.impressions} impressions</div>
                        <div>{campaign.metrics.clicks} clicks</div>
                        <div>
                          CTR:{" "}
                          {campaign.metrics.clicks && campaign.metrics.impressions
                            ? ((campaign.metrics.clicks / campaign.metrics.impressions) * 100).toFixed(1)
                            : 0}
                          %
                        </div>
                      </>
                    )}
                    {campaign.type === "survey" && campaign.metrics && (
                      <div>{campaign.metrics.responses} responses</div>
                    )}
                    {campaign.type === "review_boost" && campaign.metrics && (
                      <div>{campaign.metrics.reviews} new reviews</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Desktop view (table layout)
  const desktopView = (
    <div className="rounded-md border hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timeline</TableHead>
            <TableHead>Books</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Performance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns?.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {campaignTypeLabels[campaign.type as keyof typeof campaignTypeLabels]}
                  {campaign.type === "ad" && ` (${campaign.adType})`}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    campaign.status === "active"
                      ? "default"
                      : campaign.status === "completed"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {campaign.status.charAt(0).toUpperCase() +
                    campaign.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>
                    Started:{" "}
                    {formatDistance(new Date(campaign.startDate), new Date(), {
                      addSuffix: true,
                    })}
                  </div>
                  <div className="text-muted-foreground">
                    Ends:{" "}
                    {formatDistance(new Date(campaign.endDate), new Date(), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {campaign.books?.map((book) => (
                    <div key={book.id} className="text-sm">
                      {book.title}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    ${Number(campaign.spent).toFixed(2)} spent
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of ${Number(campaign.budget).toFixed(2)}
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(Number(campaign.spent) / Number(campaign.budget)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  {campaign.type === "ad" && campaign.metrics && (
                    <>
                      <div>{campaign.metrics.impressions} impressions</div>
                      <div>{campaign.metrics.clicks} clicks</div>
                      <div>
                        CTR:{" "}
                        {campaign.metrics.clicks && campaign.metrics.impressions
                          ? ((campaign.metrics.clicks / campaign.metrics.impressions) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </>
                  )}
                  {campaign.type === "survey" && campaign.metrics && (
                    <div>{campaign.metrics.responses} responses</div>
                  )}
                  {campaign.type === "review_boost" && campaign.metrics && (
                    <div>{campaign.metrics.reviews} new reviews</div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div>
      {mobileView}
      {desktopView}
    </div>
  );
}