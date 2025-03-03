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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookUploader } from "@/components/book-uploader";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const profileForm = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      email: user?.email || "",
      username: user?.username || "",
      authorBio: user?.authorBio || "",
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
                <Textarea
                  className="mt-4"
                  placeholder="Write a short bio about yourself..."
                  value={profileForm.watch("authorBio")}
                  onChange={(e) =>
                    profileForm.setValue("authorBio", e.target.value)
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your profile information and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit((data) =>
                    updateProfileMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          onChange={(e) =>
                            profileForm.setValue(
                              "currentPassword",
                              e.target.value
                            )
                          }
                        />
                      </FormControl>
                    </FormItem>

                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          onChange={(e) =>
                            profileForm.setValue("newPassword", e.target.value)
                          }
                        />
                      </FormControl>
                    </FormItem>
                  </div>

                  <Button type="submit">
                    Save Changes
                  </Button>
                </form>
              </Form>
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
                          <p className="text-sm text-muted-foreground">
                            {book.promoted ? "Promoted" : "Not promoted"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => promoteBookMutation.mutate(book.id)}
                        disabled={book.promoted}
                      >
                        Promote Book
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}