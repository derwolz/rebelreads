import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book, UpdateProfile, ReferralLink, updateProfileSchema, RETAILER_OPTIONS } from "@shared/schema";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ReaderSettings } from "@/components/reader-settings";
import { BookUploadDialog } from "@/components/book-upload-wizard";
import { RatingPreferencesSettings } from "@/components/rating-preferences-settings";
import { GenrePreferencesSettings } from "@/components/genre-preferences-settings";
import { HomepageSettings } from "@/components/homepage-settings";
import { RecommendationsSidebar } from "@/components/recommendations-sidebar";
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
import { GripVertical, Trash2, PanelLeft, Menu } from "lucide-react";
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
import { AppearanceSettings } from "@/components/appearance-settings";
import { ContentFiltersSettings } from "@/components/content-filters-settings";
import { BookShelfSettings } from "@/components/book-shelf-settings";
import { cn } from "@/lib/utils";

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
      <div className="flex items-center gap-1">
        {link.faviconUrl && (
          <img 
            src={link.faviconUrl} 
            alt=""
            className="w-4 h-4 inline-block" 
          />
        )}
        <span className="text-sm">{link.customName || link.retailer}:</span>
        {link.domain && (
          <span className="text-xs text-muted-foreground">({link.domain})</span>
        )}
      </div>
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
  const { user, isAuthor, authorDetails, becomeAuthorMutation, revokeAuthorMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedReferralLinks, setEditedReferralLinks] = useState<{ [bookId: number]: ReferralLink[] }>({});
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);



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
    enabled: isAuthor,
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

  // Using becomeAuthorMutation from useAuth hook instead of standalone toggleAuthorMutation

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

  const AccountSettings = () => {
    return (
      <Card>
        <CardContent className="pt-6">
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
                <div>
                  {isAuthor ? (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">You are registered as an author</span>
                        <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Active</div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="flex items-center gap-2 text-destructive border-destructive hover:bg-destructive/10">
                            <span>Revoke Author Status</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Author Status</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-4">
                              <p className="font-medium text-destructive">Warning: This action cannot be undone!</p>
                              <p>Revoking your author status will:</p>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Delete all books you've published</li>
                                <li>Remove your author profile and analytics</li>
                                <li>Remove access to author-specific features</li>
                              </ul>
                              
                              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mt-4">
                                <p className="font-medium text-amber-800">Pro Subscription Notice</p>
                                <p className="text-amber-800 text-sm">Any active Pro subscription benefits will remain until the expiration date.</p>
                              </div>
                              
                              <div className="border-t pt-4 mt-2">
                                <p className="font-semibold mb-2">To confirm this permanent change, please type your username:</p>
                                <p className="font-mono bg-muted px-2 py-1 rounded inline-block mb-2">{user?.username}</p>
                                <Input 
                                  id="revoke-confirm-username" 
                                  className="mt-2" 
                                  placeholder="Enter your username to confirm"
                                  onChange={(e) => {
                                    const confirmButton = document.getElementById('revoke-author-button') as HTMLButtonElement;
                                    if (confirmButton) {
                                      confirmButton.disabled = e.target.value !== user?.username;
                                    }
                                  }}
                                />
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              id="revoke-author-button"
                              disabled={true}
                              onClick={(e) => {
                                e.preventDefault();
                                console.log("Revoke button clicked");
                                const confirmInput = document.getElementById('revoke-confirm-username') as HTMLInputElement;
                                console.log("Confirm input:", confirmInput?.value);
                                console.log("Username:", user?.username);
                                if (confirmInput && confirmInput.value === user?.username) {
                                  console.log("Submitting mutation...");
                                  revokeAuthorMutation.mutate({ confirmUsername: confirmInput.value });
                                } else {
                                  console.log("Username does not match, cannot submit");
                                }
                              }}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Permanently Revoke Status
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <span>Register as Author</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Become an Author</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-4">
                            <p>This is a significant change to your account. It will likely delete all your existing data and you will have to start again from the beginning.</p>
                            
                            <div className="border-t pt-4">
                              <p className="font-semibold mb-2">To confirm this change, please type your username:</p>
                              <p className="font-mono bg-muted px-2 py-1 rounded inline-block mb-2">{user?.username}</p>
                              <Input 
                                id="confirm-username" 
                                className="mt-2" 
                                placeholder="Enter your username to confirm"
                                onChange={(e) => {
                                  const confirmButton = document.getElementById('confirm-author-button') as HTMLButtonElement;
                                  if (confirmButton) {
                                    confirmButton.disabled = e.target.value !== user?.username;
                                  }
                                }}
                              />
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            id="confirm-author-button"
                            disabled={true}
                            onClick={() => {
                              becomeAuthorMutation.mutate(undefined);
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Confirm Change
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };


  let content;
  if (location === "/settings/account") {
    content = (
      <AccountSettings />
    );
  } else if (location === "/settings/appearance") {
    content = <AppearanceSettings />;
  } else if (location === "/settings/rating-preferences") {
    content = <RatingPreferencesSettings isWizard={false} />;
  } else if (location === "/settings/genre-preferences") {
    content = <GenrePreferencesSettings />;
  } else if (location === "/settings/homepage") {
    content = <HomepageSettings />;
  } else if (location === "/settings/filters") {
    content = <ContentFiltersSettings />;
  } else if (location === "/settings/book-shelf") {
    content = <BookShelfSettings />;
  } else if (location === "/settings/author" && isAuthor) {
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
                      src={book.images?.find(img => img.imageType === "mini")?.imageUrl || "/images/placeholder-book.png"}
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
                                retailer: value as (typeof RETAILER_OPTIONS)[number],
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
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={() => setIsSidebarOpen(true)}
        >
          <PanelLeft className="h-6 w-6" />
        </Button>
      </div>
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <SettingsSidebar isMobile={false} />
        </div>

        {/* Mobile Sidebar with framer motion drag */}
        <SettingsSidebar 
          isMobile={true} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {content}
        </div>
      </div>
    </main>
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

// RETAILER_OPTIONS is already imported at the top of the file