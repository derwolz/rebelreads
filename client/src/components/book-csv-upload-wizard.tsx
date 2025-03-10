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

  const uploadMutation = useMutation({
    mutationFn: async (books: CsvBook[]) => {
      const res = await fetch("/api/books/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ books }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
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
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCsvData([])}
              >
                Clear
              </Button>
              <Button
                onClick={() => uploadMutation.mutate(csvData)}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending && (
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
