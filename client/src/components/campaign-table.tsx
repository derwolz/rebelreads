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
import { Book } from "@shared/schema";

interface Campaign {
  id: number;
  name: string;
  type: "ad" | "survey" | "review_boost";
  status: "active" | "completed" | "paused";
  startDate: Date;
  endDate: Date;
  spent: number;
  budget: number;
  books: Pick<Book, "id" | "title">[];
  metrics?: {
    impressions?: number;
    clicks?: number;
    responses?: number;
    reviews?: number;
  };
}

// Mock data - this would come from the API in the real implementation
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    name: "Summer Reading Promotion",
    type: "ad",
    status: "active",
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-05-01"),
    spent: 150.25,
    budget: 500,
    books: [{ id: 1, title: "The Great Adventure" }],
    metrics: {
      impressions: 1500,
      clicks: 250,
    },
  },
  {
    id: 2,
    name: "Reader Feedback Survey",
    type: "survey",
    status: "active",
    startDate: new Date("2025-03-05"),
    endDate: new Date("2025-04-05"),
    spent: 75.50,
    budget: 200,
    books: [
      { id: 2, title: "Mystery in the Dark" },
      { id: 3, title: "Light of Dawn" },
    ],
    metrics: {
      responses: 45,
    },
  },
  {
    id: 3,
    name: "Launch Reviews Campaign",
    type: "review_boost",
    status: "active",
    startDate: new Date("2025-03-07"),
    endDate: new Date("2025-04-07"),
    spent: 95.75,
    budget: 300,
    books: [{ id: 4, title: "New Horizons" }],
    metrics: {
      reviews: 12,
    },
  },
];

const campaignTypeLabels = {
  ad: "Advertisement",
  survey: "Reader Survey",
  review_boost: "Review Boost",
};

export function CampaignTable() {
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
            {MOCK_CAMPAIGNS.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {campaignTypeLabels[campaign.type]}
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
                      {formatDistance(campaign.startDate, new Date(), {
                        addSuffix: true,
                      })}
                    </div>
                    <div className="text-muted-foreground">
                      Ends:{" "}
                      {formatDistance(campaign.endDate, new Date(), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {campaign.books.map((book) => (
                      <div key={book.id} className="text-sm">
                        {book.title}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      ${campaign.spent.toFixed(2)} spent
                    </div>
                    <div className="text-sm text-muted-foreground">
                      of ${campaign.budget.toFixed(2)}
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(campaign.spent / campaign.budget) * 100}%`,
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
                          {(
                            (campaign.metrics.clicks! /
                              campaign.metrics.impressions!) *
                            100
                          ).toFixed(1)}
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
