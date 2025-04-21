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
  
  // Mobile swipe carousel for book notes
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: bookNotes.length > 1,
    align: 'center',
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
    
    // Reset carousel to beginning when book or notes change
    emblaApi.scrollTo(0);
    setCurrentSlideIndex(0);
    
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
    <div className={`${className} bg-background max-w-[95vw] md:max-w-[90vw] flex justify-center flex-col text-foregound h-full`}>
      
      
      {/* Main content area */}
      <div className="flex flex-col mt-0 lg:flex-row gap-6 p-4 ">
       
        {/* Left column: Book details and comments */}
        <div className="w-full lg:w-2/3 flex relative ">

          
          
          
          {/* Book Details Card that shows the selected book */}
          <div 
            className={`transition-all duration-500 `}
          >
            <div className="">

             


              
         
              
              {/* Book details */}
              <div className="flex h-full bg-muted border-gray-800 border flex-col  overflow-hidden  md:flex-row rounded-lg">


                {/* Book cover */}
                <div className="h-full z-20 flex-left flex   justify-center overflow-hidden  ">
                  <img 
                    src={selectedBook?.images?.find((img: any) => img.imageType === "book-detail")?.imageUrl || "/images/placeholder-book.png"} 
                    alt={selectedBook?.title} 
                    className="h-auto min-h-[350px] w-full shadow-lg object-cover rounded-md" 
                  />
                </div>

                
                {/* Animated Note Overlay - Only covers the details section */}
                {selectedNote && (
                  <div 
                    className={`absolute top-0 right-0 bottom-0 left-0 z-10 transition-all duration-500 ${
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

                {/* Mobile-only share button and referral links container - between cover and title */}
                <div className="flex md:hidden items-center mb-4 gap-2">
                  {/* Share button for mobile */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-foregound"
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
                    <div className="flex gap-2">
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
                  <div className="hidden md:block">
                    <ScrollArea className="h-full min-w-0 w-full pr-4">
                      <p className="text-sm text-foreground/80">{selectedBook?.description}</p>
                    </ScrollArea>
                  </div>
                  
                  {/* Mobile view - Swipeable content */}
                  <div className="md:hidden">
                    <div 
                      className="relative touch-pan-y"
                      onTouchStart={(e) => {
                        if (!isMobileViewActive) return;
                        
                        // Store the starting position
                        const startX = e.touches[0].clientX;
                        
                        // Define the touch move handler
                        const handleTouchMove = (moveEvent: TouchEvent) => {
                          const currentX = moveEvent.touches[0].clientX;
                          const diffX = currentX - startX;
                          
                          // If significant horizontal swipe detected
                          if (Math.abs(diffX) > 50) {
                            // Prevent default behavior to avoid page scrolling
                            moveEvent.preventDefault();
                          }
                        };
                        
                        // Define the touch end handler
                        const handleTouchEnd = (endEvent: TouchEvent) => {
                          const endX = endEvent.changedTouches[0].clientX;
                          const diffX = endX - startX;
                          
                          // If significant horizontal swipe detected
                          if (Math.abs(diffX) > 75) {
                            if (diffX > 0) {
                              // Swipe right - go to previous book
                              goToPrevBook();
                            } else {
                              // Swipe left - go to next book
                              goToNextBook();
                            }
                          }
                          
                          // Clean up
                          document.removeEventListener('touchmove', handleTouchMove);
                          document.removeEventListener('touchend', handleTouchEnd);
                        };
                        
                        // Add the event listeners
                        document.addEventListener('touchmove', handleTouchMove, { passive: false });
                        document.addEventListener('touchend', handleTouchEnd);
                      }}
                    >
                      <ScrollArea className="h-[200px] min-w-0 w-full">
                        <p className="text-sm text-foreground/80">{selectedBook?.description}</p>
                      </ScrollArea>
                      
                      {/* Subtle indicators for swipe on mobile */}
                      {selectedBookIndex !== null && (
                        <div className="flex justify-between mt-2 text-muted-foreground/30">
                          {selectedBookIndex > 0 && (
                            <div className="text-xs flex items-center">
                              <ChevronLeft className="h-3 w-3" /> 
                              <span className="ml-1">Swipe right for prev</span>
                            </div>
                          )}
                          {selectedBookIndex < books.length - 1 && (
                            <div className="text-xs flex items-center ml-auto">
                              <span className="mr-1">Swipe left for next</span>
                              <ChevronRight className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
          
          {/* Mobile-only swipeable book notes */}
          <div className="md:hidden mt-4">
            {bookNotes && bookNotes.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <StickyNote className="w-4 h-4 mr-1" />
                  Notes for this book ({bookNotes.length})
                </h3>
                
                {/* Swipeable embla carousel */}
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {bookNotes.map((note) => (
                      <div 
                        key={note.id}
                        className="flex-[0_0_100%] min-w-0 pl-1 pr-4"
                      >
                        <div className="border border-border bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </p>
                          <PaperNoteCard note={note} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Pagination dots */}
                {bookNotes.length > 1 && (
                  <div className="flex justify-center gap-1 mt-2">
                    {bookNotes.map((_, idx) => (
                      <button
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${
                          currentSlideIndex === idx 
                            ? 'bg-foreground/80 scale-110' 
                            : 'bg-muted-foreground/30'
                        }`}
                        onClick={() => emblaApi?.scrollTo(idx)}
                        aria-label={`Go to note ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground mt-4 italic">
                No notes for this book
              </div>
            )}
          </div>

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