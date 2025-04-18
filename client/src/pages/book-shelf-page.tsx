import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookCard } from "@/components/book-card";
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

type ShelfBook = {
  id: number;
  bookId: number;
  shelfId: number;
  rank: number;
  addedAt: string;
  book: {
    id: number;
    title: string;
    description: string;
    coverUrl?: string;
    // Other book properties
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

  // Form for adding/editing notes
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  // Fetch bookshelf data
  const { data, isLoading, error } = useQuery<BookShelfData>({
    queryKey: [`/api/book-shelf/${id}`],
    enabled: !!user && !!id,
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
      queryClient.invalidateQueries({ queryKey: [`/api/book-shelf/${id}`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/book-shelf/${id}`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/book-shelf/${id}`] });
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
                  
                  // Convert ShelfBook to the appropriate format for BookCard
                  const bookForCard = {
                    id: shelfBook.book.id,
                    title: shelfBook.book.title,
                    description: shelfBook.book.description || "",
                    authorId: 0, // Not used in this context
                    authorName: "", // Not needed in this context
                    images: [{
                      imageType: "book-card",
                      imageUrl: shelfBook.book.coverUrl || "/images/placeholder-book.png"
                    }]
                  };

                  return (
                    <CarouselItem key={shelfBook.id} className="md:basis-1/4 lg:basis-1/5">
                      <div className="group relative p-1">
                        {/* Use BookCard with customizations */}
                        <div className="relative">
                          <img 
                            src={shelfBook.book.coverUrl || "/images/placeholder-book.png"} 
                            alt={shelfBook.book.title}
                            className="w-full h-64 object-cover rounded-md"
                          />
                          
                          {/* Notes badge */}
                          {bookNotesList.length > 0 && (
                            <div className="absolute top-2 left-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="bg-foreground/10 text-foreground">
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
                          
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
                          </div>
                        </div>
                        
                        {/* Book details */}
                        <div className="mt-2">
                          <p className="font-medium text-sm truncate">{shelfBook.book.title}</p>
                          {bookNotesList.length > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-0 h-6 text-xs text-muted-foreground"
                              onClick={() => handleSelectNote(bookNotesList[0])}
                            >
                              View notes
                            </Button>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] bg-muted/20 rounded-lg">
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