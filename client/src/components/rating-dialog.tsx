import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Rating } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RatingDialogProps {
  bookId: number;
  trigger: React.ReactNode;
}

const REVIEW_MAX_LENGTH = 2000;

export function RatingDialog({ bookId, trigger }: RatingDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState({
    enjoyment: 0,
    writing: 0,
    themes: 0,
    characters: 0,
    worldbuilding: 0,
  });
  const [review, setReview] = useState("");

  // Get all ratings to find user's existing rating
  const { data: existingRatings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${bookId}/ratings`],
  });

  // Find user's existing rating
  const userRating = existingRatings?.find(r => r.userId === user?.id);

  // Initialize form with existing rating if found
  useEffect(() => {
    if (userRating) {
      setRatings({
        enjoyment: userRating.enjoyment,
        writing: userRating.writing,
        themes: userRating.themes,
        characters: userRating.characters,
        worldbuilding: userRating.worldbuilding,
      });
      setReview(userRating.review || "");
    }
  }, [userRating]);

  const ratingMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...ratings,
        review: review.trim() || null,
        analysis: null, // Skip sentiment analysis for now
        bookId,
        userId: user!.id,
      };

      const res = await apiRequest("POST", `/api/books/${bookId}/ratings`, payload);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/ratings`] });
      toast({
        title: userRating ? "Rating updated" : "Rating submitted",
        description: "Thank you for your review!",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Rating failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= REVIEW_MAX_LENGTH) {
      setReview(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{userRating ? "Update your rating" : "Rate this book"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Enjoyment (30%)</label>
              <StarRating
                rating={ratings.enjoyment}
                onChange={(value) => setRatings({ ...ratings, enjoyment: value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Writing Style (30%)</label>
              <StarRating
                rating={ratings.writing}
                onChange={(value) => setRatings({ ...ratings, writing: value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Themes (20%)</label>
              <StarRating
                rating={ratings.themes}
                onChange={(value) => setRatings({ ...ratings, themes: value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Characters (10%)</label>
              <StarRating
                rating={ratings.characters}
                onChange={(value) => setRatings({ ...ratings, characters: value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">World Building (10%)</label>
              <StarRating
                rating={ratings.worldbuilding}
                onChange={(value) => setRatings({ ...ratings, worldbuilding: value })}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium">Review</label>
              <span className="text-sm text-muted-foreground">
                {review.length}/{REVIEW_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              value={review}
              onChange={handleReviewChange}
              placeholder="Write your review..."
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => ratingMutation.mutate()}
            disabled={!Object.values(ratings).every(Boolean) || ratingMutation.isPending}
          >
            {ratingMutation.isPending ? "Submitting..." : (userRating ? "Update Rating" : "Submit Rating")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}