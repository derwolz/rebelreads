import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Rating } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThumbsDown, ThumbsUp } from "lucide-react";

interface RatingDialogProps {
  bookId: number;
  trigger: React.ReactNode;
}

const REVIEW_MAX_LENGTH = 2000;

type RatingField = "enjoyment" | "writing" | "themes" | "characters" | "worldbuilding";
type RatingValue = -1 | 0 | 1; // -1 = thumbs down, 0 = not answered, 1 = thumbs up

export function RatingDialog({ bookId, trigger }: RatingDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<RatingField, RatingValue>>({
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
        enjoyment: userRating.enjoyment as RatingValue,
        writing: userRating.writing as RatingValue,
        themes: userRating.themes as RatingValue,
        characters: userRating.characters as RatingValue,
        worldbuilding: userRating.worldbuilding as RatingValue,
      });
      setReview(userRating.review || "");
    }
  }, [userRating]);

  // Generate dynamic placeholder text based on ratings
  const reviewPlaceholder = useMemo(() => {
    const prompts: string[] = [];
    
    // Add prompts based on ratings
    if (ratings.enjoyment === 1) {
      prompts.push("What did you enjoy most about this book?");
    } else if (ratings.enjoyment === -1) {
      prompts.push("What didn't you enjoy about this book?");
    }
    
    if (ratings.writing === 1) {
      prompts.push("What did you like about the writing style?");
    } else if (ratings.writing === -1) {
      prompts.push("What didn't you like about the writing style?");
    }
    
    if (ratings.themes === 1) {
      prompts.push("What themes resonated with you?");
    } else if (ratings.themes === -1) {
      prompts.push("What themes didn't work for you?");
    }
    
    if (ratings.characters === 1) {
      prompts.push("What did you like about the characters?");
    } else if (ratings.characters === -1) {
      prompts.push("What didn't you like about the characters?");
    }
    
    if (ratings.worldbuilding === 1) {
      prompts.push("What was it about the setting/world that you liked?");
    } else if (ratings.worldbuilding === -1) {
      prompts.push("What didn't you like about the setting/world?");
    }
    
    // Return default or specific prompts
    if (prompts.length === 0) {
      return "Write your review...";
    } else {
      return prompts.join(" ");
    }
  }, [ratings]);

  const ratingMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("You must be logged in to rate books");
      }

      // Only enjoyment is required
      if (ratings.enjoyment === 0) {
        throw new Error("Please provide your enjoyment rating");
      }

      const payload = {
        ...ratings,
        review: review.trim() || null,
        analysis: null, // Skip sentiment analysis for now
        bookId,
        userId: user.id,
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
        description: "Thank you for your feedback!",
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

  const handleRatingChange = (field: RatingField, value: RatingValue) => {
    // If user clicks the same button that's already selected, reset to 0
    if (ratings[field] === value) {
      setRatings({ ...ratings, [field]: 0 });
    } else {
      setRatings({ ...ratings, [field]: value });
    }
  };

  // Helper for rendering the thumbs up/down buttons
  const renderRatingButtons = (field: RatingField) => {
    return (
      <div className="flex items-center gap-4">
        <Button
          type="button"
          size="sm"
          variant={ratings[field] === -1 ? "destructive" : "outline"}
          className="w-12 h-10"
          onClick={() => handleRatingChange(field, -1)}
        >
          <ThumbsDown className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={ratings[field] === 1 ? "default" : "outline"}
          className="w-12 h-10"
          onClick={() => handleRatingChange(field, 1)}
        >
          <ThumbsUp className="h-5 w-5" />
        </Button>
      </div>
    );
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
            {/* Enjoyment - Required */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label className="text-sm font-medium">Enjoyment (Required)</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-1 text-muted-foreground cursor-help">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="max-w-[200px]">
                          <p className="text-xs text-muted-foreground mt-1">How much you enjoyed the book overall</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {renderRatingButtons("enjoyment")}
            </div>
            
            {/* Writing Style */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label className="text-sm font-medium">Writing Style</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-1 text-muted-foreground cursor-help">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="max-w-[200px]">
                          <p className="text-xs text-muted-foreground mt-1">A measurement of wordchoice, plot, style, overall skill in presenting the book</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {renderRatingButtons("writing")}
            </div>
            
            {/* Themes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label className="text-sm font-medium">Themes</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-1 text-muted-foreground cursor-help">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="max-w-[200px]">
                          <p className="text-xs text-muted-foreground mt-1">A measurement of the ideas. Are they well developed, novel, and thought-provoking?</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {renderRatingButtons("themes")}
            </div>
            
            {/* Characters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label className="text-sm font-medium">Characters</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-1 text-muted-foreground cursor-help">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="max-w-[200px]">
                          <p className="text-xs text-muted-foreground mt-1">A measurement of how well characters are developed and portrayed</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {renderRatingButtons("characters")}
            </div>
            
            {/* World Building */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label className="text-sm font-medium">World Building</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-1 text-muted-foreground cursor-help">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="max-w-[200px]">
                          <p className="text-xs text-muted-foreground mt-1">How rich and believable is the setting? Is it well integrated with the story?</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {renderRatingButtons("worldbuilding")}
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
              placeholder={reviewPlaceholder}
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
            disabled={ratings.enjoyment === 0 || ratingMutation.isPending}
          >
            {ratingMutation.isPending ? "Submitting..." : (userRating ? "Update Rating" : "Submit Rating")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}