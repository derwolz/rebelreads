import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Rating } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

export function RatingDialog({ bookId, trigger }: RatingDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState({
    enjoyment: 0,
    writing: 0,
    themes: 0,
    characters: 0,
    worldbuilding: 0,
  });
  const [review, setReview] = useState("");

  const ratingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/books/${bookId}/ratings`, {
        ...ratings,
        review,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/ratings`] });
      toast({
        title: "Rating submitted",
        description: "Thank you for your review!",
      });
      setOpen(false);
      setRatings({
        enjoyment: 0,
        writing: 0,
        themes: 0,
        characters: 0,
        worldbuilding: 0,
      });
      setReview("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate this book</DialogTitle>
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
            <label className="text-sm font-medium">Review</label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
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
            disabled={!Object.values(ratings).every(Boolean)}
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
