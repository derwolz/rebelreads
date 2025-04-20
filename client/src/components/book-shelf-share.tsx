import { useState, useEffect } from "react";
import { Book, Author } from "../types";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BookRackShelf } from "./book-rack-shelf";
import { BookDetailsCard } from "./book-details-card";
import { Note } from "@shared/schema";
import { PaperNoteCard } from "./paper-note-card";
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
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Pen, 
  X,
  Plus,
  StickyNote,
  Share2,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";

interface BookShelfShareProps {
  username: string;
  shelfName: string;
  className?: string;
}

export function BookShelfShare({ username, shelfName, className }: BookShelfShareProps) {
  const [selectedBookIndex, setSelectedBookIndex] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteVisible, setNoteVisible] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const { toast } = useToast();

  // Define the correct response type
  interface ShelfData {
    shelf: any;
    books: Array<{
      id: number;
      bookId: number;
      shelfId: number;
      rank: number;
      addedAt: string;
      book: Book;
    }>;
    bookNotes: Note[];
    shelfNotes: Note[];
  }

  // Fetch the shelf and its books with robust parameter encoding - using the correct API endpoint
  const { data: shelfData, isLoading: isShelfLoading, refetch: refetchShelf } = useQuery<ShelfData>({
    queryKey: [`/api/book-shelf?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelfName)}`],
  });

  // Get the books from the shelf data with safety check for undefined
  // Map the nested book objects to a simple array of Book objects
  const books = shelfData?.books 
    ? shelfData.books.map(item => item.book) 
    : [];
  
  // Get the notes for the currently selected book
  const bookNotes = (selectedBook && shelfData?.bookNotes) 
    ? shelfData.bookNotes.filter((note: Note) => note.bookId === selectedBook.id) 
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

  const { theme } = useTheme();

  return (
    <div className={`${className} bg-black text-white min-h-screen`}>
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 mb-2">
        <div className="flex items-center">
          <img
            src={theme === "light" ? "/images/logo.svg" : "/images/logowhite.svg"}
            alt="Sirened Logo"
            className="h-10 w-auto mr-2"
          />
          <span className="text-xl font-bold text-white">Sirened</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col lg:flex-row gap-6 p-4">
        {/* Left column: Book details and comments */}
        <div className="w-full lg:w-2/3 relative">
          {/* Animated Note Overlay */}
          {selectedNote && (
            <div 
              className={`absolute inset-0 z-10 transition-all duration-500 transform ${
                noteVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            >
              <div 
                className="absolute inset-0 bg-black border border-gray-800 rounded-lg shadow-lg p-4"
                style={{
                  transform: noteVisible ? 'rotateY(0deg)' : 'rotateY(180deg)',
                  transition: 'transform 0.5s ease-in-out',
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Note</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400"
                    onClick={() => {
                      setIsRotating(true);
                      setTimeout(() => {
                        setNoteVisible(false);
                        setIsRotating(false);
                      }, 500);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-white/5 p-1 rounded-lg">
                  <PaperNoteCard note={selectedNote} />
                </div>
              </div>
            </div>
          )}
            
          {/* Book Details Card that shows the selected book */}
          <div 
            className={`rounded-lg overflow-hidden bg-black border border-gray-800 mb-6 transition-all duration-500 ${
              noteVisible ? 'opacity-0 scale-95 transform' : 'opacity-100 scale-100 transform'
            }`}
          >
            <div className="flex flex-col md:flex-row">
              {/* Book cover */}
              <div className="w-full md:w-1/3 flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black">
                <img 
                  src={selectedBook?.images?.find(img => img.imageType === "book-detail")?.imageUrl || "/images/placeholder-book.png"} 
                  alt={selectedBook?.title} 
                  className="w-40 h-auto object-cover shadow-lg rounded-md" 
                />
              </div>
              
              {/* Book details */}
              <div className="w-full md:w-2/3 p-4">
                <h2 className="text-2xl font-bold mb-1 text-white">{selectedBook?.title}</h2>
                <p className="text-gray-400 mb-2">by {selectedBook?.authorName}</p>
                
                <div className="mb-4">
                  <ScrollArea className="h-28 pr-4">
                    <p className="text-sm text-gray-300">{selectedBook?.description}</p>
                  </ScrollArea>
                </div>
                
                {/* Genres & Themes */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {selectedBook?.genres?.map((genre: string, idx: number) => (
                      <Badge 
                        key={idx} 
                        className="bg-gray-800 text-gray-300 hover:bg-gray-700"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Referral links */}
                {selectedBook?.referralLinks && selectedBook.referralLinks.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2 text-gray-300">Where to Buy</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBook.referralLinks.map((link: any, idx: number) => (
                        <a 
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs bg-gray-800 hover:bg-gray-700 rounded-md px-3 py-1 transition-colors text-white"
                          onClick={async (e) => {
                            e.stopPropagation();
                            // Record click-through on referral link
                            await apiRequest("POST", `/api/books/${selectedBook.id}/click-through`, {
                              source: "referral-link",
                              referrer: window.location.pathname,
                            });
                          }}
                        >
                          <span className="mr-1">{link.customName || link.retailer}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Comments/Notes section */}
          <div className="rounded-lg bg-black border border-gray-800 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Reader Notes</h3>
              <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 border-gray-600 text-white hover:bg-gray-800">
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
            
            {bookNotes && bookNotes.length > 0 ? (
              <div className="space-y-3">
                {bookNotes.map((note, idx) => (
                  <div 
                    key={note.id} 
                    className="p-3 rounded-lg bg-purple-900/40 border-l-4 border-purple-600 cursor-pointer hover:bg-purple-900/50 transition-colors"
                    onClick={() => {
                      // Use the same animation logic for book notes
                      if (selectedNote && selectedNote.id === note.id && noteVisible) {
                        // If the same note is clicked while visible, hide it
                        setIsRotating(true);
                        setTimeout(() => {
                          setNoteVisible(false);
                          setIsRotating(false);
                        }, 500);
                      } else {
                        // If no note is currently visible or a different note is clicked
                        if (noteVisible) {
                          // If a note is already visible, hide it first with animation
                          setIsRotating(true);
                          setTimeout(() => {
                            setSelectedNote(note);
                            setTimeout(() => {
                              setNoteVisible(true);
                              setIsRotating(false);
                            }, 100);
                          }, 500);
                        } else {
                          // No note is visible, show the selected one directly
                          setSelectedNote(note);
                          setIsRotating(true);
                          setTimeout(() => {
                            setNoteVisible(true);
                            setIsRotating(false);
                          }, 100);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs text-gray-400">
                            User {idx + 1} - {new Date(note.createdAt).toLocaleDateString()} - {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <p className="text-sm text-white line-clamp-2">{note.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
              </div>
            )}
          </div>
          
          {/* Comment input form */}
          <div className="flex items-center gap-2 mt-4">
            <Button 
              variant="outline" 
              className="border-gray-600 text-white hover:bg-gray-800 w-full flex items-center justify-center gap-2"
              onClick={() => setIsAddingNote(true)}
            >
              <Pen className="h-4 w-4" />
              <span>Add Comment</span>
            </Button>
          </div>
        </div>
        
        {/* Right column: Shelf notes section */}
        <div className="w-full lg:w-1/3">
          {/* Shelf Notes Section */}
          <div className="rounded-lg bg-black border border-gray-800 p-4 mb-6">
            <h3 className="text-lg font-medium mb-4 text-white">Shelf Notes</h3>
            
            {shelfData?.shelfNotes && shelfData.shelfNotes.length > 0 ? (
              <div className="space-y-6">
                {shelfData.shelfNotes.map((note) => (
                  <div 
                    key={note.id} 
                    className="overflow-hidden hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                    onClick={() => {
                      // Handle note selection with animation
                      if (selectedNote && selectedNote.id === note.id && noteVisible) {
                        // If the same note is clicked while visible, hide it
                        setIsRotating(true);
                        setTimeout(() => {
                          setNoteVisible(false);
                          setIsRotating(false);
                        }, 500); // Half a second for the rotation animation
                      } else {
                        // If no note is currently visible or a different note is clicked
                        if (noteVisible) {
                          // If a note is already visible, hide it first with animation
                          setIsRotating(true);
                          setTimeout(() => {
                            setSelectedNote(note);
                            setTimeout(() => {
                              setNoteVisible(true);
                              setIsRotating(false);
                            }, 100);
                          }, 500);
                        } else {
                          // No note is visible, show the selected one directly
                          setSelectedNote(note);
                          setIsRotating(true);
                          setTimeout(() => {
                            setNoteVisible(true);
                            setIsRotating(false);
                          }, 100);
                        }
                      }
                    }}
                  >
                    <PaperNoteCard note={note} />
                    <div className="mt-2 text-center text-xs text-gray-400">
                      Click to view
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No shelf notes yet</p>
              </div>
            )}
          </div>
          
          {/* Recommendations Section */}
          <div className="rounded-lg bg-black border border-gray-800 p-4">
            <h3 className="text-lg font-medium mb-4 text-white">You might also like</h3>
            <div className="space-y-3">
              {/* Example shelf recommendation - this would normally come from data */}
              <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                <div className="w-14 h-14 bg-gray-800 rounded overflow-hidden">
                  <img src="/images/placeholder-book.png" alt="Shelf thumbnail" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">{ shelfData?.shelf?.title || "Book Shelf Name" }</h4>
                  <p className="text-xs text-gray-400">shelf</p>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* No dialog needed anymore */}
      
      {/* Separator */}
      <div className="w-full border-t border-gray-800 my-8"></div>
      
      {/* Book Rack at the bottom */}
      <div className="px-4 pb-10">
        <BookRackShelf 
          books={books}
          isLoading={isShelfLoading}
          onSelectBook={handleSelectBook}
          selectedBookIndex={selectedBookIndex}
          className="mx-auto max-w-4xl"
        />
      </div>
    </div>
  );
}