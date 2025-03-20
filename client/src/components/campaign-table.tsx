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

const campaignTypeLabels = {
  ad: "Advertisement",
  survey: "Reader Survey",
  review_boost: "Review Boost",
};

export function CampaignTable() {
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/pro/campaigns"],
  });

  if (isLoading) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <div>
      <div className="rounded-md border">
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
    </div>
  );
}