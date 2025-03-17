import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book, Rating, calculateWeightedRating } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookUploadDialog } from "@/components/book-upload-wizard";
import { StarRating } from "@/components/star-rating";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BookCsvUploadWizard } from "@/components/book-csv-upload-wizard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ProBookManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: userBooks } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: user?.isAuthor,
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Book deleted",
        description: "Your book has been successfully deleted.",
      });
    },
  });

  const handleCardClick = (e: React.MouseEvent, bookId: number) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/books/${bookId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Management</CardTitle>
        <CardDescription>
          Manage your published books and upload new ones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <BookUploadDialog />
          <BookCsvUploadWizard />
        </div>
        <div className="mt-8 grid gap-6">
          {userBooks?.map((book) => {
            // Query ratings for each book
            const { data: ratings } = useQuery<Rating[]>({
              queryKey: [`/api/books/${book.id}/ratings`],
            });

            // Calculate average ratings
            const averageRatings = ratings?.length ? {
              overall: ratings.reduce((acc, r) => acc + calculateWeightedRating(r), 0) / ratings.length,
              enjoyment: ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length,
              writing: ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
              themes: ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
              characters: ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length,
              worldbuilding: ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length,
            } : null;

            return (
              <div
                key={book.id}
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={(e) => handleCardClick(e, book.id)}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                  <div className="space-y-2">
                    <h3 className="font-semibold">{book.title}</h3>
                    <div className="flex items-center gap-2">
                      {averageRatings ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <StarRating
                                  rating={Math.round(averageRatings.overall)}
                                  readOnly
                                  size="sm"
                                />
                                <span className="text-sm text-muted-foreground">
                                  ({ratings?.length || 0})
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="w-[200px]">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Enjoyment (30%)</span>
                                  <StarRating rating={Math.round(averageRatings.enjoyment)} readOnly size="sm" />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Writing (30%)</span>
                                  <StarRating rating={Math.round(averageRatings.writing)} readOnly size="sm" />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Themes (20%)</span>
                                  <StarRating rating={Math.round(averageRatings.themes)} readOnly size="sm" />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Characters (10%)</span>
                                  <StarRating rating={Math.round(averageRatings.characters)} readOnly size="sm" />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">World Building (10%)</span>
                                  <StarRating rating={Math.round(averageRatings.worldbuilding)} readOnly size="sm" />
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-sm text-muted-foreground">No ratings yet</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <BookUploadDialog book={book} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your book and remove it from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteBookMutation.mutate(book.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}