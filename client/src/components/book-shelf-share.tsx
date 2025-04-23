import { useState, useEffect, useCallback } from "react";
import { Book as BookType } from "../types";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BookRackShelf } from "./book-rack-shelf";
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
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { ReferralButton } from "./referral-button";

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
  
  // Fetch the shelf and its books with robust parameter encoding
  const { data: shelfData, isLoading: isShelfLoading, error, refetch: refetchShelf } = useQuery<ShelfData>({
    queryKey: [`/api/book-shelf?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelfName)}`],
    enabled: !!username && !!shelfName, // Only run query if we have both parameters
    retry: 3, // Retry failed requests up to 3 times
  });

  // Get the books from the shelf data with safety check for undefined
  const books = shelfData?.books 
    ? shelfData.books.map(item => item.book) 
    : [];
  
  // Get the notes for the currently selected book
  const bookNotes = (selectedBook && shelfData?.bookNotes) 
    ? shelfData.bookNotes.filter((note: Note) => note.bookId === selectedBook.id) 
    : [];
  
  // Mobile swipe carousel for book details + notes
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
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
      console.error("Failed to load shelf data:", {
        username,
        shelfName,
        encodedUsername: encodeURIComponent(username),
        encodedShelfName: encodeURIComponent(shelfName)
      });
    }
  }, [isShelfLoading, shelfData, username, shelfName]);

  // Log any query errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching bookshelf data:", error);
    }
  }, [error]);

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
      
      {/* Loading indicator */}
      {isShelfLoading && (
        <div className="flex flex-col items-center justify-center w-full h-64">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-foreground/80">Loading bookshelf...</p>
        </div>
      )}
      
      {/* Error state */}
      {!isShelfLoading && error && (
        <div className="w-full py-8 px-4 text-center">
          <div className="mb-4 text-red-500">
            <X className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Could not load bookshelf</h2>
          <p className="text-foreground/80 mb-4">The bookshelf you're looking for might not exist or is not shared.</p>
          <Button onClick={() => window.location.href = "/"}>
            Go to Homepage
          </Button>
        </div>
      )}
      
      {/* Main content area - only show when we have data and not loading */}
      {!isShelfLoading && !error && shelfData && (
        <>
          <div className="flex flex-col mt-0 lg:flex-row gap-6 p-4 w-full overflow-x-hidden">
            {/* Left column: Book details and comments */}
            <div className="w-full lg:w-2/3 flex relative">
              {/* Book Details Card that shows the selected book */}
              {selectedBook && (
                <div className="w-full">
                  <div className="flex h-full bg-muted border-gray-800 border flex-col md:flex-row rounded-lg max-w-full">
                    {/* Book cover */}
                    <div className="h-full z-20 flex-left flex justify-center md:min-w-[400px]">
                      <img 
                        src={selectedBook?.images?.find((img: any) => img.imageType === "full")?.imageUrl || "/images/placeholder-book.png"} 
                        alt={selectedBook?.title} 
                        className="h-auto w-full shadow-lg object-cover rounded-md" 
                      />
                    </div>

                    {/* Mobile-only share button and referral links container */}
                    <div className="flex md:hidden items-center mt-3 mb-4 gap-4">
                      {/* Share button for mobile */}
                      <Button 
                        size="sm" 
                        className="text-foregound bg-background/20 border-border border rounded-md"
                        onClick={async () => {
                          try {
                            const shareUrl = `${window.location.origin}/book-shelf/share?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelfName)}`;
                            
                            if (navigator.share) {
                              await navigator.share({
                                title: `${shelfName} by ${username}`,
                                text: `Check out this bookshelf: ${shelfName} by ${username}`,
                                url: shareUrl,
                              });
                            } else {
                              await navigator.clipboard.writeText(shareUrl);
                              toast({
                                title: "Link Copied!",
                                description: "The bookshelf link has been copied to your clipboard.",
                              });
                            }
                          } catch (error) {
                            console.error("Error sharing:", error);
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      
                      {/* Referral links for mobile */}
                      {selectedBook?.referralLinks && selectedBook.referralLinks.length > 0 && (
                        <div className="flex z-90 gap-4">
                          {selectedBook.referralLinks.map((link: any, idx: number) => (
                            <ReferralButton
                              key={idx}
                              bookId={selectedBook.id}
                              link={link}
                              sourceContext="book-shelf/share"
                              iconOnly={true}
                              className="inline-flex items-center justify-center"
                            />
                          ))} 4
                        </div>
                  
                      )}
                    </div>

                    {/* Book details section */}
                    <div className="flex ml-auto p-4 flex-col min-w-0 md:w-[500px] md:max-h-[500px]">
                      <h2 className="text-2xl font-bold mb-1 text-foregound">{selectedBook?.title}</h2>
                      <p className="text-foreground/90 mb-2 break-words">by {selectedBook?.authorName}</p>
                      
                      {/* Book description */}
                      <div className="mb-4">
                        {/* Desktop view */}
                        <div className="hidden md:block relative ">
                          {/* Animated Note Overlay */}
                          {selectedNote && (
                            <div className={`absolute z-30 top-0 left-0 w-full h-full flex items-center justify-center transition-all duration-500 ${isRotating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${noteVisible ? 'pointer-events-auto' : 'pointer-events-none opacity-0'}`}>
                              <div className="absolute inset-0 bg-background/90 backdrop-blur-lg"></div>
                              <div className={`relative z-40 transform transition-all duration-500 ${isRotating ? 'rotate-3 scale-95' : 'rotate-0 scale-100'}`}>
                                <PaperNoteCard note={selectedNote} className="max-w-sm" />
                              </div>
                            </div>
                          )}
                          
                          {/* Description text */}
                          <ScrollArea className="h-[300px] min-w-0 w-full pr-16 md:pr-1">
                            <p className="text-sm text-foreground/80">{selectedBook?.description}</p>
                          </ScrollArea>
                        </div>
                        
                        {/* Mobile view - Swipeable cards */}
                        <div className="md:hidden max-w-[80vw] overflow-hidden ">
                          <div className="overflow-hidden w-[90vw]" ref={emblaRef}>
                            <div className="flex  touch-pan-y">
                              {/* First card - book details */}
                              <div className="flex-[0_0_100%] pr-12 min-w-0 max-w-full">
                                <ScrollArea className="h-[180px] w-full">
                                  <p className="text-sm text-foreground/80">{selectedBook?.description}</p>
                                </ScrollArea>
                                
                                {/* Card navigation */}
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
                              
                              {/* Notes cards */}
                              {bookNotes.map((note, idx) => (
                                <div key={note.id} className="flex-[0_0_100%] p-4 pr-12 min-w-0 max-w-full">
                                  <div className="bg-muted/20 rounded-lg h-full overflow-y-auto w-full">
                                    <div className="flex justify-between items-center mb-2">
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                      </p>
                                      <Badge variant="outline" className="text-xs">Note {idx + 1}/{bookNotes.length}</Badge>
                                    </div>
                                    <PaperNoteCard note={note} />
                                  </div>
                                  
                                  {/* Navigation indicators */}
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
                   
                        </div>
                      </div>
                      
                      {/* Genres & Themes */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {selectedBook?.genres?.map((genre: any, idx: number) => (
                            <Badge key={idx} className="text-xs" variant="outline">{genre}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Notes and actions */}
                      <div className="flex items-center justify-between mt-2">
                        {/* Available notes indicator */}
                        <div className="flex items-center">
                          {bookNotes.length > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center text-xs gap-1"
                              onClick={() => {
                                if (!selectedNote) {
                                  setSelectedNote(bookNotes[0]);
                                  setNoteVisible(true);
                                } else {
                                  setIsRotating(true);
                                  setTimeout(() => {
                                    setNoteVisible(!noteVisible);
                                    setIsRotating(false);
                                  }, 300);
                                }
                              }}
                            >
                              <StickyNote className="h-3 w-3" /> 
                              {bookNotes.length} {bookNotes.length === 1 ? 'Note' : 'Notes'}
                            </Button>
                          )}
                        </div>
                        
                        {/* Desktop share button */}
                        <div className="hidden md:block">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center text-xs gap-1"
                            onClick={async () => {
                              try {
                                const shareUrl = `${window.location.origin}/book-shelf/share?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelfName)}`;
                                
                                if (navigator.share) {
                                  await navigator.share({
                                    title: `${shelfName} by ${username}`,
                                    text: `Check out this bookshelf: ${shelfName} by ${username}`,
                                    url: shareUrl,
                                  });
                                } else {
                                  await navigator.clipboard.writeText(shareUrl);
                                  toast({
                                    title: "Link Copied!",
                                    description: "The bookshelf link has been copied to your clipboard.",
                                  });
                                }
                              } catch (error) {
                                console.error("Error sharing:", error);
                              }
                            }}
                          >
                            <Share2 className="h-3 w-3" />
                            Share Bookshelf
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

          {/* Separator and Book Rack */}
          <div className="w-full border-t border-border my-4"></div>
          <div className="relative">
            <h4 className="font-medium absolute w-full z-20 text-foregound">
              {shelfData?.shelf?.title || "Book Shelf Name"}
            </h4>
            
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
        </>
      )}
    </div>
  );
}