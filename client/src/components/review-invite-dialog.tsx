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

export function ReviewInviteDialog() {
  const [open, setOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for available gifted books
  const { data: availableBook } = useQuery({
    queryKey: ["/api/gifted-books/available"],
    enabled: open, // Only fetch when dialog is open
  });

  // Mutation to claim a book
  const claimBookMutation = useMutation({
    mutationFn: async () => {
      return fetch("/api/gifted-books/claim", {
        method: "POST",
        body: JSON.stringify({ bookId: availableBook?.id }),
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

  // Check for available books when user logs in
  useEffect(() => {
    const checkForBooks = async () => {
      const response = await fetch("/api/gifted-books/available");
      const data = await response.json();
      if (data?.id) {
        setOpen(true);
      }
    };
    checkForBooks();
  }, []);

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
              src={availableBook.coverUrl}
              alt={availableBook.title}
              className="h-32 w-24 object-cover rounded"
            />
            <div>
              <h3 className="font-medium text-lg">{availableBook.title}</h3>
              <p className="text-muted-foreground">{availableBook.author}</p>
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
                Failure to leave an adequate review may result in removal from the
                program
              </li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
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
