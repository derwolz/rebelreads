import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, PencilIcon, Trash2, GripVertical, BookOpen, X } from "lucide-react";
import { BookShelfCoverUploader } from "@/components/book-shelf-cover-uploader";

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

// Form schema for creating/updating a bookshelf
const bookshelfFormSchema = z.object({
  title: z.string().min(1, "Bookshelf title is required"),
  coverImageUrl: z.string().optional(),
});

// We need to extend the generated type to allow for File objects during form handling
type BookshelfFormValues = z.infer<typeof bookshelfFormSchema> & {
  coverImageUrl?: string | File | null;
};

// Form schema for notes
const noteFormSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

// Component to display a single BookShelf card (sortable)
function SortableShelfCard({ 
  shelf, 
  onEdit, 
  onDelete, 
  onViewNotes 
}: { 
  shelf: BookShelf; 
  onEdit: (shelf: BookShelf) => void; 
  onDelete: (id: number) => void; 
  onViewNotes: (shelf: BookShelf) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: shelf.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className="w-full">
        <CardHeader className="pb-2 relative">
          <div 
            className="absolute left-2 top-2 cursor-move text-gray-400 hover:text-gray-600" 
            {...attributes} 
            {...listeners}
          >
            <GripVertical size={20} />
          </div>
          <div className="flex items-center ml-8">
            <div className="flex-1">
              <CardTitle className="text-lg">{shelf.title}</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => onViewNotes(shelf)}>
                <BookOpen size={18} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(shelf)}>
                <PencilIcon size={18} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(shelf.id)}>
                <Trash2 size={18} className="text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex">
          <div className="w-24 h-32 rounded-md overflow-hidden mr-4">
            <img 
              src={shelf.coverImageUrl || "/images/default-bookshelf-cover.svg"} 
              alt={shelf.title} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              {/* Future enhancement: Display number of books on shelf */}
              This bookshelf was created on {new Date(shelf.createdAt).toLocaleDateString()}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Notes Component for a Shelf
function ShelfNotes({ shelf, onClose }: { shelf: BookShelf, onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: [`/api/bookshelves/${shelf.id}/notes`],
  });

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (values: NoteFormValues) => {
      const res = await fetch(`/api/bookshelves/${shelf.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      
      if (!res.ok) {
        throw new Error("Failed to add note");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookshelves/${shelf.id}/notes`] });
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

  const updateNoteMutation = useMutation({
    mutationFn: async (data: { id: number; content: string }) => {
      const res = await fetch(`/api/notes/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data.content }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to update note");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookshelves/${shelf.id}/notes`] });
      setEditingNote(null);
      form.reset();
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

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete note");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookshelves/${shelf.id}/notes`] });
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

  const onSubmit = (values: NoteFormValues) => {
    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, content: values.content });
    } else {
      addNoteMutation.mutate(values);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    form.setValue("content", note.content);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    form.reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Notes for {shelf.title}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{editingNote ? "Edit Note" : "Add a Note"}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Write your note here..."
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex space-x-2">
            <Button type="submit">
              {editingNote ? "Update Note" : "Add Note"}
            </Button>
            {editingNote && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>

      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Your Notes</h4>
        {isLoading ? (
          <p>Loading notes...</p>
        ) : notes?.length ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="relative">
                <CardContent className="pt-6">
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(note)}>
                      <PencilIcon size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteNoteMutation.mutate(note.id)}
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(note.updatedAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No notes yet. Add your first note above.</p>
        )}
      </div>
    </div>
  );
}

// Main BookShelf Settings Component
export function BookShelfSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<BookShelf | null>(null);
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch bookshelves
  const { data: bookshelves, isLoading } = useQuery<BookShelf[]>({
    queryKey: ["/api/bookshelves"],
  });

  // Form for bookshelf creation/editing
  const form = useForm<BookshelfFormValues>({
    resolver: zodResolver(bookshelfFormSchema),
    defaultValues: {
      title: "",
      coverImageUrl: "",
    },
  });

  // Create bookshelf mutation
  const createShelfMutation = useMutation({
    mutationFn: async (values: BookshelfFormValues) => {
      // Handle file upload if coverImageUrl is a File
      if (values.coverImageUrl && typeof values.coverImageUrl !== "string") {
        const formData = new FormData();
        formData.append('coverImage', values.coverImageUrl);
        
        // First create the bookshelf without a cover image
        const initialData = { ...values, coverImageUrl: "/images/default-bookshelf-cover.svg" };
        
        const res = await fetch("/api/bookshelves", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initialData),
        });
        
        if (!res.ok) {
          throw new Error("Failed to create bookshelf");
        }
        
        const newShelf = await res.json();
        
        // Then upload the cover image
        const uploadRes = await fetch(`/api/bookshelves/${newShelf.id}/cover`, {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) {
          throw new Error("Failed to upload cover image");
        }
        
        return uploadRes.json();
      } else {
        // Regular bookshelf creation without file upload
        const res = await fetch("/api/bookshelves", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        
        if (!res.ok) {
          throw new Error("Failed to create bookshelf");
        }
        
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookshelves"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Bookshelf created",
        description: "Your new bookshelf has been created successfully.",
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

  // Update bookshelf mutation
  const updateShelfMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: BookshelfFormValues }) => {
      // Handle file upload if coverImageUrl is a File
      if (values.coverImageUrl && typeof values.coverImageUrl !== "string") {
        const formData = new FormData();
        formData.append('coverImage', values.coverImageUrl);
        
        // First update the bookshelf without changing the cover image
        const dataToUpdate = { ...values };
        delete dataToUpdate.coverImageUrl;  // Remove file from JSON data
        
        const res = await fetch(`/api/bookshelves/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToUpdate),
        });
        
        if (!res.ok) {
          throw new Error("Failed to update bookshelf");
        }
        
        // Then upload the cover image
        const uploadRes = await fetch(`/api/bookshelves/${id}/cover`, {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) {
          throw new Error("Failed to upload cover image");
        }
        
        return uploadRes.json();
      } else {
        // Regular bookshelf update without file upload
        const res = await fetch(`/api/bookshelves/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        
        if (!res.ok) {
          throw new Error("Failed to update bookshelf");
        }
        
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookshelves"] });
      setIsEditDialogOpen(false);
      setSelectedShelf(null);
      form.reset();
      toast({
        title: "Bookshelf updated",
        description: "Your bookshelf has been updated successfully.",
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

  // Delete bookshelf mutation
  const deleteShelfMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/bookshelves/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete bookshelf");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookshelves"] });
      setIsDeleteDialogOpen(false);
      setSelectedShelf(null);
      toast({
        title: "Bookshelf deleted",
        description: "Your bookshelf has been deleted successfully.",
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

  // Update shelf ranks mutation
  const updateShelfRanksMutation = useMutation({
    mutationFn: async (shelfRanks: { id: number; rank: number }[]) => {
      const res = await fetch("/api/bookshelves/rank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shelfRanks),
      });
      
      if (!res.ok) {
        throw new Error("Failed to update shelf order");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookshelves"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for creating a new bookshelf
  const onCreateSubmit = (values: BookshelfFormValues) => {
    createShelfMutation.mutate(values);
  };

  // Handle form submission for editing a bookshelf
  const onEditSubmit = (values: BookshelfFormValues) => {
    if (selectedShelf) {
      updateShelfMutation.mutate({ id: selectedShelf.id, values });
    }
  };

  // Handle shelf edit button click
  const handleEdit = (shelf: BookShelf) => {
    setSelectedShelf(shelf);
    form.setValue("title", shelf.title);
    form.setValue("coverImageUrl", shelf.coverImageUrl || "");
    setIsEditDialogOpen(true);
  };

  // Handle shelf delete button click
  const handleDelete = (shelfId: number) => {
    const shelf = bookshelves?.find((s) => s.id === shelfId);
    if (shelf) {
      setSelectedShelf(shelf);
      setIsDeleteDialogOpen(true);
    }
  };

  // Handle shelf notes button click
  const handleViewNotes = (shelf: BookShelf) => {
    setSelectedShelf(shelf);
    setIsNotesDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedShelf) {
      deleteShelfMutation.mutate(selectedShelf.id);
    }
  };

  // Handle drag end for reordering bookshelves
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = bookshelves?.findIndex((shelf) => shelf.id.toString() === active.id) ?? -1;
    const newIndex = bookshelves?.findIndex((shelf) => shelf.id.toString() === over.id) ?? -1;
    
    if (oldIndex === -1 || newIndex === -1 || !bookshelves) {
      return;
    }
    
    // Update local state immediately for smooth UI
    const newBookshelves = arrayMove(bookshelves, oldIndex, newIndex);
    
    // Prepare data for API
    const updatedRanks = newBookshelves.map((shelf, index) => ({
      id: shelf.id,
      rank: index,
    }));
    
    // Update in the database
    updateShelfRanksMutation.mutate(updatedRanks);
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Book Shelves</CardTitle>
          <CardDescription>
            Create and manage your custom book shelves
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p>Loading your book shelves...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Shelves</CardTitle>
        <CardDescription>
          Create and manage your custom book shelves
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-600">
            Drag and drop to reorder your book shelves.
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Book Shelf
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Book Shelf</DialogTitle>
                <DialogDescription>
                  Add a new book shelf to organize your books.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="My Favorite Books" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coverImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image</FormLabel>
                        <FormControl>
                          <BookShelfCoverUploader
                            value={field.value || null}
                            onChange={(value) => {
                              if (value && typeof value !== "string") {
                                // We'll handle the file upload separately, because we need to save the file
                                // to the server and get a URL back
                                field.onChange(value);
                              } else {
                                field.onChange(value || "");
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createShelfMutation.isPending}>
                      {createShelfMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bookshelves list with drag and drop */}
        {bookshelves?.length ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={bookshelves.map((shelf) => shelf.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              {bookshelves.map((shelf) => (
                <SortableShelfCard
                  key={shelf.id}
                  shelf={shelf}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewNotes={handleViewNotes}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              You don't have any book shelves yet. Create your first one!
            </p>
          </div>
        )}
      </CardContent>

      {/* Edit Bookshelf Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Book Shelf</DialogTitle>
            <DialogDescription>
              Update your book shelf details.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="My Favorite Books" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <FormControl>
                      <BookShelfCoverUploader
                        value={field.value || null}
                        onChange={(value) => {
                          if (value && typeof value !== "string") {
                            // We'll handle the file upload separately, because we need to save the file
                            // to the server and get a URL back
                            field.onChange(value);
                          } else {
                            field.onChange(value || "");
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateShelfMutation.isPending}>
                  {updateShelfMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book Shelf</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this book shelf? This action cannot be undone.
              All notes associated with this shelf will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteShelfMutation.isPending}
            >
              {deleteShelfMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedShelf && (
            <ShelfNotes 
              shelf={selectedShelf} 
              onClose={() => setIsNotesDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}