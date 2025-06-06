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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ProBookManagement() {
  const { user, isAuthor } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: authorBooks } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: isAuthor,
  });

  // Fetch all ratings for author's books
  const { data: allRatings } = useQuery<Rating[]>({
    queryKey: ["/api/my-books/ratings"],
    enabled: !!authorBooks?.length,
  });

  const deleteBookMutation = useMutation({
    // Delete using only authorName and bookTitle
    mutationFn: async (book: { id: number; title: string; authorName: string }) => {
      // All books must have an author name, no fallback needed
      const encodedAuthor = encodeURIComponent(book.authorName);
      const encodedTitle = encodeURIComponent(book.title);
      const res = await fetch(`/api/books-by-name/delete?authorName=${encodedAuthor}&bookTitle=${encodedTitle}`, {
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

  const handleCardClick = (e: React.MouseEvent, book: Book) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    // All books have an author name
    const encodedAuthor = encodeURIComponent(book.authorName);
    const encodedTitle = encodeURIComponent(book.title);
    navigate(`/book-details?authorName=${encodedAuthor}&bookTitle=${encodedTitle}`);
  };

  // Process ratings data
  const bookRatings = new Map<number, Rating[]>();
  allRatings?.forEach((rating) => {
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
        </div>
        <div className="mt-8 grid gap-6">
          {authorBooks?.map((book) => {
            const ratings = bookRatings.get(book.id) || [];

            const averageRatings = ratings.length
              ? {
                  // Using straight average calculation for Pro Book Management
                  overall:
                    ratings.reduce(
                      (acc, r) => acc + calculateStraightAverageRating(r),
                      0,
                    ) / ratings.length,
                  enjoyment:
                    ratings.reduce((acc, r) => acc + r.enjoyment, 0) /
                    ratings.length,
                  writing:
                    ratings.reduce((acc, r) => acc + r.writing, 0) /
                    ratings.length,
                  themes:
                    ratings.reduce((acc, r) => acc + r.themes, 0) /
                    ratings.length,
                  characters:
                    ratings.reduce((acc, r) => acc + r.characters, 0) /
                    ratings.length,
                  worldbuilding:
                    ratings.reduce((acc, r) => acc + r.worldbuilding, 0) /
                    ratings.length,
                }
              : null;

            return (
              <div
                key={book.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={(e) => handleCardClick(e, book)}
              >
                <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                  <img
                    src={
                      book.images?.find((img) => img.imageType === "mini")
                        ?.imageUrl || "/images/placeholder-book.png"
                    }
                    alt={book.title}
                    className="w-12 h-18 sm:w-16 sm:h-24 object-cover rounded"
                  />
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="font-semibold text-sm sm:text-base">
                      {book.title}
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {averageRatings ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
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
                                <p className="text-xs text-muted-foreground mb-2">
                                  Showing straight average (not
                                  preference-weighted)
                                </p>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Enjoyment</span>
                                  <div className="flex items-center gap-2">
                                    <StarRating
                                      rating={averageRatings.enjoyment}
                                      readOnly
                                      size="sm"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      ({averageRatings.enjoyment.toFixed(2)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Writing</span>
                                  <div className="flex items-center gap-2">
                                    <StarRating
                                      rating={averageRatings.writing}
                                      readOnly
                                      size="sm"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      ({averageRatings.writing.toFixed(2)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Themes</span>
                                  <div className="flex items-center gap-2">
                                    <StarRating
                                      rating={averageRatings.themes}
                                      readOnly
                                      size="sm"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      ({averageRatings.themes.toFixed(2)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Characters</span>
                                  <div className="flex items-center gap-2">
                                    <StarRating
                                      rating={averageRatings.characters}
                                      readOnly
                                      size="sm"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      ({averageRatings.characters.toFixed(2)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">
                                    World Building
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <StarRating
                                      rating={averageRatings.worldbuilding}
                                      readOnly
                                      size="sm"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      ({averageRatings.worldbuilding.toFixed(2)}
                                      )
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No ratings yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="flex justify-end gap-2 mt-2 sm:mt-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BookUploadDialog book={book} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="h-9">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[90vw] w-full sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your book and remove it from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="mt-2 sm:mt-0">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteBookMutation.mutate(book)}
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
