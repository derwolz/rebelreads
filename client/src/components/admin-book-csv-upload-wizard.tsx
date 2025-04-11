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
  author: string;
  genres: string;
  formats: string;
  page_count: string;
  published_date: string;
  language: string;
  isbn: string;
  amazon_link: string;
  barnes_noble_link: string;
  indieBound_link: string;
  custom_link: string;
}

export function AdminBookCsvUploadWizard() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState<CsvBook[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (books: CsvBook[]) => {
      setIsProcessing(true);
      try {
        // Prepare form data and track progress
        const formData = new FormData();
        
        // Process books and update progress 
        await Promise.all(
          books.map(async (book, index) => {
            try {
              // No image handling needed - images are uploaded separately through the book-upload-wizard
              setUploadProgress((index + 1) / books.length * 100);
              return null;
            } catch (error) {
              console.error(`Error processing book ${book.title}:`, error);
              return null;
            }
          })
        );

        // Add CSV data
        formData.append('csvData', JSON.stringify(books));

        // Upload to server using admin endpoint
        const res = await fetch("/api/admin/books/bulk", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) throw new Error(await res.text());
        return res.json();
      } finally {
        setIsProcessing(false);
        setUploadProgress(0);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Success",
        description: "Books have been uploaded successfully.",
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

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue.trim());
    return values.map(value => value.replace(/^"|"$/g, ''));
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
    const lines = text.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

    // Validate headers
    const requiredHeaders = [
      'title', 'description', 'author', 'genres', 'formats', 
      'page_count', 'published_date', 'language', 'isbn', 'amazon_link',
      'barnes_noble_link', 'indiebound_link', 'custom_link'
    ];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      toast({
        title: "Invalid CSV format",
        description: `Missing required columns: ${missingHeaders.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    const books = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const book: any = {};
      headers.forEach((header, index) => {
        // Remove quotes and trim
        book[header] = values[index] ? values[index].trim() : '';
      });
      return book as CsvBook;
    });

    setCsvData(books);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4">
          <Upload className="w-4 h-4 mr-2" />
          Upload Books CSV (Admin)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Books (Admin)</DialogTitle>
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
              title, description, author, genres (semicolon-separated), formats (semicolon-separated),<br />
              page_count, published_date, language, isbn, amazon_link, barnes_noble_link, indiebound_link, custom_link
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Genres</TableHead>
                    <TableHead>Formats</TableHead>
                    <TableHead>Page Count</TableHead>
                    <TableHead>Published Date</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Amazon</TableHead>
                    <TableHead>Barnes & Noble</TableHead>
                    <TableHead>IndieBound</TableHead>
                    <TableHead>Custom Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((book, index) => (
                    <TableRow key={index}>
                      <TableCell>{book.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{book.description}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.genres}</TableCell>
                      <TableCell>{book.formats}</TableCell>
                      <TableCell>{book.page_count}</TableCell>
                      <TableCell>{book.published_date}</TableCell>
                      <TableCell>{book.language}</TableCell>
                      <TableCell>{book.isbn}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{book.amazon_link}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{book.barnes_noble_link}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{book.indieBound_link}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{book.custom_link}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Processing books... {Math.round(uploadProgress)}%
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