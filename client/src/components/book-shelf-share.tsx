import { useState, useEffect, useCallback } from "react";
import { Book as BookType, Author } from "../types";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BookRackShelf } from "./book-rack-shelf";
import { BookDetailsCard } from "./book-details-card";
import { Note } from "@shared/schema";
import { PaperNoteCard } from "./paper-note-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentSection } from "./comment-section";
import useEmblaCarousel from "embla-carousel-react";
import { useIsMobile } from "@/hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { 
  X,
  StickyNote,
  Share2,
  ChevronLeft,
  ChevronRight,
  BookOpen as BookIcon
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
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteVisible, setNoteVisible] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showBookDetails, setShowBookDetails] = useState(true);
  const { toast } = useToast();
  
  // Track current carousel slide index
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Define the correct response type
  interface ShelfData {
    shelf: any;
    books: Array<{
      id: number;
      bookId: number;
      shelfId: number;
      rank: number;
      addedAt: string;
      book: BookType;
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
  
  // Mobile swipe carousel for book details + notes (as one integrated swipeable card set)
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, // Don't loop - card 1 is always book details, cards 2+ are notes
    align: 'center',
    containScroll: 'keepSnaps',
    slidesToScroll: 1,
    dragFree: false,
    watchDrag: true,
    skipSnaps: true
  });
    
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
  const handleSelectBook = (book: BookType, index: number) => {
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
  
  // Reset book details view when book changes
  useEffect(() => {
    if (selectedBook) {
      setShowBookDetails(true);
      setCurrentSlideIndex(0);
    }
  }, [selectedBook]);
  
  // Handle Embla carousel initialization and scroll events
  useEffect(() => {
    if (!emblaApi) return;
    

    
    // Add scroll event listener to track current slide
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setCurrentSlideIndex(index);
    };
    
    emblaApi.on("select", onSelect);
    
    // Cleanup function
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, bookNotes, showBookDetails]);
  
  // Navigation functions for mobile swipe
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);
  
  // Check if we're on a mobile device
  const isMobileViewActive = useIsMobile();

  // Navigate to previous book if available
  const goToPrevBook = useCallback(() => {
    if (selectedBookIndex !== null && selectedBookIndex > 0) {
      handleSelectBook(books[selectedBookIndex - 1], selectedBookIndex - 1);
    }
  }, [selectedBookIndex, books]);

  // Navigate to next book if available
  const goToNextBook = useCallback(() => {
    if (selectedBookIndex !== null && selectedBookIndex < books.length - 1) {
      handleSelectBook(books[selectedBookIndex + 1], selectedBookIndex + 1);
    }
  }, [selectedBookIndex, books]);

  const { theme } = useTheme();

  return (
    <div className={`${className} bg-background w-full max-w-[95vw] md:max-w-[90vw] flex justify-center flex-col text-foregound h-full overflow-hidden`}>
      
      
      {/* Main content area */}
      <div className="flex flex-col mt-0 lg:flex-row gap-6 p-4 w-full overflow-x-hidden">
       
        {/* Left column: Book details and comments */}
        <div className="w-full lg:w-2/3 flex relative ">

          
          
          
          {/* Book Details Card that shows the selected book */}
          <div 
            className={`transition-all duration-500 `}
          >
            <div className="">

             


              
         
              
              {/* Book details */}
              <div className="flex h-full bg-muted border-gray-800 border flex-col  md:flex-row rounded-lg max-w-full">


                {/* Book cover */}
                <div className="h-full z-20 flex-left flex justify-center  md:min-w-[400px]">
                  <img 
                    src={selectedBook?.images?.find((img: any) => img.imageType === "book-detail")?.imageUrl || "/images/placeholder-book.png"} 
                    alt={selectedBook?.title} 
                    className="h-auto  w-full shadow-lg object-cover rounded-md" 
                  />
                </div>

                

                {/* Mobile-only share button and referral links container - between cover and title */}
                <div className="flex md:hidden items-center mt-3 mb-4 gap-4">
                  {/* Share button for mobile */}
                  <Button 
 
                    size="sm" 
                    className="text-foregound bg-background/20 border-border border rounded-md"
                    onClick={async () => {
                      try {
                        // Create the shareable URL
                        const shareUrl = `${window.location.origin}/book-shelf/share?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelfName)}`;
                        
                        // Try to use the Web Share API if available
                        if (navigator.share) {
                          await navigator.share({
                            title: `${shelfName} by ${username}`,
                            text: `Check out this bookshelf: ${shelfName} by ${username}`,
                            url: shareUrl,
                          });
                        } else {
                          // Fallback to clipboard copy
                          await navigator.clipboard.writeText(shareUrl);
                          toast({
                            title: "Link Copied!",
                            description: "The bookshelf link has been copied to your clipboard.",
                          });
                        }
                      } catch (error) {
                        // Handle errors (user might have canceled share, or permission denied)
                        console.error("Error sharing:", error);
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  
                  {/* Referral links for mobile */}
                  {selectedBook?.referralLinks && selectedBook.referralLinks.length > 0 && (
                    <div className="flex gap-4">
                      {selectedBook.referralLinks.map((link: any, idx: number) => (
                        <a 
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center"
                          onClick={async (e) => {
                            e.stopPropagation();
                            // Record click-through on referral link
                            await apiRequest("POST", `/api/books/${selectedBook.id}/click-through`, {
                              source: "referral-link",
                              referrer: window.location.pathname,
                            });
                          }}
                        >
                          <img src={link.faviconUrl} alt={link.retailer} className="h-6 w-6" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex ml-auto p-4 flex-col min-w-0 md:w-[500px] overflow-hidden">
                <h2 className="text-2xl  font-bold mb-1 text-foregound">{selectedBook?.title}</h2>
                <p className="text-foreground/90 mb-2 break-words">by {selectedBook?.authorName}</p>
                
                <div className="mb-4">
                  {/* Desktop view */}
                  <div className="hidden md:block relative">

                    {/* Animated Note Overlay - Only covers the details section */}
                    {selectedNote && (
                      <div className={`absolute z-30 top-0 left-0 w-full h-full flex items-center justify-center transition-all duration-500 ${isRotating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${noteVisible ? 'pointer-events-auto' : 'pointer-events-none opacity-0'}`}>
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-lg"></div>
                        <div className={`relative z-40 transform transition-all duration-500 ${isRotating ? 'rotate-3 scale-95' : 'rotate-0 scale-100'}`}>
                          <PaperNoteCard note={selectedNote} className="max-w-sm" />
                        </div>
                      </div>
                    )}
                    
                    <ScrollArea className="max-h-[40vh] min-w-0 w-full pr-4">
                      <p className="text-sm text-foreground/80">{selectedBook?.description}</p>
                    </ScrollArea>
                  </div>
                  
                  {/* Mobile view - Swipeable content with Cards */}
                  <div className="md:hidden w-[90vw]">
                    {/* Embla carousel for swipeable cards (bookDetails + notes) */}
                    <div className="overflow-hidden  border border-border rounded-lg w-[90vw]" ref={emblaRef}>
                      <div className="flex touch-pan-y">
                        {/* Card 1: Book details card (always the first card) */}
                        <div className="flex-[0_0_100%] pr-4 min-w-0 max-w-full">
                          <ScrollArea className="h-[180px] w-full">
                            <p className="text-sm text-foreground/80">{selectedBook?.description}</p>
                          </ScrollArea>
                          
                          {/* Card navigation indicator at bottom */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-foreground/80 rounded-full" />
                              <span className="text-xs text-muted-foreground">Details</span>
                            </div>
                            
                            {bookNotes.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>Swipe for notes</span>
                                <ChevronRight className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Cards 2+: Notes (one card per note) */}
                        {bookNotes.map((note, idx) => (
                          <div key={note.id} className="flex-[0_0_100%] p-4 min-w-0 max-w-full">
                            <div className="bg-muted/20 rounded-lg  h-full overflow-y-auto w-full">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(note.createdAt).toLocaleDateString()}
                                </p>
                                <Badge variant="outline" className="text-xs">Note {idx + 1}/{bookNotes.length}</Badge>
                              </div>
                              <PaperNoteCard note={note} />
                            </div>
                            
                            {/* Card navigation indicators */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <ChevronLeft className="h-3 w-3" />
                                <span>{idx === 0 ? 'Back to details' : `Note ${idx}`}</span>
                              </div>
                              
                              {idx < bookNotes.length - 1 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span>Next note</span>
                                  <ChevronRight className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                  
                    
                    {/* Book navigation indicators */}
                    {selectedBookIndex !== null && (
                      <div className="flex justify-between mt-3 text-muted-foreground">
                        {selectedBookIndex > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex items-center text-xs p-0 h-8"
                            onClick={goToPrevBook}
                          >
                            <ChevronLeft className="h-3 w-3 mr-1" /> 
                            <span>Previous book</span>
                          </Button>
                        )}
                        {selectedBookIndex < books.length - 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex items-center text-xs p-0 h-8 ml-auto"
                            onClick={goToNextBook}
                          >
                            <span>Next book</span>
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Genres & Themes */}
                <div className="mb-4 ">
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
                  </div>
                {/* Desktop-only referral links (absolute positioning) */}
                {selectedBook?.referralLinks && selectedBook.referralLinks.length > 0 && (
                  <div className="hidden md:block mt-4 z-20 -left-5 top-0 absolute">
                    <div className="flex flex-wrap flex-col gap-2">
                      {selectedBook.referralLinks.map((link: any, idx: number) => (
                        <a 
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={ idx===0 ? "inline-flex items-center text-xs rounded-md px-3 py-1 bg-accent/90 hover:bg-accent text-foreground"
                            : idx===1 ? "inline-flex items-center text-xs border-border border bg-muted/90 hover:bg-muted rounded-md px-3 py-1 transition-colors text-foregound" :
                            "inline-flex items-center text-xs bg-transparent hover:bg-muted border-border border rounded-md px-3 py-1 text-foregound"}
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
                          <img src={link.faviconUrl} alt={link.retailer} className="h-6 w-6" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          
          {/* Book/Notes section - Desktop version */}
          <div className="hidden md:block">
            {bookNotes && bookNotes.length > 0 ? (
              <div className="space-y-3 transform w-[10ch] pr-2 pt-2">
                {bookNotes.map((note, idx) => (
                  <div 
                    key={note.id} 
                    className="p-3 rounded-lg bg-purple-900/40 rounded-l-none overflow-hidden h-[6ch] border-r-4 flex flex-row border-purple-600 cursor-pointer hover:bg-purple-900/50 transition-colors"
                    onClick={() => {
                      // Use the same animation logic for book notes
                      if (selectedNote && selectedNote.id === note.id && noteVisible) {
                        // If the same note is clicked while visible, hide it
                        setIsRotating(true);
                        setTimeout(() => {
                          setNoteVisible(false);
                          setIsRotating(false);
                          // Clear selected note after animation completes to prevent reopening
                          setSelectedNote(null);
                        }, 500);
                      } else {
                        // If no note is currently visible or a different note is clicked
                        if (noteVisible) {
                          // If a note is already visible, hide it first with animation
                          setIsRotating(true);
                          setTimeout(() => {
                            // Set the newly selected note
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
                        <div className="flex justify-center items-center mb-1">
                          <p className="text-xs text-foreground/80">
                            {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
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
          
          {/* No separate mobile notes section - notes are part of the main swipeable content */}

        </div>
        
        {/* Right column: Comment section */}
        <div className="w-full lg:w-1/3">
          <div className="rounded-lg bg-background border border-l border-gray-800 p-4">
            {shelfData?.shelf && (
              <CommentSection shelfId={shelfData.shelf.id} />
            )}
          </div>
        </div>
      </div>

      
      {/* Separator */}
      <div className="w-full border-t border-border my-4"></div>
      {/** Place the bookshelf name here */}
      <div className="relative">
        <h4 className="font-medium absolute w-full z-20 text-foregound">{ shelfData?.shelf?.title || "Book Shelf Name" }</h4>
      
        {/* Book Rack at the bottom */}
        <div className="px-4">
          <BookRackShelf 
            books={books}
            isLoading={isShelfLoading}
            onSelectBook={handleSelectBook}
            selectedBookIndex={selectedBookIndex}
            className="mx-auto max-w-4xl"
          />
        </div>
      </div>
    </div>
  );
}