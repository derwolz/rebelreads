import React, { useState, useEffect } from "react";
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
import { GripVertical, Trash2, PanelLeft, Menu, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
  
  // Initialize with localStorage value or default to false
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Get value from localStorage if available
    const savedState = localStorage.getItem('settings-sidebar-collapsed');
    return savedState ? savedState === 'true' : false;
  });
  
  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('settings-sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);
  
  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);



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
    const revokeButtonRef = React.useRef<HTMLButtonElement>(null);
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
                          <Input 
                            type="password" 
                            autoComplete="current-password"
                            value={field.value || ''} 
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                          />
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
                          <Input 
                            type="password" 
                            autoComplete="new-password"
                            value={field.value || ''} 
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                          />
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
                          <Input 
                            type="password" 
                            autoComplete="new-password"
                            value={field.value || ''} 
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-6">
                  <Button type="submit">Save Changes</Button>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div>
                  <Card className="mb-4">
                    <CardHeader className="pb-3">
                      <CardTitle>Author Account Management</CardTitle>
                      <CardDescription>Manage your author status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isAuthor ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Active</div>
                            <span className="text-sm font-medium">You are registered as an author</span>
                          </div>
                          
                          <p className="text-sm">
                            As an author, you can publish books, manage your portfolio, and access analytics.
                          </p>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                className="w-full"
                              >
                                Revoke Author Status
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke Author Status</AlertDialogTitle>
                                
                                {/* Use regular div instead of AlertDialogDescription to avoid nesting issues */}
                                <div className="space-y-4 py-2">
                                  <div className="bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/30">
                                    <strong>Warning: This action cannot be undone!</strong>
                                  </div>
                                  
                                  <p>Revoking your author status will:</p>
                                  <div className="ml-5 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span>•</span> Delete all books you've published
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span>•</span> Remove your author profile and analytics
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span>•</span> Remove access to author-specific features
                                    </div>
                                  </div>
                                  
                                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                                    <strong className="text-amber-800">Pro Subscription Notice</strong>
                                    <p className="text-amber-800 text-sm">Any active Pro subscription benefits will remain until the expiration date.</p>
                                  </div>
                                </div>
                              </AlertDialogHeader>
                              
                              <div className="border-t pt-4 mt-2">
                                <div className="mb-4">
                                  <div className="font-semibold mb-2">To confirm this permanent change, please type your username:</div>
                                  <div className="font-mono bg-muted px-2 py-1 rounded inline-block mb-2">{user?.username}</div>
                                </div>
                                
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const form = e.target as HTMLFormElement;
                                  const usernameInput = form.elements.namedItem('confirmUsername') as HTMLInputElement;
                                  
                                  if (usernameInput?.value === user?.username) {
                                    console.log("Username confirmed, submitting mutation...");
                                    revokeAuthorMutation.mutate({ confirmUsername: usernameInput.value });
                                  } else {
                                    console.log("Username does not match, cannot submit");
                                  }
                                }}>
                                  <div className="space-y-4">
                                    <Input 
                                      name="confirmUsername"
                                      className="w-full" 
                                      placeholder="Enter your username to confirm"
                                    />
                                    
                                    <div className="flex justify-end gap-2">
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <Button 
                                        type="submit"
                                        variant="destructive"
                                      >
                                        Permanently Revoke Status
                                      </Button>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm">
                            Becoming an author allows you to publish books, build your portfolio, 
                            and connect with readers.
                          </p>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="default" 
                                className="w-full"
                              >
                                Register as Author
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Become an Author</AlertDialogTitle>
                                
                                {/* Use regular div instead of AlertDialogDescription to avoid nesting issues */}
                                <div className="space-y-4 py-2">
                                  <p>
                                    This is a significant change to your account. It will create a new author 
                                    profile for you and enable publishing capabilities.
                                  </p>
                                  
                                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                                    <strong className="text-amber-800">Important</strong>
                                    <p className="text-amber-800 text-sm">
                                      This may affect your existing data. Please confirm you want to proceed.
                                    </p>
                                  </div>
                                </div>
                              </AlertDialogHeader>
                              
                              <div className="border-t pt-4 mt-2">
                                <div className="mb-4">
                                  <div className="font-semibold mb-2">To confirm this change, please type your username:</div>
                                  <div className="font-mono bg-muted px-2 py-1 rounded inline-block mb-2">{user?.username}</div>
                                </div>
                                
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const form = e.target as HTMLFormElement;
                                  const usernameInput = form.elements.namedItem('confirmUsername') as HTMLInputElement;
                                  
                                  if (usernameInput?.value === user?.username) {
                                    console.log("Username confirmed, becoming author...");
                                    becomeAuthorMutation.mutate(undefined);
                                  } else {
                                    console.log("Username does not match, cannot proceed");
                                  }
                                }}>
                                  <div className="space-y-4">
                                    <Input 
                                      name="confirmUsername"
                                      className="w-full" 
                                      placeholder="Enter your username to confirm"
                                    />
                                    
                                    <div className="flex justify-end gap-2">
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <Button 
                                        type="submit"
                                        variant="default"
                                      >
                                        Confirm Registration
                                      </Button>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
                          <div className="mb-4">
                            This action cannot be undone. This will permanently delete your book
                            and remove it from our servers.
                          </div>
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
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="h-full pt-8">
            <SettingsSidebar />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
      </div>
      
      <div className="flex gap-4 md:gap-6 min-h-[calc(100vh-8rem)]">
        {/* Desktop Sidebar */}
        <div 
          className={`hidden md:block ${isSidebarCollapsed ? 'w-[90px]' : 'w-64'} transition-all duration-300 ease-in-out relative`}
        >
          <div className="absolute right-0 top-0 z-10 transform translate-x-1/2 mt-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-7 w-7 bg-background border-r shadow-sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="border-r bg-background/60 h-full px-4 py-6 border-border">
            <SettingsSidebar collapsed={isSidebarCollapsed} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Mobile menu button - only visible on mobile */}
          <div className="md:hidden mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </Button>
          </div>
          
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