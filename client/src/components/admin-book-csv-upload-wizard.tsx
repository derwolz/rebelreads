import { useState, useRef } from "react";
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
import { Loader2, Upload, FileUp, Image } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CsvBook {
  Title: string;
  Author: string;
  language: string;
  publish_date: string;
  genres: string;
  subgenres: string;
  themes: string;
  tropes: string;
  background: string;
  hero: string;
  'book-detail': string;
  'book-card': string;
  'grid-item': string;
  mini: string;
  pages: string;
  isbn: string;
  asin: string;
  Description: string;
  internal_details: string;
  series: string;
  setting: string;
  characters: string;
  awards: string;
  formats: string;
  referralLinks: string;
}

export function AdminBookCsvUploadWizard() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState<CsvBook[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookImages, setBookImages] = useState<Record<string, File | null>>({
    'book-detail': null,
    'background': null,
    'hero': null,
    'book-card': null,
    'grid-item': null,
    'mini': null,
  });
  const fileInputRefs = {
    'book-detail': useRef<HTMLInputElement>(null),
    'background': useRef<HTMLInputElement>(null), 
    'hero': useRef<HTMLInputElement>(null),
    'book-card': useRef<HTMLInputElement>(null),
    'grid-item': useRef<HTMLInputElement>(null),
    'mini': useRef<HTMLInputElement>(null),
  };

  const uploadMutation = useMutation({
    mutationFn: async (books: CsvBook[]) => {
      setIsProcessing(true);
      try {
        // Prepare form data and track progress
        const formData = new FormData();
        
        // Add image files to form data
        Object.entries(bookImages).forEach(([type, file]) => {
          if (file) {
            formData.append(`bookImage_${type}`, file);
          }
        });
        
        // Process books and update progress 
        await Promise.all(
          books.map(async (book, index) => {
            try {
              setUploadProgress((index + 1) / books.length * 100);
              return null;
            } catch (error) {
              console.error(`Error processing book ${book.Title}:`, error);
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Success",
        description: `Successfully uploaded ${data.successful} books. ${data.failed} failed.`,
      });
      setCsvData([]);
      setBookImages({
        'book-detail': null,
        'background': null,
        'hero': null,
        'book-card': null,
        'grid-item': null,
        'mini': null,
      });
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
  
  const handleFileChange = (imageType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBookImages(prev => ({
        ...prev,
        [imageType]: e.target.files![0]
      }));
    }
  };

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
    const headers = parseCSVLine(lines[0]);

    // Validate headers
    const requiredHeaders = [
      'Title', 'Author', 'formats'
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
              Title, Author, language, publish_date, genres, subgenres, themes, tropes, formats (comma-separated)<br />
              The required fields are: Title, Author, and formats
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="books">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="books">Books Data</TabsTrigger>
                <TabsTrigger value="images">Book Images</TabsTrigger>
              </TabsList>
              
              <TabsContent value="books" className="space-y-4">
                <ScrollArea className="h-[300px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Genres</TableHead>
                        <TableHead>Subgenres</TableHead>
                        <TableHead>Themes</TableHead>
                        <TableHead>Tropes</TableHead>
                        <TableHead>Formats</TableHead>
                        <TableHead>Pages</TableHead>
                        <TableHead>Published Date</TableHead>
                        <TableHead>Language</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.map((book, index) => (
                        <TableRow key={index}>
                          <TableCell>{book.Title}</TableCell>
                          <TableCell>{book.Author}</TableCell>
                          <TableCell>{book.genres}</TableCell>
                          <TableCell>{book.subgenres}</TableCell>
                          <TableCell>{book.themes}</TableCell>
                          <TableCell>{book.tropes}</TableCell>
                          <TableCell>{book.formats}</TableCell>
                          <TableCell>{book.pages}</TableCell>
                          <TableCell>{book.publish_date}</TableCell>
                          <TableCell>{book.language}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="images" className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(fileInputRefs).map(([type, ref]) => (
                    <Card key={type} className="overflow-hidden">
                      <CardContent className="p-4 space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor={`image-${type}`}>{type}</Label>
                          <div className="relative w-full aspect-[3/4] bg-muted rounded-md flex items-center justify-center overflow-hidden">
                            {bookImages[type] ? (
                              <img 
                                src={URL.createObjectURL(bookImages[type]!)} 
                                alt={`${type} preview`}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <Image className="w-12 h-12 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <input
                          type="file"
                          id={`image-${type}`}
                          accept="image/*"
                          onChange={(e) => handleFileChange(type, e)}
                          ref={ref as React.RefObject<HTMLInputElement>}
                          className="hidden"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => fileInputRefs[type]?.current?.click()}
                        >
                          <FileUp className="w-4 h-4 mr-2" />
                          Upload {type}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

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
                onClick={() => {
                  setCsvData([]);
                  setBookImages({
                    'book-detail': null,
                    'background': null,
                    'hero': null,
                    'book-card': null,
                    'grid-item': null,
                    'mini': null,
                  });
                }}
                disabled={isProcessing}
              >
                Clear
              </Button>
              <Button
                onClick={() => uploadMutation.mutate(csvData)}
                disabled={uploadMutation.isPending || isProcessing || 
                         !bookImages['book-detail'] || // Required image
                         !bookImages['background'] || // Required image
                         !bookImages['hero'] || // Required image
                         !bookImages['book-card'] || // Required image
                         !bookImages['grid-item'] || // Required image
                         !bookImages['mini']} // Required image
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