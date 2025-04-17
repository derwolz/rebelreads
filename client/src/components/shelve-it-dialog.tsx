import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Check, Plus, BookmarkIcon } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthModal } from "@/hooks/use-auth-modal";

export type BookShelf = {
  id: number;
  userId: number;
  title: string;
  coverImageUrl: string;
  rank: number;
  createdAt: string;
  updatedAt: string;
};

type ShelfNote = {
  id?: number;
  content: string;
  type: "book" | "shelf";
  bookId?: number;
  shelfId?: number;
};

type ShelveItDialogProps = {
  bookId: number;
  variant?: "ghost" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function ShelveItDialog({ bookId, variant = "ghost", size = "icon", className }: ShelveItDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { setIsOpen: setAuthModalOpen } = useAuthModal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bookshelves
  const { data: bookshelves = [], isLoading: isLoadingShelves } = useQuery<BookShelf[]>({
    queryKey: ["/api/bookshelves"],
    enabled: !!user && open,
  });

  // Mutation to add book to shelf
  const addToShelfMutation = useMutation({
    mutationFn: async ({ shelfId, note }: { shelfId: number; note?: string }) => {
      // First add the book to the shelf
      const res = await fetch(`/api/bookshelves/${shelfId}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to add book to shelf (${res.status})`
        );
      }

      const shelfBookData = await res.json();

      // If there's a note, add it
      if (note && note.trim()) {
        const noteRes = await fetch(`/api/books/${bookId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: note.trim(),
            type: "book",
            shelfId,
          }),
        });

        if (!noteRes.ok) {
          // Don't fail the whole operation if note creation fails
          console.error("Failed to add note");
        }
      }

      return shelfBookData;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/bookshelves/${variables.shelfId}/books`] });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/notes`] });
      
      // Show success toast
      toast({
        title: "Book shelved!",
        description: `Added to "${bookshelves.find(s => s.id === variables.shelfId)?.title || 'shelf'}"`,
      });
      
      // Close dialog and reset state
      setOpen(false);
      setSelectedShelfId(null);
      setNoteText("");
      setShowNoteInput(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add book to shelf",
        variant: "destructive",
      });
    },
  });

  // Create new shelf mutation
  const createShelfMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/bookshelves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create shelf (${res.status})`);
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookshelves"] });
      setSelectedShelfId(data.id);
      setShowNoteInput(true); // Automatically show note input when new shelf is created
      toast({
        title: "Shelf created",
        description: `Created new shelf "${data.title}"`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create shelf",
        variant: "destructive",
      });
    },
  });

  // Focus the note input when it appears
  useEffect(() => {
    if (showNoteInput && noteInputRef.current) {
      noteInputRef.current.focus();
    }
  }, [showNoteInput]);

  const handleShelveClick = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setOpen(true);
  };

  const handleShelfSelect = (shelfId: number) => {
    setSelectedShelfId(shelfId);
    setShowNoteInput(true);
  };

  const handleCreateShelf = () => {
    const title = prompt("Enter a name for your new shelf:");
    if (title && title.trim()) {
      createShelfMutation.mutate(title.trim());
    }
  };

  const handleAddToShelf = () => {
    if (selectedShelfId) {
      addToShelfMutation.mutate({
        shelfId: selectedShelfId,
        note: noteText,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddToShelf();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleShelveClick}
            className={className}
            title="Shelve It"
          >
            <BookmarkIcon className="h-4 w-4" />
            {size !== "icon" && <span className="ml-2">Shelve It</span>}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Shelve This Book</DialogTitle>
            <DialogDescription>
              Add this book to one of your shelves or create a new one.
            </DialogDescription>
          </DialogHeader>

          {isLoadingShelves ? (
            <div className="text-center py-8">Loading your shelves...</div>
          ) : (
            <>
              <ScrollArea className="max-h-[300px] overflow-y-auto">
                <div className="space-y-2 p-1">
                  {bookshelves.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground mb-4">You don't have any shelves yet.</p>
                        <Button 
                          onClick={handleCreateShelf}
                          disabled={createShelfMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Shelf
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    bookshelves.map((shelf) => (
                      <Card 
                        key={shelf.id} 
                        className={`cursor-pointer transition-all ${selectedShelfId === shelf.id ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                        onClick={() => handleShelfSelect(shelf.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={shelf.coverImageUrl || "/images/default-bookshelf-cover.svg"} 
                              alt={shelf.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-medium">{shelf.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(shelf.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedShelfId === shelf.id && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>

              {bookshelves.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleCreateShelf}
                  disabled={createShelfMutation.isPending}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Shelf
                </Button>
              )}

              {showNoteInput && selectedShelfId !== null && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Add a note about this book (optional)
                  </label>
                  <Textarea
                    ref={noteInputRef}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Your thoughts about this book..."
                    className="resize-none"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSelectedShelfId(null);
                setNoteText("");
                setShowNoteInput(false);
              }}
            >
              Cancel
            </Button>
            {selectedShelfId !== null && (
              <Button 
                onClick={handleAddToShelf}
                disabled={addToShelfMutation.isPending}
              >
                {addToShelfMutation.isPending ? "Adding..." : "Add to Shelf"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}