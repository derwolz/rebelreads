import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { StarIcon, Flag, MessageSquare } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Rating, calculateWeightedRating } from "@shared/schema";

interface ReportDialogProps {
  reviewId: number;
  onReport: (reason: string) => void;
}

function ReportDialog({ reviewId, onReport }: ReportDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const handleReport = () => {
    onReport(reason);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag className="h-4 w-4 mr-2" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spam" id="spam" />
              <Label htmlFor="spam">Spam</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inappropriate" id="inappropriate" />
              <Label htmlFor="inappropriate">Inappropriate Content</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="harmful" id="harmful" />
              <Label htmlFor="harmful">Harmful Content</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other">Other</Label>
            </div>
          </RadioGroup>
          <Button onClick={handleReport} disabled={!reason}>Submit Report</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ReplyFormProps {
  reviewId: number;
  onReply: (content: string) => void;
}

function ReplyForm({ reviewId, onReply }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    onReply(content);
    setContent("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Reply
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reply to Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your reply..."
            className="min-h-[100px]"
          />
          <Button onClick={handleSubmit} disabled={!content.trim()}>
            Post Reply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewManagement() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/pro/reviews", page],
    queryFn: async () => {
      const res = await fetch(`/api/pro/reviews?page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    }
  });

  const featureMutation = useMutation({
    mutationFn: async ({ reviewId, featured }: { reviewId: number; featured: boolean }) => {
      const res = await fetch(`/api/pro/reviews/${reviewId}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });
      if (!res.ok) throw new Error("Failed to feature review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pro/reviews"] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, content }: { reviewId: number; content: string }) => {
      const res = await fetch(`/api/pro/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to reply to review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pro/reviews"] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: number; reason: string }) => {
      const res = await fetch(`/api/pro/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed to report review");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 bg-muted rounded" />
      ))}
    </div>;
  }

  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Review Management</h1>
      </div>

      <div className="space-y-4">
        {data?.reviews.map((review: Rating & { user: any; book: any; featured?: boolean; replies?: any[] }) => (
          <Card key={review.id} className={review.featured ? "border-primary" : undefined}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.user?.profileImageUrl} alt={review.user?.username} />
                    <AvatarFallback>{review.user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{review.user?.displayName || review.user?.username}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <StarRating rating={Math.round(calculateWeightedRating(review))} readOnly size="sm" />
                      <span>•</span>
                      <span>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={review.featured ? "default" : "ghost"}
                    size="sm"
                    onClick={() => featureMutation.mutate({ reviewId: review.id, featured: !review.featured })}
                  >
                    <StarIcon className="h-4 w-4" />
                  </Button>
                  <ReplyForm
                    reviewId={review.id}
                    onReply={(content) => replyMutation.mutate({ reviewId: review.id, content })}
                  />
                  <ReportDialog
                    reviewId={review.id}
                    onReport={(reason) => reportMutation.mutate({ reviewId: review.id, reason })}
                  />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm">{review.review}</p>
              </div>
              {review.replies?.map((reply) => (
                <div key={reply.id} className="mt-4 pt-4 border-t border-border">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={reply.author?.profileImageUrl} />
                      <AvatarFallback>{reply.author?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">Author Response</span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(reply.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm pl-8">{reply.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center gap-2">
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
          disabled={!data?.hasMore}
        >
          Next
        </Button>
      </div>
    </div>
  );
}