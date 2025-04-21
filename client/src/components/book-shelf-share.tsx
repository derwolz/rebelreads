import { useState, useEffect } from "react";
import { Book, Author } from "../types";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BookRackShelf } from "./book-rack-shelf";
import { BookDetailsCard } from "./book-details-card";
import { Note } from "@shared/schema";
import { PaperNoteCard } from "./paper-note-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentSection } from "./comment-section";



import { Badge } from "@/components/ui/badge";
import { 
  X,
  StickyNote,
  Share2
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
    // If a note is currently visible, animate it away first
    if (noteVisible) {
      setIsRotating(true);
      setTimeout(() => {
        setNoteVisible(false);
        setIsRotating(false);
        // Then change the book
        setSelectedBookIndex(index);
        setSelectedBook(book);
        // Reset selected note when changing books
        setSelectedNote(null);
      }, 500);
    } else {
      // If no note is visible, just change the book directly
      setSelectedBookIndex(index);
      setSelectedBook(book);
      // Reset selected note when changing books
      setSelectedNote(null);
    }
  };

  // Select the first book by default when data loads
  useEffect(() => {
    if (books.length > 0 && selectedBookIndex === null) {
      setSelectedBookIndex(0);
      setSelectedBook(books[0]);
    }
  }, [books, selectedBookIndex]);



  const { theme } = useTheme();

  return (
    <div className={`${className} bg-background max-w-[95vw] md:max-w-[90vw] flex flex-col text-foregound h-[calc(100vh-5rem)]`}>
      
      {/* Main content area - with flex-grow to fill available space */}
      <div className="flex flex-col lg:flex-row gap-6 p-4 flex-grow overflow-hidden">
       
        {/* Left column: Book details and comments */}
        <div className="w-full lg:w-2/3 relative">

            {/* Share button */}
            <Button variant="ghost" size="sm" className="text-foregound absolute top-0 right-0 z-10">
              <Share2 className="h-4 w-4" />
            </Button>
          {/* Book Details Card that shows the selected book */}
          <div 
            className={`rounded-lg overflow-hidden bg-muted border border-gray-800 transition-all duration-500`}
          >
            <div className="flex flex-col md:flex-row">

              {/* Comments/Notes section */}
              <div className="rounded-lg bg-background">


                {bookNotes && bookNotes.length > 0 ? (
                  <div className="space-y-3 absolute -rotate-90 bottom-6 left-0">
                    {bookNotes.map((note, idx) => (
                      <div 
                        key={note.id} 
                        className="p-3 rounded-lg bg-purple-900/40 border-l-4 flex flex-row border-purple-600 cursor-pointer hover:bg-purple-900/50 transition-colors"
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
                              <p className="text-xs text-foreground/80">
                                User {idx + 1} - {new Date(note.createdAt).toLocaleDateString()} - {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                            <p className="text-sm text-foregound line-clamp-3">{note.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center absolute py-4 text-foreground/80">
                 
                  </div>
                )}
              </div>


              
              {/* Book cover */}
              <div className="w-full z-10 md:w-1/3 flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 to-background">
                <img 
                  src={selectedBook?.images?.find(img => img.imageType === "book-detail")?.imageUrl || "/images/placeholder-book.png"} 
                  alt={selectedBook?.title} 
                  className="w-full h-auto object-cover shadow-lg rounded-md" 
                />
              </div>
              
              {/* Book details */}
              <div className="w-full md:w-2/3 p-4">
                
                {/* Animated Note Overlay - Only covers the details section */}
                {selectedNote && (
                  <div 
                    className={`absolute top-0 right-0 bottom-0 left-0 md:left-auto md:w-2/3 z-10 transition-all duration-500 transform ${
                      noteVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                    style={{
                      perspective: '1000px',
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-background border border-gray-800 rounded-lg shadow-lg p-4"
                      style={{
                        transform: noteVisible ? 'rotateY(0deg)' : 'rotateY(180deg)',
                        transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: noteVisible ? '0 10px 30px -15px rgba(255, 255, 255, 0.2)' : 'none',
                      }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-foregound flex items-center gap-2">
                            <StickyNote className="h-4 w-4" />
                            Note
                          </h3>
                          <p className="text-xs text-gray-400">
                            {selectedNote.type === 'book' ? 'Book note' : 'Shelf note'} • 
                            Last updated: {new Date(selectedNote.updatedAt || selectedNote.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-400 hover:bg-gray-800 hover:text-foregound"
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
                      <div className="bg-foregound/5 p-2 rounded-lg">
                        <PaperNoteCard note={selectedNote} />
                      </div>
                    </div>
                  </div>
                )}
                <h2 className="text-2xl font-bold mb-1 text-foregound">{selectedBook?.title}</h2>
                <p className="text-foreground/90 mb-2">by {selectedBook?.authorName}</p>
                
                <div className="mb-4">
                  <ScrollArea className="h-full pr-4">
                    <p className="text-sm text-foreground/80">{selectedBook?.description}</p>
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
                  <div className="mt-4 z-20 -left-5 top-0 absolute">
                    <div className="flex flex-wrap flex-col gap-2">
                      {selectedBook.referralLinks.map((link: any, idx: number) => (
                        <a 
                          key={idx}
                          href={link.url}
                
                          target="_blank"
                          rel="noopener noreferrer"
                          className={ idx===0 ? "inline-flex items-center text-xs  rounded-md px-3 py-1 bg-foreground/80 hover:bg-foreground/90 text-foreground"
                            : idx===1 ? "inline-flex items-center text-xs bg-gray-800 hover:bg-gray-700 rounded-md px-3 py-1   transition-colors text-foregound" :
                            "inline-flex items-center text-xs bg-transparent hover:bg-gray-700 border-border border rounded-md px-3 py-1   text-foregound"}
                          onClick={async (e) => {
                            e.stopPropagation();
                            // Record click-through on referral link
                            await apiRequest("POST", `/api/books/${selectedBook.id}/click-through`, {
                              source: "referral-link",
                              referrer: window.location.pathname,
                            });
                          }}
                        >
                          {/* Display only the icon instead of text */}
                          <img src={link.faviconUrl} alt={link.retailer} className="h-6 w-6 " />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column: Comment section - with flex-grow to expand vertically */}
        <div className="w-full lg:w-1/3 flex flex-col h-full overflow-hidden">
          <div className="rounded-lg bg-background border border-l border-gray-800 p-4 flex-grow flex flex-col h-full">
            {shelfData?.shelf && (
              <CommentSection shelfId={shelfData.shelf.id} className="flex-grow flex flex-col h-full" />
            )}
          </div>
        </div>
      </div>

      {/* Bookshelf section at bottom with fixed position */}
      <div className="w-full mt-auto">
        {/* Separator */}
        <div className="w-full border-t border-border"></div>
        
        {/* Bookshelf title */}
        <div className="relative text-center py-2">
          <h4 className="font-medium text-foregound">{ shelfData?.shelf?.title || "Book Shelf Name" }</h4>
        </div>
        
        {/* Book Rack */}
        <div className="px-4">
          <BookRackShelf 
            books={books}
            isLoading={isShelfLoading}
            onSelectBook={handleSelectBook}
            selectedBookIndex={selectedBookIndex}
            className="mx-auto max-w-4xl"
          />
        </div>
        
        {/* Bottom gradient separator */}
        <div className="w-full border-t border-border bg-gradient-to-b from-border to-transparent"></div>
      </div>
    </div>
  );
}