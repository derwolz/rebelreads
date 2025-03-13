import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book } from "@shared/schema";
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
import { Edit } from "lucide-react";

export function ProBookManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          {userBooks?.map((book) => (
            <div
              key={book.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-16 h-24 object-cover rounded"
                />
                <div>
                  <h3 className="font-semibold">{book.title}</h3>
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}