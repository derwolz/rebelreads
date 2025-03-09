import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface CSVBook {
  title: string;
  description?: string;
  author: string;
  isbn?: string;
  publishedDate?: string;
  genres?: string;
  language?: string;
}

export function AdminMassUpload() {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState<CSVBook[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (books: CSVBook[]) => {
      const response = await fetch("/api/admin/books/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ books }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Upload successful",
        description: `Successfully imported ${csvData.length} books.`,
      });
      setCsvData([]);
      setIsPreviewMode(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const requiredFields = ['title', 'author'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        setValidationErrors([`Missing required columns: ${missingFields.join(', ')}`]);
        return;
      }

      const books: CSVBook[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const book: any = {};
        
        headers.forEach((header, index) => {
          book[header] = values[index] || '';
        });

        if (!book.title) {
          errors.push(`Row ${i}: Missing title`);
          continue;
        }
        if (!book.author) {
          errors.push(`Row ${i}: Missing author`);
          continue;
        }

        // Convert genres from comma-separated string to array
        if (book.genres) {
          book.genres = book.genres.split(';').map((g: string) => g.trim());
        }

        books.push(book);
      }

      setValidationErrors(errors);
      setCsvData(books);
      setIsPreviewMode(true);
    };
    reader.readAsText(file);
  };

  const handleUpload = () => {
    if (csvData.length === 0) {
      toast({
        title: "No data to upload",
        description: "Please select a CSV file first.",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(csvData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mass Upload Books</CardTitle>
        <CardDescription>
          Upload multiple books using a CSV file. The CSV must include 'title' and 'author' columns.
          Optional columns: description, isbn, publishedDate, genres (semicolon-separated), language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {isPreviewMode && csvData.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Preview ({csvData.length} books)</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Genres</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((book, index) => (
                      <TableRow key={index}>
                        <TableCell>{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{book.isbn || '-'}</TableCell>
                        <TableCell>{book.genres ? (Array.isArray(book.genres) ? book.genres.join(', ') : book.genres) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {csvData.length > 5 && (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    And {csvData.length - 5} more books...
                  </div>
                )}
              </div>
              
              <Button
                className="mt-4"
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Books'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
