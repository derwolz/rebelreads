import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CsvBook {
  title: string;
  description: string;
  cover_url: string;
  author: string;
  genres: string;
  formats: string;
  page_count: string;
  published_date: string;
  language: string;
  isbn: string;
}

export function BookCsvUploadWizard() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState<CsvBook[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateBook = (book: CsvBook): string | null => {
    if (!book.title?.trim()) return "Title is required";
    if (!book.description?.trim()) return "Description is required";
    if (!book.cover_url?.trim()) return "Cover URL is required";

    // Validate page count
    if (book.page_count) {
      const trimmedCount = book.page_count.trim();
      console.log("Validating page count:", trimmedCount);
      const pageCount = parseInt(trimmedCount, 10);
      if (isNaN(pageCount) || pageCount <= 0) {
        return "Page count must be a positive number";
      }
    }

    // Validate date
    if (book.published_date) {
      const date = new Date(book.published_date);
      if (isNaN(date.getTime())) {
        return "Invalid published date format";
      }
    }

    return null;
  };

  const uploadMutation = useMutation({
    mutationFn: async (books: CsvBook[]) => {
      setIsProcessing(true);
      try {
        // Validate all books first
        for (const book of books) {
          const error = validateBook(book);
          if (error) {
            throw new Error(`Validation error for book "${book.title}": ${error}`);
          }
        }

        // Download all cover images
        const formData = new FormData();
        const coverBlobs = await Promise.all(
          books.map(async (book, index) => {
            try {
              const response = await fetch(book.cover_url);
              if (!response.ok) throw new Error(`Failed to fetch image ${index + 1}`);
              const blob = await response.blob();
              formData.append('covers', blob, `cover-${index}.${blob.type.split('/')[1]}`);
              setUploadProgress((index + 1) / books.length * 100);
              return blob;
            } catch (error) {
              console.error(`Error downloading cover for ${book.title}:`, error);
              throw new Error(`Failed to download cover image for "${book.title}"`);
            }
          })
        );

        // Add CSV data
        formData.append('csvData', JSON.stringify(books));

        // Upload to server
        const res = await fetch("/api/books/bulk", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to upload books');
        }
        return res.json();
      } finally {
        setIsProcessing(false);
        setUploadProgress(0);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Success",
        description: "Your books have been uploaded successfully.",
      });
      setCsvData([]);
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].toLowerCase().trim().split(',');

    // Validate headers
    const requiredHeaders = ['title', 'description', 'cover_url', 'author', 'genres', 'formats', 'page_count', 'published_date', 'language', 'isbn'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      toast({
        title: "Invalid CSV format",
        description: `Missing required columns: ${missingHeaders.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    const books = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',').map(v => v.trim());
      const book: any = {};
      headers.forEach((header, index) => {
        book[header] = values[index] || '';
      });
      return book as CsvBook;
    });

    // Validate all books before setting state
    for (const book of books) {
      const error = validateBook(book);
      if (error) {
        toast({
          title: "Invalid book data",
          description: `Error in book "${book.title}": ${error}`,
          variant: "destructive",
        });
        return;
      }
    }

    setCsvData(books);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4">
          <Upload className="w-4 h-4 mr-2" />
          Upload Books CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Books</DialogTitle>
        </DialogHeader>

        {csvData.length === 0 ? (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center
              ${isDragging ? 'border-primary bg-primary/10' : 'border-border'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mx-auto w-12 h-12 mb-4">
              <Upload className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Drag and drop your CSV file here
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your CSV should include the following columns:<br />
              title, description, cover_url, author, genres, formats, page_count, published_date, language, isbn
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Genres</TableHead>
                    <TableHead>Formats</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((book, index) => (
                    <TableRow key={index}>
                      <TableCell>{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.isbn}</TableCell>
                      <TableCell>{book.genres}</TableCell>
                      <TableCell>{book.formats}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Processing images... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCsvData([])}
                disabled={isProcessing}
              >
                Clear
              </Button>
              <Button
                onClick={() => uploadMutation.mutate(csvData)}
                disabled={uploadMutation.isPending || isProcessing}
              >
                {(uploadMutation.isPending || isProcessing) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Upload {csvData.length} Books
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}