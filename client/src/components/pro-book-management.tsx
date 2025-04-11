import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book, Rating, calculateStraightAverageRating } from "@shared/schema";
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

  // Fetch all ratings for user's books
  const { data: allRatings } = useQuery<Rating[]>({
    queryKey: ["/api/my-books/ratings"],
    enabled: !!userBooks?.length,
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

  // Process ratings data
  const bookRatings = new Map<number, Rating[]>();
  allRatings?.forEach(rating => {
    const ratings = bookRatings.get(rating.bookId) || [];
    ratings.push(rating);
    bookRatings.set(rating.bookId, ratings);
  });

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
            const ratings = bookRatings.get(book.id) || [];

            const averageRatings = ratings.length ? {
              // Using straight average calculation for Pro Book Management
              overall: ratings.reduce((acc, r) => acc + calculateStraightAverageRating(r), 0) / ratings.length,
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
                    src={book.images?.find(img => img.imageType === "mini")?.imageUrl || "/images/placeholder-book.png"}
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
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <StarRating
                                  rating={averageRatings.overall}
                                  readOnly
                                  size="sm"
                                />
                                <span className="text-sm text-muted-foreground">
                                  ({averageRatings.overall.toFixed(2)})
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="w-[200px]">
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground mb-2">Showing straight average (not preference-weighted)</p>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Enjoyment</span>
                                  <div className="flex items-center gap-2">
                                    <StarRating rating={averageRatings.enjoyment} readOnly size="sm" />
                                    <span className="text-xs text-muted-foreground">
                                      ({averageRatings.enjoyment.toFixed(2)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Writing</span>
                                  <div className="flex items-center gap-2">
                                    <StarRating rating={averageRatings.writing} readOnly size="sm" />
                                    <span className="text-xs text-muted-foreground">
                                      ({averageRatings.writing.toFixed(2)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Themes</span>
                                  <div className="flex items-center gap-2">
                                    <StarRating rating={averageRatings.themes} readOnly size="sm" />
                                    <span className="text-xs text-muted-foreground">
                                      ({averageRatings.themes.toFixed(2)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Characters</span>
                                  <div className="flex items-center gap-2">
                                    <StarRating rating={averageRatings.characters} readOnly size="sm" />
                                    <span className="text-xs text-muted-foreground">
                                      ({averageRatings.characters.toFixed(2)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">World Building</span>
                                  <div className="flex items-center gap-2">
                                    <StarRating rating={averageRatings.worldbuilding} readOnly size="sm" />
                                    <span className="text-xs text-muted-foreground">
                                      ({averageRatings.worldbuilding.toFixed(2)})
                                    </span>
                                  </div>
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
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
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