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

  // Fetch taxonomies (genres, themes) for the selected book
  const { data: taxonomies } = useQuery<any[]>({
    queryKey: selectedBook ? [`/api/books/${selectedBook.id}/taxonomies`] : ["null-taxonomies"],
    enabled: !!selectedBook,
  });

  // Get top 5 taxonomies with proper sorting
  const topTaxonomies = taxonomies 
    ? [...taxonomies]
        .sort((a, b) => {
          // First sort by type priority (genre > subgenre > theme > trope)
          const typePriority = { genre: 0, subgenre: 1, theme: 2, trope: 3 };
          const typeA = typePriority[a.type as keyof typeof typePriority] || 4;
          const typeB = typePriority[b.type as keyof typeof typePriority] || 4;
          
          if (typeA !== typeB) return typeA - typeB;
          
          // Then sort by rank/importance
          return a.rank - b.rank;
        })
        .slice(0, 5)
    : [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Book Display */}
      {selectedBook && (
        <Card className="border shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left Column: Cover Image */}
            <div className="w-full md:w-1/3 bg-muted p-6 flex items-center justify-center">
              <img 
                src={selectedBook.images?.find(img => img.imageType === "book-detail")?.imageUrl || "/images/placeholder-book.png"} 
                alt={selectedBook.title} 
                className="max-h-[400px] w-auto shadow-lg rounded-md" 
              />
            </div>
            
            {/* Right Column: Book Details */}
            <div className="w-full md:w-2/3 p-6">
              <h2 className="text-2xl font-bold mb-1">{selectedBook.title}</h2>
              
              <Link
                href={`/authors/${selectedBook.authorId}`}
                className="text-lg text-primary hover:underline font-medium inline-flex items-center mb-4"
              >
                by {selectedBook.authorName}
              </Link>
              
              {/* Description */}
              <ScrollArea className="h-40 mb-6">
                <p className="text-md">{selectedBook.description}</p>
              </ScrollArea>
              
              {/* Genres & Themes */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Genres & Themes</h4>
                <div className="flex flex-wrap gap-1">
                  {topTaxonomies.map((taxonomy, idx) => (
                    <Badge 
                      key={idx} 
                      variant={taxonomy.type === 'genre' ? 'default' : 'outline'}
                      className={`
                        text-xs capitalize
                        ${taxonomy.type === 'genre' ? 'bg-primary/80' : ''}
                        ${taxonomy.type === 'subgenre' ? 'border-primary/60 text-primary-foreground' : ''}
                        ${taxonomy.type === 'theme' ? 'border-secondary/60 text-secondary-foreground' : ''}
                        ${taxonomy.type === 'trope' ? 'border-accent/60 text-accent-foreground' : ''}
                      `}
                    >
                      {taxonomy.name}
                    </Badge>
                  ))}
                  {topTaxonomies.length === 0 && (
                    <span className="text-xs text-muted-foreground">No genres or themes available</span>
                  )}
                </div>
              </div>
              
              {/* Book Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-muted-foreground mb-4">
                {selectedBook.pageCount && (
                  <div>
                    <span className="font-medium">Pages:</span> {selectedBook.pageCount}
                  </div>
                )}
                {selectedBook.publishedDate && (
                  <div>
                    <span className="font-medium">Published:</span> {formatDate(selectedBook.publishedDate)}
                  </div>
                )}
                {selectedBook.language && (
                  <div>
                    <span className="font-medium">Language:</span> {selectedBook.language}
                  </div>
                )}
                <div>
                  <span className="font-medium">Format:</span> {selectedBook.formats?.join(", ") || "Unknown"}
                </div>
              </div>
              
              {/* Book purchase links */}
              {selectedBook.referralLinks && selectedBook.referralLinks.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Where to Buy</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedBook.referralLinks.map((link: any, idx: number) => (
                      <a 
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs bg-muted hover:bg-muted/80 rounded-md px-3 py-1 transition-colors"
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Record click-through on referral link
                          await apiRequest("POST", `/api/books/${selectedBook.id}/click-through`, {
                            source: "shelf-detail-card",
                            referrer: window.location.pathname,
                          });
                        }}
                      >
                        {link.faviconUrl && (
                          <img 
                            src={link.faviconUrl} 
                            alt={link.retailer} 
                            className="w-4 h-4 mr-2" 
                          />
                        )}
                        <span className="mr-1">{link.customName || link.retailer}</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
      
      {/* Book Notes Section */}
      <div className="relative">
        {bookNotes && bookNotes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {bookNotes.map((note) => (
              <div 
                key={note.id}
                className="bg-muted/30 p-3 rounded-lg shadow-sm cursor-pointer border border-accent/20 hover:border-accent/60 transition-colors"
                onClick={() => setSelectedNote(note)}
              >
                <div className="flex items-start gap-2">
                  <StickyNote className="h-4 w-4 flex-shrink-0 mt-1 text-accent" />
                  <div>
                    <p className="text-sm line-clamp-3">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Note Section (only visible to owner) */}
      {user?.username === username && (
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
      )}
      
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