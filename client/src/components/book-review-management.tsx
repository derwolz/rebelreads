import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarIcon } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Rating } from "@shared/schema";

interface BookReviewManagementProps {
  bookId: number;
}

export function BookReviewManagement({ bookId }: BookReviewManagementProps) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check if user is Pro
  const isPro = user?.is_pro;
  
  // Fetch book details
  const { data: book, isLoading: isLoadingBook } = useQuery({
    queryKey: ["/api/books", bookId],
    enabled: !!bookId,
  });
  
  // Fetch reviews for this book
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["/api/pro/book-reviews", bookId, page],
    queryFn: async () => {
      const res = await fetch(`/api/pro/book-reviews/${bookId}?page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!bookId,
  });

  // Mutation for featuring a review
  const featureMutation = useMutation({
    mutationFn: async ({ reviewId, featured }: { reviewId: number; featured: boolean }) => {
      const res = await fetch(`/api/pro/reviews/${reviewId}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });
      
      if (res.status === 403) {
        throw new Error("Pro subscription required to feature reviews");
      }
      
      if (!res.ok) throw new Error("Failed to feature review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pro/book-reviews", bookId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle featuring/unfeaturing a review
  const handleFeatureToggle = (reviewId: number, currentlyFeatured: boolean) => {
    featureMutation.mutate({
      reviewId,
      featured: !currentlyFeatured
    });
  };

  const isLoading = isLoadingBook || isLoadingReviews;
  const reviews = reviewsData?.reviews || [];
  const hasMore = reviewsData?.hasMore || false;

  function calculateAverageRating(review: any) {
    const metrics = [
      review.enjoyment || 0,
      review.writing || 0,
      review.themes || 0,
      review.characters || 0,
      review.worldbuilding || 0
    ];
    
    const total = metrics.reduce((sum, metric) => sum + metric, 0);
    return total / metrics.filter(m => m > 0).length;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Reviews for {book?.title || "Selected Book"}
      </h2>
      
      {isLoading ? (
        <Card>
          <CardContent className="py-6">
            <p>Loading reviews...</p>
          </CardContent>
        </Card>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p>No reviews found for this book.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {reviews.map((review: Rating & { user: any; featured?: boolean; replies?: any[] }) => (
            <Card key={review.id} className={review.featured ? "border-primary" : undefined}>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-4">
                  {/* Header: User info, timestamp, and average rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        {review.user?.profileImageUrl ? (
                          <AvatarImage src={review.user.profileImageUrl} />
                        ) : (
                          <AvatarFallback>{review.user?.username?.[0] || "U"}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.user?.displayName || review.user?.username || "Anonymous Reader"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {review.featured && (
                        <Badge variant="outline" className="border-primary text-primary">
                          Featured
                        </Badge>
                      )}
                      <div className="flex items-center space-x-1">
                        <StarIcon className="h-4 w-4 text-yellow-500" fill="currentColor" />
                        <span>{calculateAverageRating(review).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review content */}
                  {review.review && (
                    <div className="mt-2">
                      <p className="text-sm leading-relaxed">{review.review}</p>
                    </div>
                  )}
                  
                  {/* Rating metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Enjoyment</p>
                      <StarRating rating={review.enjoyment || 0} readOnly size="xs" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Writing</p>
                      <StarRating rating={review.writing || 0} readOnly size="xs" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Themes</p>
                      <StarRating rating={review.themes || 0} readOnly size="xs" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Characters</p>
                      <StarRating rating={review.characters || 0} readOnly size="xs" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Worldbuilding</p>
                      <StarRating rating={review.worldbuilding || 0} readOnly size="xs" />
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-end space-x-2 mt-4">
                    {isPro && (
                      <Button
                        variant={review.featured ? "outline" : "secondary"}
                        size="sm"
                        onClick={() => handleFeatureToggle(review.id, !!review.featured)}
                        disabled={featureMutation.isPending}
                      >
                        {featureMutation.isPending ? "Updating..." : review.featured ? "Unfeature" : "Feature This Review"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Pagination */}
          {(page > 1 || hasMore) && (
            <div className="flex justify-center space-x-2 mt-4">
              {page > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
              )}
              {hasMore && (
                <Button 
                  variant="outline" 
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}