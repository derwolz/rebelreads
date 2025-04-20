import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookCard } from "@/components/book-card";
import { BookShelfCard } from "@/components/book-shelf-card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { BookOpen, Plus, X, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define types based on schema
type BookShelf = {
  id: number;
  userId: number;
  title: string;
  coverImageUrl: string;
  rank: number;
  createdAt: string;
  updatedAt: string;
};

import { Book, BookImage } from "../types";

type ShelfBook = {
  id: number;
  bookId: number;
  shelfId: number;
  rank: number;
  addedAt: string;
  book: Book & {
    // Extra fields not in the Book interface but needed for display
    coverUrl?: string;
  };
};

type Note = {
  id: number;
  userId: number;
  content: string;
  type: "book" | "shelf";
  bookId?: number;
  shelfId?: number;
  createdAt: string;
  updatedAt: string;
};

type BookShelfData = {
  shelf: BookShelf;
  shelfNotes: Note[];
  books: ShelfBook[];
  bookNotes: Note[];
};

// Form schema for notes
const noteFormSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

// BookShelf page component
export default function BookShelfPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [activeNoteType, setActiveNoteType] = useState<"book" | "shelf" | null>(null);
  const [activeBookId, setActiveBookId] = useState<number | null>(null);
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  
  // Extract query parameters from URL
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const username = searchParams.get('username');
  const shelfname = searchParams.get('shelfname');
  
  // We only use query parameters for bookshelf access

  // Form for adding/editing notes
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  // Fetch bookshelf data (using query parameters only)
  const { data, isLoading, error } = useQuery<BookShelfData>({
    queryKey: [`/api/book-shelf?username=${encodeURIComponent(username || '')}&shelfname=${encodeURIComponent(shelfname || '')}`],
    enabled: !!user && !!username && !!shelfname,
  });

  // Find active note
  const activeNote = React.useMemo(() => {
    if (!activeNoteId || !activeNoteType || !data) return null;
    
    if (activeNoteType === "shelf") {
      return data.shelfNotes.find(note => note.id === activeNoteId);
    } else {
      return data.bookNotes.find(note => note.id === activeNoteId);
    }
  }, [activeNoteId, activeNoteType, data]);

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: async (values: NoteFormValues) => {
      const endpoint = activeNoteType === "shelf" 
        ? `/api/bookshelves/${id}/notes` 
        : `/api/books/${activeBookId}/notes`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          type: activeNoteType,
          shelfId: activeNoteType === "shelf" ? parseInt(id) : undefined,
          bookId: activeNoteType === "book" ? activeBookId : undefined,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to add note");
      }
      
      return res.json();
    },
    onSuccess: () => {
      const queryKey = [`/api/book-shelf?username=${encodeURIComponent(username || '')}&shelfname=${encodeURIComponent(shelfname || '')}`];
      queryClient.invalidateQueries({ queryKey });
      setIsAddNoteDialogOpen(false);
      form.reset();
      toast({
        title: "Note added",
        description: "Your note has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit Note Mutation
  const editNoteMutation = useMutation({
    mutationFn: async (values: { id: number; content: string }) => {
      const res = await fetch(`/api/notes/${values.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: values.content }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to update note");
      }
      
      return res.json();
    },
    onSuccess: () => {
      const queryKey = [`/api/book-shelf?username=${encodeURIComponent(username || '')}&shelfname=${encodeURIComponent(shelfname || '')}`];
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete Note Mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete note");
      }
      
      return res.json();
    },
    onSuccess: () => {
      const queryKey = useQueryParams 
        ? [`/api/book-shelf?username=${encodeURIComponent(username || '')}&shelfname=${encodeURIComponent(shelfname || '')}`]
        : [`/api/book-shelf/${id}`];
      queryClient.invalidateQueries({ queryKey });
      if (activeNoteId === deleteNoteMutation.variables) {
        setActiveNoteId(null);
        setActiveNoteType(null);
      }
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Remove Book from Shelf Mutation
  const removeBookFromShelfMutation = useMutation({
    mutationFn: async ({ shelfId, bookId }: { shelfId: number; bookId: number }) => {
      const res = await fetch(`/api/bookshelves/${shelfId}/books/${bookId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to remove book from shelf");
      }
      
      return res.json();
    },
    onSuccess: () => {
      const queryKey = useQueryParams 
        ? [`/api/book-shelf?username=${encodeURIComponent(username || '')}&shelfname=${encodeURIComponent(shelfname || '')}`]
        : [`/api/book-shelf/${id}`];
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Book removed",
        description: "The book has been removed from this shelf.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle note submission
  const onSubmit = (values: NoteFormValues) => {
    if (activeNote) {
      editNoteMutation.mutate({ id: activeNote.id, content: values.content });
    } else {
      addNoteMutation.mutate(values);
    }
  };

  // Handle adding a new note
  const handleAddNote = (type: "book" | "shelf", bookId?: number) => {
    setActiveNoteType(type);
    setActiveBookId(bookId || null);
    setActiveNoteId(null);
    form.reset({ content: "" });
    setIsAddNoteDialogOpen(true);
  };



  // Handle selecting a note
  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setActiveNoteType(note.type);
    setActiveBookId(note.bookId || null);
    form.setValue("content", note.content);
  };

  // Handle note deletion
  const handleDeleteNote = (noteId: number) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Get truncated content for tooltip
  const getTruncatedContent = (content: string, maxLength = 40) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <p>Loading bookshelf...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center">
              <p className="text-red-500 mb-2">Error loading bookshelf</p>
              <p>{error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { shelf, shelfNotes, books, bookNotes } = data;

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{shelf.title}</CardTitle>
              <CardDescription>
                Created on {formatDate(shelf.createdAt)}
              </CardDescription>
            </div>
            <div>
              <Button onClick={() => handleAddNote("shelf")}>
                <Plus className="mr-2 h-4 w-4" /> Add Shelf Note
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column - Shelf Notes */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Shelf Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {shelfNotes.length > 0 ? (
                  <div className="space-y-4">
                    {shelfNotes.map((note) => (
                      <TooltipProvider key={note.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Card 
                              className={`cursor-pointer ${
                                activeNoteId === note.id ? "border-primary" : ""
                              }`}
                              onClick={() => handleSelectNote(note)}
                            >
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <Badge variant="outline">Shelf Note</Badge>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(note.createdAt)}
                                  </div>
                                </div>
                                <p className="text-sm line-clamp-2">{note.content}</p>
                              </CardContent>
                            </Card>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getTruncatedContent(note.content)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-center">
                      No shelf notes yet.<br />
                      Add a note to get started.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Active Note */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {activeNote 
                    ? activeNote.type === "shelf" 
                      ? "Shelf Note" 
                      : "Book Note"
                    : "Note Details"
                  }
                </CardTitle>
                {activeNote && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        setIsAddNoteDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDeleteNote(activeNote.id)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeNote ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline">
                      {activeNote.type === "shelf" ? "Shelf Note" : "Book Note"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activeNote.createdAt)}
                    </span>
                  </div>
                  <ScrollArea className="h-[350px] pr-4">
                    <p className="whitespace-pre-wrap">{activeNote.content}</p>
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground text-center">
                    Select a note to view details<br />
                    or add a new note.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Books Carousel */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Books in this Shelf</h2>
        {books.length > 0 ? (
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {books.map((shelfBook) => {
                  const bookId = shelfBook.bookId;
                  const bookNotesList = bookNotes.filter(note => note.bookId === bookId);
                  
                  // Get the book-card image or fallback to coverUrl
                  const coverImage = shelfBook.book.images?.find(img => img.imageType === "book-card")?.imageUrl 
                    || shelfBook.book.coverUrl 
                    || "/images/placeholder-book.png";

                  return (
                    <CarouselItem key={shelfBook.id} className="md:basis-1/4 lg:basis-1/5">
                      <div className="group relative p-1">
                        <div className="relative group">
                          {/* Convert shelf book to the format expected by BookCard */}
                          <BookShelfCard
                            book={{
                                ...shelfBook.book,
                                authorId: shelfBook.book.authorId || 0,
                                authorName: shelfBook.book.authorName || "Unknown Author",
                                description: shelfBook.book.description || "",
                                promoted: shelfBook.book.promoted ?? null,
                                pageCount: shelfBook.book.pageCount ?? null,
                                formats: shelfBook.book.formats ?? [],
                                publishedDate: shelfBook.book.publishedDate ?? null,
                                awards: shelfBook.book.awards ?? null,
                                originalTitle: shelfBook.book.originalTitle ?? null,
                                series: shelfBook.book.series ?? null,
                                setting: shelfBook.book.setting ?? null,
                                characters: shelfBook.book.characters ?? null,
                                isbn: shelfBook.book.isbn ?? null,
                                asin: shelfBook.book.asin ?? null,
                                language: shelfBook.book.language ?? "en",
                                referralLinks: shelfBook.book.referralLinks ?? [],
                                impressionCount: shelfBook.book.impressionCount ?? 0,
                                clickThroughCount: shelfBook.book.clickThroughCount ?? 0,
                                lastImpressionAt: shelfBook.book.lastImpressionAt ?? null,
                                lastClickThroughAt: shelfBook.book.lastClickThroughAt ?? null,
                                internal_details: shelfBook.book.internal_details ?? null,
                                images: (shelfBook.book.images && Array.isArray(shelfBook.book.images)) ? 
                                  shelfBook.book.images : 
                                  [
                                    {
                                      id: 0,
                                      bookId: shelfBook.book.id,
                                      imageType: "book-card",
                                      imageUrl: shelfBook.book.coverUrl || "/images/placeholder-book.png",
                                      width: 0,
                                      height: 0,
                                      sizeKb: null,
                                      createdAt: new Date().toISOString(),
                                      updatedAt: new Date().toISOString()
                                    }
                                  ]
                              } as Book}
                            bookNotes={bookNotesList}
                            onAddNote={handleAddNote}
                            onSelectNote={handleSelectNote}
                            onViewNotes={() => handleAddNote("book", shelfBook.bookId)}
                            onRemoveFromShelf={() => {
                              if (confirm("Are you sure you want to remove this book from the shelf?")) {
                                removeBookFromShelfMutation.mutate({
                                  shelfId: parseInt(id),
                                  bookId: shelfBook.bookId
                                });
                              }
                            }}
                          />
                          
                          {/* Notes badge */}
                          {bookNotesList.length > 0 && (
                            <div className="absolute top-2 left-2 z-20">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="bg-background/50 text-foreground">
                                      {bookNotesList.length} {bookNotesList.length === 1 ? 'Note' : 'Notes'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Click to view notes for this book</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                          
                          {/* More options menu */}
                          <div className="absolute top-0 right-9 z-20">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-12 w-12 bg-background/50 rounded-bl-full">
                                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                    <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Add move to shelf functionality
                                    toast({
                                      title: "Move to Shelf",
                                      description: "This functionality will be added soon.",
                                    });
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4">
                                    <path d="M7.5 1C7.66148 1 7.81301 1.07798 7.90687 1.20577L12.9069 8.20577C13.0157 8.35709 13.0303 8.55037 12.9446 8.71595C12.8589 8.88153 12.6872 8.98861 12.5 8.98861H2.5C2.31284 8.98861 2.14708 8.88153 2.06136 8.71595C1.97564 8.55037 1.99033 8.35709 2.09909 8.20577L7.09909 1.20577C7.19295 1.07798 7.34148 1 7.5 1ZM7.5 2.18L3.25458 8H11.7454L7.5 2.18ZM2 10.0114C1.44772 10.0114 1 10.4591 1 11.0114V13.0114C1 13.5637 1.44772 14.0114 2 14.0114H13C13.5523 14.0114 14 13.5637 14 13.0114V11.0114C14 10.4591 13.5523 10.0114 13 10.0114H2ZM2 11.0114H13V13.0114H2V11.0114Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                  </svg>
                                  Move to Another Shelf
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-500 focus:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Add remove from shelf functionality
                                    if (confirm(`Remove "${shelfBook.book.title}" from this shelf?`)) {
                                      toast({
                                        title: "Book Removed",
                                        description: "The book has been removed from this shelf.",
                                      });
                                    }
                                  }}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Remove from Shelf
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          

                          
                          {/* Old buttons (hidden) but keeping the functionality until we're sure the new UI works */}
                          <div className="hidden">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-background/80 text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddNote("book", bookId);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" /> Add Note
                            </Button>
                            
                            {bookNotesList.length > 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectNote(bookNotesList[0]);
                                }}
                              >
                                View {bookNotesList.length} {bookNotesList.length === 1 ? 'note' : 'notes'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] bg-muted/20 ">
            <p className="text-muted-foreground text-center">
              No books in this shelf yet.<br />
              Add books to get started.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Note Dialog */}
      <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeNote ? "Edit Note" : "Add Note"}
            </DialogTitle>
            <DialogDescription>
              {activeNoteType === "shelf" 
                ? "Add a note to your bookshelf" 
                : "Add a note to this book"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Write your note here..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddNoteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addNoteMutation.isPending || editNoteMutation.isPending}
                >
                  {addNoteMutation.isPending || editNoteMutation.isPending ? (
                    "Saving..."
                  ) : activeNote ? (
                    "Save Changes"
                  ) : (
                    "Add Note"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}