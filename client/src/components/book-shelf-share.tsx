import { useState, useEffect } from "react";
import { Book, Author } from "../types";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BookRackShelf } from "./book-rack-shelf";
import { BookDetailsCard } from "./book-details-card";
import { Note } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookOpen, 
  Pen, 
  X,
  Plus,
  StickyNote
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookShelfShareProps {
  username: string;
  shelfName: string;
  className?: string;
}

export function BookShelfShare({ username, shelfName, className }: BookShelfShareProps) {
  const [selectedBookIndex, setSelectedBookIndex] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const { toast } = useToast();

  // Fetch the shelf and its books with robust parameter encoding
  const { data: shelfData, isLoading: isShelfLoading, refetch: refetchShelf } = useQuery<{
    shelf: any;
    books: Book[];
    notes: Note[];
  }>({
    queryKey: [`/api/shelves?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelfName)}`],
  });

  // Get the books from the shelf data with safety check for undefined
  const books = shelfData?.books || [];
  
  // Get the notes for the currently selected book
  const bookNotes = (selectedBook && shelfData?.notes) 
    ? shelfData.notes.filter(note => note.bookId === selectedBook.id) 
    : [];
    
  // Log error if shelfData is undefined but username and shelfName are provided
  useEffect(() => {
    if (!isShelfLoading && !shelfData && username && shelfName) {
      console.error("Failed to load shelf data for:", {
        username,
        shelfName,
        encodedUsername: encodeURIComponent(username),
        encodedShelfName: encodeURIComponent(shelfName)
      });
    }
  }, [isShelfLoading, shelfData, username, shelfName]);

  // Handle book selection
  const handleSelectBook = (book: Book, index: number) => {
    setSelectedBookIndex(index);
    setSelectedBook(book);
    // Reset selected note when changing books
    setSelectedNote(null);
  };

  // Select the first book by default when data loads
  useEffect(() => {
    if (books.length > 0 && selectedBookIndex === null) {
      setSelectedBookIndex(0);
      setSelectedBook(books[0]);
    }
  }, [books, selectedBookIndex]);

  // Handle adding a new note
  const handleAddNote = async () => {
    if (!selectedBook) return;
    
    try {
      // Make API request to add note
      await apiRequest("POST", "/api/notes", {
        type: "book",
        bookId: selectedBook.id,
        content: newNoteContent,
      });
      
      // Clear the form and close the dialog
      setNewNoteContent("");
      setIsAddingNote(false);
      
      // Refresh the shelf data to show the new note
      refetchShelf();
      
      toast({
        title: "Note Added",
        description: "Your note has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Book Details Card that shows the selected book */}
      <BookDetailsCard book={selectedBook} />
      
      {/* Notes Section - Floating tooltips */}
      <div className="relative">
        {bookNotes && bookNotes.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {bookNotes.map((note, idx) => {
              // Position notes at random locations
              const randomTop = `${20 + (idx * 15) % 80}%`;
              const randomLeft = `${10 + (idx * 23) % 80}%`;
              
              return (
                <TooltipProvider key={note.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="absolute bg-accent/80 text-accent-foreground p-2 rounded-lg shadow-lg cursor-pointer pointer-events-auto transform hover:scale-105 transition-transform"
                        style={{ 
                          top: randomTop, 
                          left: randomLeft,
                          maxWidth: '200px',
                          zIndex: selectedNote?.id === note.id ? 50 : 30
                        }}
                        onClick={() => setSelectedNote(note)}
                      >
                        <div className="flex items-start gap-2">
                          <StickyNote className="h-4 w-4 flex-shrink-0 mt-1" />
                          <p className="text-xs line-clamp-2">{note.content.substring(0, 50)}{note.content.length > 50 ? '...' : ''}</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-md">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Add Note Button */}
      <div className="flex justify-end">
        <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note for {selectedBook?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Textarea 
                placeholder="Write your note here..." 
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-32"
              />
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                  Save Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Selected Note Dialog */}
      {selectedNote && (
        <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Note</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-72">
              <div className="space-y-4 pt-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNote.content}
                </div>
                <div className="text-xs text-muted-foreground">
                  Created on {new Date(selectedNote.createdAt).toLocaleDateString()}
                </div>
              </div>
            </ScrollArea>
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Book Rack at the bottom */}
      <div className="mt-8 pt-4 border-t">
        <h3 className="text-lg font-medium mb-4">Books on this Shelf</h3>
        <BookRackShelf 
          books={books}
          isLoading={isShelfLoading}
          onSelectBook={handleSelectBook}
          selectedBookIndex={selectedBookIndex}
        />
      </div>
    </div>
  );
}