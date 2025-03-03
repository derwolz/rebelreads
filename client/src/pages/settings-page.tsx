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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
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
  } = useSortable({ id: `${link.retailer}-${index}` });

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
  const [editedReferralLinks, setEditedReferralLinks] = useState<{ [bookId: number]: ReferralLink[] }>({});
  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      email: user?.email || "",
      username: user?.username || "",
      authorBio: user?.authorBio || "",
      authorName: user?.authorName || "",
      birthDate: user?.birthDate || null,
      deathDate: user?.deathDate || null,
      website: user?.website || ""
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
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birth Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deathDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Death Date (if applicable)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://yourwebsite.com"
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
                <BookUploadDialog />

                <div className="mt-8 grid gap-6">
                  {userBooks?.map((book) => {
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
                            <div className="mt-4 space-y-2">
                              <h4 className="text-sm font-medium">Referral Links</h4>
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(event) => {
                                  const { active, over } = event;
                                  if (over && active.id !== over.id) {
                                    const oldIndex = parseInt(active.id.split('-')[1]);
                                    const newIndex = parseInt(over.id.split('-')[1]);
                                    const newLinks = arrayMove(editedReferralLinks[book.id], oldIndex, newIndex);
                                    updateBookReferralLinks(book.id, newLinks);
                                  }
                                }}
                              >
                                <SortableContext
                                  items={editedReferralLinks[book.id]?.map((_, i) => `${book.id}-${i}`) || []}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {editedReferralLinks[book.id]?.map((link: ReferralLink, index: number) => (
                                    <SortableReferralLink
                                      key={`${link.retailer}-${index}`}
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