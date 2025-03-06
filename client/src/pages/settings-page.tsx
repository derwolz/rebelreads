import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book, UpdateProfile, ReferralLink, updateProfileSchema } from "@shared/schema";
import { MainNav } from "@/components/main-nav";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ReaderSettings } from "@/components/reader-settings";
import { BookUploadDialog } from "@/components/book-upload-wizard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

interface SortableReferralLinkProps {
  link: ReferralLink;
  index: number;
  onChange: (value: string) => void;
  onRemove: () => void;
}

function SortableReferralLink({ link, index, onChange, onRemove }: SortableReferralLinkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-primary"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm">{link.customName || link.retailer}:</span>
      <Input
        value={link.url}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm h-8"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
      >
        ×
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedReferralLinks, setEditedReferralLinks] = useState<{ [bookId: number]: ReferralLink[] }>({});
  const [location] = useLocation();
  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      email: user?.email || "",
      username: user?.username || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
  });

  const { data: userBooks } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: user?.isAuthor,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
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
      const res = await fetch("/api/user/toggle-author", {
        method: "POST",
        credentials: "include",
      });
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
    mutationFn: async (data: { id: number; referralLinks: ReferralLink[] }) => {
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

  const initializeBookReferralLinks = (bookId: number, links: ReferralLink[] = []) => {
    if (!editedReferralLinks[bookId]) {
      setEditedReferralLinks(prev => ({
        ...prev,
        [bookId]: links
      }));
    }
  };

  const updateBookReferralLinks = (bookId: number, links: ReferralLink[]) => {
    setEditedReferralLinks(prev => ({
      ...prev,
      [bookId]: links
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onSubmit = (data: UpdateProfile) => {
    updateProfileMutation.mutate(data);
  }

  let content;
  if (location === "/settings/account") {
    content = (
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      Your email address for notifications and account recovery
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      Your unique username for logging in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Must be at least 8 characters long
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex items-center space-x-4">
                  <Switch
                    checked={user?.isAuthor}
                    onCheckedChange={() => toggleAuthorMutation.mutate()}
                  />
                  <span>Register as an author</span>
                </div>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  } else if (location === "/settings/author" && user?.isAuthor) {
    content = (
      <Card>
        <CardHeader>
          <CardTitle>Author Settings</CardTitle>
          <CardDescription>
            Manage your published books and upload new ones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookUploadDialog />
          <div className="mt-8 grid gap-6">
            {userBooks?.map((book) => {
              if (!editedReferralLinks[book.id]) {
                initializeBookReferralLinks(book.id, book.referralLinks as ReferralLink[]);
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
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Referral Links</h4>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => {
                            const { active, over } = event;
                            if (over && active.id !== over.id) {
                              const oldIndex = Number(active.id);
                              const newIndex = Number(over.id);
                              const newLinks = arrayMove(editedReferralLinks[book.id], oldIndex, newIndex);
                              updateBookReferralLinks(book.id, newLinks);
                            }
                          }}
                        >
                          <SortableContext
                            items={editedReferralLinks[book.id]?.map((_, i) => i) || []}
                            strategy={verticalListSortingStrategy}
                          >
                            {editedReferralLinks[book.id]?.map((link, index) => (
                              <SortableReferralLink
                                key={index}
                                link={link}
                                index={index}
                                onChange={(newUrl) => {
                                  const newLinks = [...editedReferralLinks[book.id]];
                                  newLinks[index] = { ...link, url: newUrl };
                                  updateBookReferralLinks(book.id, newLinks);
                                }}
                                onRemove={() => {
                                  const newLinks = editedReferralLinks[book.id].filter((_, i) => i !== index);
                                  updateBookReferralLinks(book.id, newLinks);
                                }}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                        <div className="flex gap-2">
                          <Select
                            onValueChange={(value) => {
                              const newLink: ReferralLink = {
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
                                onClick={() => updateBookReferralLinks(book.id, [])}
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
                      disabled={book.promoted || false}
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
    );
  } else {
    content = <ReaderSettings />;
  }

  return (
    <div>
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <div className="flex gap-8">
          <SettingsSidebar />
          <div className="flex-1">
            {content}
          </div>
        </div>
      </main>
    </div>
  );
}

async function apiRequest(method: string, url: string, data?: any) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include'
  });
  return res;
}

const RETAILER_OPTIONS = ["Amazon", "Barnes & Noble", "IndieBound", "Custom"] as const;