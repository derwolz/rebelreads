import { useState, useEffect } from "react";
import { Book, Author } from "../types";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BookRackShelf } from "./book-rack-shelf";
import { BookDetailsCard } from "./book-details-card";
import { Note } from "@shared/schema";
import { PaperNoteCard } from "./paper-note-card";
import logo from "@/public/images/logo.svg";
import logoWhite from "@/public/images/logowhite.svg";
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
    <div className={`${className} bg-black max-w-[95vw] md:max-w-[90vw] flex justify-center flex-col text-white min-h-screen`}>
      
      
      {/* Main content area */}
      <div className="flex flex-col mt-0 lg:flex-row gap-6 p-4">
       
        {/* Left column: Book details and comments */}
        <div className="w-full lg:w-2/3 relative">

            {/* Share button */}
            <Button variant="ghost" size="sm" className="text-white absolute top-0 right-0">
              <Share2 className="h-4 w-4" />
            </Button>
          {/* Book Details Card that shows the selected book */}
          <div 
            className={`rounded-lg overflow-hidden bg-black border border-gray-800 mb-16 transition-all duration-500 `}
          >
            <div className="flex flex-col md:flex-row">

              {/* Comments/Notes section */}
              <div className="rounded-lg bg-black mb-16">


                {bookNotes && bookNotes.length > 0 ? (
                  <div className="space-y-3 absolute -rotate-90 bottom-6  left-0">
                    {bookNotes.map((note, idx) => (
                      <div 
                        key={note.id} 
                        className="p-3  rounded-lg bg-purple-900/40 border-l-4 flex flex-row border-purple-600 cursor-pointer hover:bg-purple-900/50 transition-colors "
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
                  <div className="text-center absolute py-4 text-gray-500">
                 
                  </div>
                )}
              </div>


              
              {/* Book cover */}
              <div className="w-full z-10 md:w-1/3 flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 to-black">
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
                      className="absolute inset-0 bg-black border border-gray-800 rounded-lg shadow-lg p-4"
                      style={{
                        transform: noteVisible ? 'rotateY(0deg)' : 'rotateY(180deg)',
                        transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: noteVisible ? '0 10px 30px -15px rgba(255, 255, 255, 0.2)' : 'none',
                      }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-white flex items-center gap-2">
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
                          className="text-gray-400 hover:bg-gray-800 hover:text-white"
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
                      <div className="bg-white/5 p-2 rounded-lg">
                        <PaperNoteCard note={selectedNote} />
                      </div>
                    </div>
                  </div>
                )}
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
                  <div className="mt-4 z-20 -left-5 top-0 absolute">
                    <div className="flex flex-wrap flex-col gap-2">
                      {selectedBook.referralLinks.map((link: any, idx: number) => (
                        <a 
                          key={idx}
                          href={link.url}
                
                          target="_blank"
                          rel="noopener noreferrer"
                          className={ idx===0 ? "inline-flex items-center text-xs  rounded-md px-3 py-1 bg-foreground/80 hover:bg-foreground/90 text-foreground"
                            : idx===1 ? "inline-flex items-center text-xs bg-gray-800 hover:bg-gray-700 rounded-md px-3 py-1   transition-colors text-white" :
                            "inline-flex items-center text-xs bg-transparent hover:bg-gray-700 border-border border rounded-md px-3 py-1   text-white"}
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
        
        {/* Right column: Comment section */}
        <div className="w-full lg:w-1/3">
          <div className="rounded-lg bg-black border border-l border-gray-800 p-4">
            {shelfData?.shelf && (
              <CommentSection shelfId={shelfData.shelf.id} />
            )}
          </div>
        </div>
      </div>

      
      {/* Separator */}
      <div className="w-full border-t border-gray-800 my-4"></div>
      {/** Place the bookshelf name here */}
      <div className="relative flex-1 bg-gradient-to-t w-full from-black to-transparent">
        <h4 className="font-medium absolute w-full z-20 text-white ">{ shelfData?.shelf?.title || "Book Shelf Name" }</h4>
      
    
      {/* Book Rack at the bottom */}
      <div className="px-4 ">
        <BookRackShelf 
          books={books}
          isLoading={isShelfLoading}
          onSelectBook={handleSelectBook}
          selectedBookIndex={selectedBookIndex}
          className="mx-auto max-w-4xl"
        />  </div>
      </div>
    </div>
  );
}