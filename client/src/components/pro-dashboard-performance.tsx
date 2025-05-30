import { BookSearch, MetricType } from "@/components/pro-dashboard/book-search";
import { BookPerformance } from "@/components/pro-dashboard/book-performance";
import { FollowerGrowth } from "@/components/pro-dashboard/follower-growth";
import { ReferralSources } from "@/components/pro-dashboard/referral-sources";
import type { Book } from "@shared/schema";

interface PerformanceProps {
  books: Book[] | undefined;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBookIds: number[];
  handleBookSelect: (bookId: number) => void;
  selectedMetrics: MetricType[];
  handleMetricToggle: (metric: MetricType) => void;
  performanceData: any;
  followerData: any;
}

export function Performance({
  books,
  searchQuery,
  setSearchQuery,
  selectedBookIds,
  handleBookSelect,
  selectedMetrics,
  handleMetricToggle,
  performanceData,
  followerData
}: PerformanceProps) {
  return (
    <div className="space-y-6">
      {/* Book search section */}
      <BookSearch
        books={books}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedBookIds={selectedBookIds}
        handleBookSelect={handleBookSelect}
        selectedMetrics={selectedMetrics}
        handleMetricToggle={handleMetricToggle}
      />
      
      {/* Analytics charts - in a flex row wrap layout */}
      <div className="flex flex-row flex-wrap gap-4">
        {/* Book Performance Analytics Card */}
        <BookPerformance
          performanceData={performanceData}
          selectedBookIds={selectedBookIds}
          selectedMetrics={selectedMetrics}
        />
        
        {/* Follower Growth Analytics Card */}
        <FollowerGrowth followerData={followerData} />
      </div>
      
      {/* Referral Analytics Section */}
      <div className="flex flex-row flex-wrap gap-4 mt-6">
        {/* Referral Sources Analytics Card */}
        <ReferralSources selectedBookIds={selectedBookIds} />
      </div>
    </div>
  );
}