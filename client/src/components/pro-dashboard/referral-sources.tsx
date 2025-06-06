import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Color palette for the pie chart
const COLORS = [
  "#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c", 
  "#d0ed57", "#ffc658", "#ff8042", "#ff6361", "#bc5090"
];

interface ReferralSourcesProps {
  selectedBookIds: number[];
}

interface ReferralSourceData {
  name: string;
  count: number;
}

interface ReferralSourcesResponse {
  byContext: ReferralSourceData[];
  bySource: ReferralSourceData[];
  byDomain: ReferralSourceData[];
}

export function ReferralSources({ selectedBookIds }: ReferralSourcesProps) {
  // Query API for referral source data
  const { data, isLoading, error } = useQuery<ReferralSourcesResponse>({
    queryKey: ["/api/pro/analytics/referral-sources", selectedBookIds],
    enabled: true,
  });

  // Format data for the pie charts
  const bySourceData = useMemo(() => {
    if (!data?.bySource || data.bySource.length === 0) {
      return [{ name: "No Data", count: 1 }];
    }
    
    // Group small counts as "Other"
    const threshold = 3; // Minimum count to be shown individually
    const topSources = [...data.bySource].filter(item => item.count >= threshold);
    const otherSources = [...data.bySource].filter(item => item.count < threshold);
    
    if (otherSources.length > 0) {
      const otherCount = otherSources.reduce((sum, item) => sum + item.count, 0);
      if (otherCount > 0) {
        topSources.push({ name: "Other", count: otherCount });
      }
    }
    
    return topSources;
  }, [data?.bySource]);

  const byDomainData = useMemo(() => {
    if (!data?.byDomain || data.byDomain.length === 0) {
      return [{ name: "No Data", count: 1 }];
    }
    
    // Group small counts as "Other"
    const threshold = 2; // Minimum count to be shown individually
    const topDomains = [...data.byDomain].filter(item => item.count >= threshold);
    const otherDomains = [...data.byDomain].filter(item => item.count < threshold);
    
    if (otherDomains.length > 0) {
      const otherCount = otherDomains.reduce((sum, item) => sum + item.count, 0);
      if (otherCount > 0) {
        topDomains.push({ name: "Other", count: otherCount });
      }
    }
    
    return topDomains;
  }, [data?.byDomain]);

  const byContextData = useMemo(() => {
    if (!data?.byContext || data.byContext.length === 0) {
      return [{ name: "No Data", count: 1 }];
    }
    
    // Group small counts as "Other"
    const threshold = 3; // Minimum count to be shown individually
    const topContexts = [...data.byContext].filter(item => item.count >= threshold);
    const otherContexts = [...data.byContext].filter(item => item.count < threshold);
    
    if (otherContexts.length > 0) {
      const otherCount = otherContexts.reduce((sum, item) => sum + item.count, 0);
      if (otherCount > 0) {
        topContexts.push({ name: "Other", count: otherCount });
      }
    }
    
    return topContexts;
  }, [data?.byContext]);

  // Format nice labels for context names
  const formatContextName = (name: string) => {
    if (!name) return "Unknown";
    
    // Replace underscores and hyphens with spaces
    const formatted = name.replace(/[_-]/g, " ");
    
    // Capitalize first letter of each word
    return formatted
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full md:w-[49%]">
        <CardHeader>
          <CardTitle>Referral Sources</CardTitle>
          <CardDescription>Where your referral links get clicked</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Skeleton className="w-32 h-32 rounded-full mb-4" />
            <Skeleton className="w-48 h-4 mb-2" />
            <Skeleton className="w-36 h-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="w-full md:w-[49%]">
        <CardHeader>
          <CardTitle>Referral Sources</CardTitle>
          <CardDescription>Where your referral links get clicked</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Error loading referral data</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data to display
  const hasSourceData = bySourceData.length > 0 && !(bySourceData.length === 1 && bySourceData[0].name === "No Data");
  const hasContextData = byContextData.length > 0 && !(byContextData.length === 1 && byContextData[0].name === "No Data");
  const hasDomainData = byDomainData.length > 0 && !(byDomainData.length === 1 && byDomainData[0].name === "No Data");

  if (!hasSourceData && !hasContextData && !hasDomainData) {
    return (
      <Card className="w-full md:w-[49%]">
        <CardHeader>
          <CardTitle>Referral Sources</CardTitle>
          <CardDescription>Where your referral links get clicked</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No referral data available</p>
            <p className="text-sm">When readers click your referral links, data will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total referrals for the title
  const totalReferrals = hasDomainData 
    ? byDomainData.reduce((sum, item) => sum + item.count, 0) 
    : (hasSourceData 
      ? bySourceData.reduce((sum, item) => sum + item.count, 0) 
      : byContextData.reduce((sum, item) => sum + item.count, 0));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Referral Analytics</CardTitle>
        <CardDescription>
          {totalReferrals} total referrals {selectedBookIds.length ? `for selected books` : `across all books`}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[550px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Domain (Website) Chart - shows where users are sent */}
          <div className="flex flex-col items-center">
            <h3 className="text-md font-medium mb-2">Referral Destinations</h3>
            <p className="text-sm text-muted-foreground mb-3">External websites where readers are sent</p>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byDomainData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {byDomainData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} click${value !== 1 ? 's' : ''}`, name]} 
                    labelFormatter={() => 'Domain'} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Source Context Chart - shows where the clicks come from */}
          <div className="flex flex-col items-center">
            <h3 className="text-md font-medium mb-2">Referral Origins</h3>
            <p className="text-sm text-muted-foreground mb-3">Pages where referral links are clicked</p>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byContextData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {byContextData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[(index + 5) % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} click${value !== 1 ? 's' : ''}`, 
                      formatContextName(name)
                    ]} 
                    labelFormatter={() => 'Source'} 
                  />
                  <Legend formatter={(value) => formatContextName(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}