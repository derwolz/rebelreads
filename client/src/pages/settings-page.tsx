import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Book, UpdateProfile, updateProfileSchema } from "@shared/schema";
import { MainNav } from "@/components/main-nav";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BookUploader } from "@/components/book-uploader";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReferralLink {
  retailer: string;
  url: string;
  customName?: string;
}

const RETAILER_OPTIONS = ["Amazon", "Barnes & Noble", "IndieBound", "Custom"];

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Keep track of edited referral links per book
  const [editedReferralLinks, setEditedReferralLinks] = useState<{ [bookId: number]: ReferralLink[] }>({});

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      email: user?.email || "",
      username: user?.username || "",
      authorBio: user?.authorBio || "",
      authorName: user?.authorName || ""
    },
  });

  const { data: userBooks } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: user?.isAuthor,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAuthorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/toggle-author");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Author status updated",
        description: user?.isAuthor
          ? "You are no longer registered as an author."
          : "You are now registered as an author!",
      });
    },
  });

  const promoteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const res = await apiRequest("POST", `/api/books/${bookId}/promote`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Book promoted",
        description: "Your book promotion request has been submitted.",
      });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const res = await apiRequest("DELETE", `/api/books/${bookId}`);
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
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async (data: { id: number; referralLinks: ReferralLink[] | undefined }) => {
      const res = await apiRequest("PATCH", `/api/books/${data.id}`, { referralLinks: data.referralLinks });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Book updated",
        description: "Your book has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize edited referral links for a book
  const initializeBookReferralLinks = (bookId: number, links: ReferralLink[] = []) => {
    if (!editedReferralLinks[bookId]) {
      setEditedReferralLinks(prev => ({
        ...prev,
        [bookId]: links
      }));
    }
  };

  // Update referral links for a specific book
  const updateBookReferralLinks = (bookId: number, links: ReferralLink[]) => {
    setEditedReferralLinks(prev => ({
      ...prev,
      [bookId]: links
    }));
  };

  return (
    <div>
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Author Settings</CardTitle>
              <CardDescription>
                Register as an author to publish and manage your books
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Switch
                  checked={user?.isAuthor}
                  onCheckedChange={() => toggleAuthorMutation.mutate()}
                />
                <span>Register as an author</span>
              </div>

              {user?.isAuthor && (
                <Form {...form}>
                  <form className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="authorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Author Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Name to display on your books"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="authorBio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Author Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Write a short bio about yourself..."
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {user?.isAuthor && (
            <Card>
              <CardHeader>
                <CardTitle>My Books</CardTitle>
                <CardDescription>
                  Manage your published books and upload new ones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookUploader />

                <div className="mt-8 grid gap-6">
                  {userBooks?.map((book) => {
                    // Initialize referral links state for this book
                    if (!editedReferralLinks[book.id]) {
                      initializeBookReferralLinks(book.id, book.referralLinks);
                    }

                    return (
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
                            <p className="text-sm text-muted-foreground">
                              {book.promoted ? "Promoted" : "Not promoted"}
                            </p>
                            {/* Add Referral Links Section */}
                            <div className="mt-4 space-y-2">
                              <h4 className="text-sm font-medium">Referral Links</h4>
                              {editedReferralLinks[book.id]?.map((link: ReferralLink, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-sm">{link.customName || link.retailer}:</span>
                                  <Input
                                    value={link.url}
                                    onChange={(e) => {
                                      const newLinks = [...editedReferralLinks[book.id]];
                                      newLinks[index] = { ...link, url: e.target.value };
                                      updateBookReferralLinks(book.id, newLinks);
                                    }}
                                    className="text-sm h-8"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newLinks = editedReferralLinks[book.id].filter((_, i) => i !== index);
                                      updateBookReferralLinks(book.id, newLinks);
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <Select
                                  onValueChange={(value) => {
                                    const newLink = {
                                      retailer: value,
                                      url: "",
                                      customName: value === "Custom" ? "" : undefined,
                                    };
                                    updateBookReferralLinks(book.id, [
                                      ...(editedReferralLinks[book.id] || []),
                                      newLink,
                                    ]);
                                  }}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Add retailer..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {RETAILER_OPTIONS.map((retailer) => (
                                      <SelectItem key={retailer} value={retailer}>
                                        {retailer}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {editedReferralLinks[book.id]?.length > 0 && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        updateBookReferralLinks(book.id, [])
                                      }
                                    >
                                      Clear All
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() =>
                                        updateBookMutation.mutate({
                                          id: book.id,
                                          referralLinks: editedReferralLinks[book.id],
                                        })
                                      }
                                    >
                                      Save Changes
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => promoteBookMutation.mutate(book.id)}
                            disabled={book.promoted}
                          >
                            Promote Book
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your book
                                  and remove it from our servers.
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
          )}
        </div>
      </main>
    </div>
  );
}