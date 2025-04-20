import { useState, useEffect, useRef } from "react";
import { Book } from "../types";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen } from "lucide-react";

interface BookRackShelfProps {
  books: Book[];
  isLoading?: boolean;
  selectedBookIndex?: number | null;
  onSelectBook?: (book: Book, index: number) => void;
  className?: string;
}

export function BookRackShelf({
  books,
  isLoading = false,
  selectedBookIndex = null,
  onSelectBook,
  className,
}: BookRackShelfProps) {
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const bookRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Set up books when props change
  useEffect(() => {
    setDisplayedBooks(books);
    // Reset book refs array with correct length
    bookRefs.current = books.map((_, i) => bookRefs.current[i] || null);
  }, [books]);

  // Book cover component
  const BookCover = ({ book, index }: { book: Book; index: number }) => {
    // Get the appropriate book cover image
    const coverImage = book.images?.find(img => img.imageType === "book-card")?.imageUrl 
      || book.coverUrl 
      || "/images/placeholder-book.png";

    // Custom overlay for book bottom
    const BookBottomOverlay = () => (
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-end pb-1 px-2">
        <p className="text-white text-xs truncate w-full text-center font-medium">
          {book.title}
        </p>
      </div>
    );

    return (
      <div
        ref={(el) => (bookRefs.current[index] = el)}
        className={cn(
          "relative h-52 w-32 transition-all duration-300 cursor-pointer mx-2",
          selectedBookIndex === index
            ? "scale-110 shadow-xl z-10 border-2 border-primary"
            : "hover:scale-105 shadow-md"
        )}
        onClick={() => onSelectBook && onSelectBook(book, index)}
      >
        <div className="relative h-full w-full overflow-hidden rounded">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${coverImage})` }}
          />
          <BookBottomOverlay />
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-52 w-full">
      <BookOpen className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
      <p className="text-muted-foreground text-sm">No books on this shelf yet</p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex space-x-4 overflow-hidden py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-52 w-32 rounded" />
      ))}
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      {isLoading ? (
        <LoadingState />
      ) : displayedBooks.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollArea className="w-full" type="scroll">
          <div className="flex space-x-4 pt-4 pb-8">
            <AnimatePresence>
              {displayedBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <BookCover book={book} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}