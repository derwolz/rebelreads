import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, Flag, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/api-helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface BookReviewManagementProps {
  bookId: number;
}

interface Review {
  id: number;
  userId: number;
  bookId: number;
  enjoyment: number;
  writing: number;
  themes: number;
  characters: number;
  worldbuilding: number;
  text: string;
  createdAt: string;
  featured: boolean;
  report_status?: string;
  user: {
    username: string;
    displayName: string;
    profileImageUrl: string | null;
  };
  replies: Reply[];
}

interface Reply {
  id: number;
  reviewId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author: {
    username: string;
    profileImageUrl: string | null;
  };
}

export function BookReviewManagement({ bookId }: BookReviewManagementProps) {
  const [page, setPage] = useState(1);
  const [replyContent, setReplyContent] = useState<{ [key: number]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: number]: boolean }>({});

  interface ReviewResponse {
    reviews: Review[];
    hasMore: boolean;
    totalPages: number;
  }

  const { data, isLoading, isError, error, refetch } = useQuery<ReviewResponse>({
    queryKey: ["book-reviews", bookId, page],
    queryFn: () => apiRequest<ReviewResponse>(`/api/pro/book-reviews/${bookId}?page=${page}`),
    enabled: !!bookId,
  });

  interface FeatureResponse {
    success: boolean;
    featured: boolean;
    reviewId: number;
  }

  interface ReplyResponse extends Reply {
    author: {
      username: string;
      profileImageUrl: string | null;
    }
  }

  const featureReview = async (reviewId: number, featured: boolean) => {
    try {
      await apiRequest<FeatureResponse>(`/api/pro/reviews/${reviewId}/feature`, {
        method: "POST",
        body: { featured }
      });
      
      toast({
        title: featured ? "Review featured" : "Review unfeatured",
        description: featured 
          ? "This review will now be highlighted on your book page" 
          : "This review will no longer be highlighted",
        variant: "default",
      });
      
      refetch();
    } catch (error) {
      console.error("Error featuring review:", error);
      toast({
        title: "Error",
        description: "Could not update the review's featured status",
        variant: "destructive",
      });
    }
  };

  const submitReply = async (reviewId: number) => {
    if (!replyContent[reviewId] || replyContent[reviewId].trim() === "") {
      toast({
        title: "Cannot submit empty reply",
        description: "Please enter some text for your reply",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting({ ...submitting, [reviewId]: true });
    
    try {
      await apiRequest<ReplyResponse>(`/api/pro/reviews/${reviewId}/reply`, {
        method: "POST",
        body: { content: replyContent[reviewId] }
      });
      
      // Clear the input
      setReplyContent({ ...replyContent, [reviewId]: "" });
      
      toast({
        title: "Reply submitted",
        description: "Your reply has been posted",
        variant: "default",
      });
      
      refetch();
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Error",
        description: "Could not submit your reply",
        variant: "destructive",
      });
    } finally {
      setSubmitting({ ...submitting, [reviewId]: false });
    }
  };

  function calculateAverageRating(review: Review) {
    const ratings = [
      review.enjoyment, 
      review.writing, 
      review.themes, 
      review.characters, 
      review.worldbuilding
    ].filter(Boolean);
    
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Reviews</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 my-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div className="text-destructive font-medium">
            Error loading reviews: {(error as Error)?.message || "Unknown error"}
          </div>
        </div>
      </div>
    );
  }

  // Use data with proper typing, or fallback to empty state if undefined
  const { reviews = [], hasMore = false, totalPages = 0 } = data || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Reviews</h3>
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages || 1}
        </div>
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review: Review) => (
            <Card key={review.id} className={`mb-4 ${review.featured ? 'border-2 border-amber-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={review.user.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {review.user.displayName.charAt(0).toUpperCase() || review.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{review.user.displayName || review.user.username}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Star className="mr-1 h-4 w-4 text-amber-500" />
                            <span>{calculateAverageRating(review).toFixed(1)}</span>
                          </div>
                          <span className="mx-1">•</span>
                          <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={review.featured ? "default" : "outline"}
                          size="sm"
                          onClick={() => featureReview(review.id, !review.featured)}
                        >
                          <ThumbsUp className="mr-1 h-4 w-4" />
                          {review.featured ? 'Featured' : 'Feature'}
                        </Button>
                        {review.report_status && review.report_status !== 'none' && (
                          <Badge variant="destructive" className="flex items-center">
                            <Flag className="mr-1 h-3 w-3" />
                            Reported
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {review.enjoyment && (
                          <div className="flex items-center text-sm">
                            <span className="font-medium">Enjoyment:</span>
                            <span className="ml-2">{review.enjoyment}/5</span>
                          </div>
                        )}
                        {review.writing && (
                          <div className="flex items-center text-sm">
                            <span className="font-medium">Writing:</span>
                            <span className="ml-2">{review.writing}/5</span>
                          </div>
                        )}
                        {review.themes && (
                          <div className="flex items-center text-sm">
                            <span className="font-medium">Themes:</span>
                            <span className="ml-2">{review.themes}/5</span>
                          </div>
                        )}
                        {review.characters && (
                          <div className="flex items-center text-sm">
                            <span className="font-medium">Characters:</span>
                            <span className="ml-2">{review.characters}/5</span>
                          </div>
                        )}
                        {review.worldbuilding && (
                          <div className="flex items-center text-sm">
                            <span className="font-medium">Worldbuilding:</span>
                            <span className="ml-2">{review.worldbuilding}/5</span>
                          </div>
                        )}
                      </div>
                      {review.text && (
                        <p className="text-sm mt-2">{review.text}</p>
                      )}
                    </div>

                    {/* Replies section */}
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-4 border-t pt-2">
                        <p className="text-sm font-medium mb-2">Replies:</p>
                        <ScrollArea className="max-h-48">
                          {review.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={reply.author.profileImageUrl || undefined} />
                                <AvatarFallback>{reply.author.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-1">
                                  <p className="text-xs font-medium">{reply.author.username}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}

                    {/* Reply form */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent[review.id] || ''}
                          onChange={(e) => setReplyContent({ ...replyContent, [review.id]: e.target.value })}
                          className="min-h-[80px] text-sm"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => submitReply(review.id)}
                          disabled={submitting[review.id] || !replyContent[review.id]}
                        >
                          <MessageSquare className="mr-1 h-4 w-4" />
                          {submitting[review.id] ? 'Submitting...' : 'Reply'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted rounded-lg p-6 text-center">
          <p>No reviews found for this book.</p>
        </div>
      )}
    </div>
  );
}