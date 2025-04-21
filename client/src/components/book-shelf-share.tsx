import { useState, useEffect, useCallback, useRef } from "react";
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
  
  // Mobile view detection
  const [isMobileViewActive, setIsMobileViewActive] = useState(false);
  
  // Track current note index for swipe in mobile view
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  
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
  
  // Mobile swipe carousel for book description
  const [descriptionEmblaRef, descriptionEmblaApi] = useEmblaCarousel({ 
    loop: bookNotes.length > 1,
    align: 'center'
  });
  
  // Mobile detection on component mount
  useEffect(() => {
    const checkMobileView = () => {
      const isMobile = window.innerWidth < 768; // Match md: breakpoint
      setIsMobileViewActive(isMobile);
    };
    
    // Check initially
    checkMobileView();
    
    // Set up listener for window resize
    window.addEventListener('resize', checkMobileView);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);
    
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
  
  // Handle Embla carousel initialization and scroll events for the notes carousel
  useEffect(() => {
    if (!emblaApi) return;
    
    // Reset carousel to beginning when book or notes change
    emblaApi.scrollTo(0);
    setCurrentSlideIndex(0);
    
    // Add scroll event listener to track current slide
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setCurrentSlideIndex(index);
      // Update current note index for the description carousel synchronization
      setCurrentNoteIndex(index);
    };
    
    emblaApi.on("select", onSelect);
    
    // Cleanup function
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, bookNotes, showBookDetails]);
  
  // Handle description carousel initialization and scroll events
  useEffect(() => {
    if (!descriptionEmblaApi || !bookNotes.length) return;
    
    // Reset carousel to beginning when book changes
    descriptionEmblaApi.scrollTo(0);
    
    // Add scroll event listener to update notes
    const onSelect = () => {
      const index = descriptionEmblaApi.selectedScrollSnap();
      setCurrentNoteIndex(index);
      
      // Show note preview indicator on mobile
      if (isMobileViewActive && showBookDetails) {
        toast({
          title: `Note ${index + 1} of ${bookNotes.length}`,
          description: bookNotes[index]?.content.substring(0, 30) + "...",
          duration: 1500,
        });
      }
    };
    
    descriptionEmblaApi.on("select", onSelect);
    
    // Cleanup function
    return () => {
      descriptionEmblaApi.off("select", onSelect);
    };
  }, [descriptionEmblaApi, bookNotes, isMobileViewActive, showBookDetails, toast]);
  
  // Navigation functions for notes carousel
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);
  
  // Navigation functions for description carousel
  const scrollDescPrev = useCallback(() => {
    if (descriptionEmblaApi && bookNotes.length > 0) {
      descriptionEmblaApi.scrollPrev();
    }
  }, [descriptionEmblaApi, bookNotes.length]);
  
  const scrollDescNext = useCallback(() => {
    if (descriptionEmblaApi && bookNotes.length > 0) {
      descriptionEmblaApi.scrollNext();
    }
  }, [descriptionEmblaApi, bookNotes.length]);
  

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
                    {showBookDetails ? (
                      <div>
                        {/* Swipeable book description with note navigation on mobile */}
                        {isMobileViewActive && bookNotes.length > 0 ? (
                          <div>
                            <div className="relative overflow-hidden" ref={descriptionEmblaRef}>
                              <div className="flex">
                                {/* Always show the book description as the first slide */}
                                <div className="min-w-full flex-shrink-0 pl-1 pr-4">
                                  <ScrollArea className="h-full min-w-0 w-full pr-4">
                                    <p className="text-sm text-foreground/80">{selectedBook?.description}</p>
                                  </ScrollArea>
                                </div>
                                
                                {/* Add placeholder slides for notes - we don't show content here, just for swiping */}
                                {bookNotes.map((_, idx) => (
                                  <div key={`note-placeholder-${idx}`} className="min-w-full flex-shrink-0 pl-1 pr-4">
                                    <ScrollArea className="h-full min-w-0 w-full pr-4">
                                      <p className="text-sm text-foreground/80">{selectedBook?.description}</p>
                                    </ScrollArea>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Show note indicators */}
                            {currentNoteIndex > 0 && (
                              <div className="mt-2 px-2 py-1 bg-primary/10 rounded-md flex items-center justify-between">
                                <div className="flex items-center">
                                  <StickyNote className="h-4 w-4 mr-2 text-primary" />
                                  <span className="text-xs text-primary">
                                    Viewing Note {currentNoteIndex} of {bookNotes.length}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => setShowBookDetails(false)}
                                >
                                  <StickyNote className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            
                            {/* Navigation dots for mobile swipe */}
                            {bookNotes.length > 0 && (
                              <div className="flex justify-center gap-1 mt-2">
                                <div 
                                  className={`h-1.5 w-6 rounded-full transition-colors ${
                                    currentNoteIndex === 0 ? 'bg-primary' : 'bg-gray-600'
                                  }`}
                                  onClick={() => descriptionEmblaApi?.scrollTo(0)}
                                />
                                {bookNotes.map((_, idx) => (
                                  <div 
                                    key={`dot-${idx}`}
                                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                      currentNoteIndex === idx + 1 ? 'bg-primary' : 'bg-gray-600'
                                    }`}
                                    onClick={() => descriptionEmblaApi?.scrollTo(idx + 1)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          // Regular non-swipeable view if no notes or not mobile
                          <div>
                            <ScrollArea className="h-full min-w-0 w-full pr-4">
                              <p className="text-sm text-foreground/80">{selectedBook?.description}</p>
                            </ScrollArea>
                            
                            {bookNotes.length > 0 && (
                              <div className="mt-3">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-foreground border-gray-700"
                                  onClick={() => setShowBookDetails(false)}
                                >
                                  <StickyNote className="h-4 w-4 mr-2" />
                                  View Book Notes ({bookNotes.length})
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Swipeable notes view */}
                        <div className="relative overflow-hidden" ref={emblaRef}>
                          <div className="flex">
                            {bookNotes.map((note, idx) => (
                              <div key={note.id} className="min-w-full flex-shrink-0 pl-1 pr-4">
                                <div className="p-3 rounded-lg bg-background/70 border border-gray-800">
                                  <PaperNoteCard note={note} />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Navigation UI */}
                          <div className="flex justify-between items-center mt-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-foreground border-gray-700"
                              onClick={() => setShowBookDetails(true)}
                            >
                              <BookIcon className="h-4 w-4 mr-2" />
                              Back to Details
                            </Button>
                            
                            {bookNotes.length > 1 && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={scrollPrev}
                                  className="px-2"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={scrollNext}
                                  className="px-2"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {/* Swipe indicators - only show if more than one note */}
                          {bookNotes.length > 1 && (
                            <div className="flex justify-center gap-1 mt-2">
                              {bookNotes.map((_, i) => (
                                <div 
                                  key={i}
                                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                    currentSlideIndex === i 
                                      ? 'w-4 bg-primary' 
                                      : 'w-1.5 bg-muted'
                                  }`}
                                  onClick={() => emblaApi?.scrollTo(i)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
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
          
          {/* Removed old mobile swipeable interface */}

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
        <h4 className="font-medium absolute w-full z-20 text-foregound ">{ shelfData?.shelf?.title || "Book Shelf Name" }</h4>
      
    
      {/* Book Rack at the bottom */}
      <div className="px-4 ">
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