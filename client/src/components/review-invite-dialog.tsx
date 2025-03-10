import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export function ReviewInviteDialog() {
  const [open, setOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check for available gifted books
  const { data: availableBook } = useQuery({
    queryKey: ["/api/gifted-books/available"],
    enabled: !!user, // Only fetch when user is logged in
  });

  // Mutation to claim a book
  const claimBookMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/gifted-books/claim", {
        method: "POST",
        body: JSON.stringify({ uniqueCode: availableBook?.giftedBook.uniqueCode }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifted-books/available"] });
      toast({
        title: "Success",
        description: "You've claimed your free book! Happy reading!",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to claim book",
        variant: "destructive",
      });
    },
  });

  // Show dialog when an available book is found
  useEffect(() => {
    if (availableBook) {
      setOpen(true);
    }
  }, [availableBook]);

  const handleAccept = () => {
    if (!acceptedTerms) {
      toast({
        title: "Error",
        description: "Please accept the terms to receive your free book",
        variant: "destructive",
      });
      return;
    }
    claimBookMutation.mutate();
  };

  const handleReject = () => {
    setOpen(false);
  };

  if (!availableBook) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] h-[50vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif italic text-center">
            The Siren Calls...
          </DialogTitle>
          <DialogDescription className="text-lg text-center">
            A free book awaits your thoughtful review
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-4">
            <img
              src={availableBook.book.coverUrl}
              alt={availableBook.book.title}
              className="h-32 w-24 object-cover rounded"
            />
            <div>
              <h3 className="font-medium text-lg">{availableBook.book.title}</h3>
              <p className="text-muted-foreground">{availableBook.book.author}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Program Terms</h4>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You promise to read and review this book</li>
              <li>
                Books are provided at cost to the author, but there is no
                expectation of high praise
              </li>
              <li>
                Please give your honest thoughts and opinions as that will help
                both the author and future book buyers
              </li>
              <li>
                Failure to leave an adequate review may result in removal from
                the program
              </li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) =>
                setAcceptedTerms(checked as boolean)
              }
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              I promise to read and review this book honestly
            </label>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleReject}>
              Maybe Later
            </Button>
            <Button
              onClick={handleAccept}
              disabled={claimBookMutation.isPending}
            >
              {claimBookMutation.isPending ? "Claiming..." : "Get Free Book"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}