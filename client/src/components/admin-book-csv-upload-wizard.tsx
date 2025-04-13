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
import { 
  Loader2, Upload, FileUp, Image, FileArchive, 
  CheckCircle, AlertTriangle, AlertCircle, Info
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

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
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'csv' | 'zip'>('zip'); // Default to ZIP mode
  const [bookImages, setBookImages] = useState<Record<string, File | null>>({
    'book-detail': null,
    'background': null,
    'hero': null,
    'book-card': null,
    'grid-item': null,
    'mini': null,
  });
  
  // Define refs with type safety
  type ImageTypes = 'book-detail' | 'background' | 'hero' | 'book-card' | 'grid-item' | 'mini';
  
  const fileInputRefs: Record<ImageTypes, React.RefObject<HTMLInputElement>> = {
    'book-detail': useRef<HTMLInputElement>(null),
    'background': useRef<HTMLInputElement>(null), 
    'hero': useRef<HTMLInputElement>(null),
    'book-card': useRef<HTMLInputElement>(null),
    'grid-item': useRef<HTMLInputElement>(null),
    'mini': useRef<HTMLInputElement>(null),
  };
  
  const zipInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (books: CsvBook[]) => {
      setIsProcessing(true);
      try {
        // Prepare form data and track progress
        const formData = new FormData();
        
        // If in ZIP mode, handle ZIP file upload with progress tracking
        if (uploadMode === 'zip' && zipFile) {
          // File size check - Show warning for files > 50MB
          const MAX_OPTIMAL_SIZE = 50 * 1024 * 1024; // 50MB
          if (zipFile.size > MAX_OPTIMAL_SIZE) {
            console.log(`Large file detected (${Math.round(zipFile.size / (1024 * 1024))}MB). Using optimized upload.`);
            
            // Add the ZIP file with optimized upload
            formData.append('bookZip', zipFile);
            
            // Update progress based on the XHR upload
            return new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              
              // Handle progress
              xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                  const progress = (event.loaded / event.total) * 100;
                  setUploadProgress(progress);
                }
              });
              
              // Handle completion
              xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                  } catch (error) {
                    reject(new Error('Invalid server response'));
                  }
                } else {
                  reject(new Error(`Server responded with status: ${xhr.status}`));
                }
              });
              
              // Handle network errors
              xhr.addEventListener('error', () => {
                reject(new Error('Network error occurred during upload'));
              });
              
              // Handle timeouts
              xhr.addEventListener('timeout', () => {
                reject(new Error('Upload timed out'));
              });
              
              // Open connection and send data
              xhr.open('POST', '/api/admin/books/bulk', true);
              xhr.withCredentials = true; // Include credentials
              xhr.timeout = 600000; // 10 minute timeout
              xhr.send(formData);
            });
          } else {
            // For smaller files, use standard approach
            formData.append('bookZip', zipFile);
          }
        } 
        // Otherwise, add individual image files and CSV data
        else {
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
        }

        // Only do standard fetch if we haven't already returned from XHR
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
      // Reset state
      setCsvData([]);
      setZipFile(null);
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
  
  const handleFileChange = (imageType: ImageTypes, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBookImages(prev => ({
        ...prev,
        [imageType]: e.target.files![0]
      }));
    }
  };
  
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file type
      if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        // Check file size - 100MB limit
        const MAX_SIZE = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > MAX_SIZE) {
          toast({
            title: "File too large",
            description: `Your file is ${Math.round(file.size / (1024 * 1024))}MB. Maximum size is 100MB.`,
            variant: "destructive",
          });
          return;
        }
        
        setZipFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a ZIP file containing your CSV and book images",
          variant: "destructive",
        });
      }
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
    if (!file) {
      toast({
        title: "No file provided",
        description: "Please upload a file",
        variant: "destructive",
      });
      return;
    }
    
    // Handle ZIP files
    if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
      // Check file size - 100MB limit
      const MAX_SIZE = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > MAX_SIZE) {
        toast({
          title: "File too large",
          description: `Your file is ${Math.round(file.size / (1024 * 1024))}MB. Maximum size is 100MB.`,
          variant: "destructive",
        });
        return;
      }
      
      setZipFile(file);
      setUploadMode('zip');
      
      toast({
        title: "ZIP file ready",
        description: "Click 'Upload' to process the ZIP file containing your books data and images",
      });
      
      // Set dummy CSV data to show the upload button
      setCsvData([{ Title: "ZIP Upload", Author: "ZIP Mode", formats: "zip" } as CsvBook]);
      return;
    }
    
    // Handle CSV files (legacy mode)
    if (file.name.endsWith('.csv')) {
      setUploadMode('csv');
      
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
      return;
    }
    
    // Handle other file types
    toast({
      title: "Invalid file type",
      description: "Please upload a ZIP file (containing your book data and images) or a CSV file",
      variant: "destructive",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4">
          <FileArchive className="w-4 h-4 mr-2" />
          Upload Books (ZIP Package)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Books with ZIP Package</DialogTitle>
        </DialogHeader>

        {csvData.length === 0 ? (
          <div className="space-y-6">
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
                Drag and drop your ZIP file here
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your ZIP should include:<br />
                1. A CSV file with columns: Title, Author, language, genres, subgenres, themes, tropes, formats<br />
                2. Book cover images with filenames matching the image types: book-detail, background, hero, etc.<br />
                <span className="text-amber-500 font-semibold">Maximum file size: 100MB</span>
              </p>
              
              <div className="flex flex-col items-center justify-center space-y-2 pt-4 border-t border-border">
                <input
                  type="file"
                  id="zip-upload"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={handleZipChange}
                  ref={zipInputRef}
                  className="hidden"
                />
                <Button 
                  variant="outline"
                  onClick={() => zipInputRef.current?.click()}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Browse for ZIP File
                </Button>
                
                {zipFile && (
                  <div className="mt-4 p-2 bg-primary/10 rounded-md w-full">
                    <p className="text-sm font-semibold flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {zipFile.name} ({Math.round(zipFile.size / 1024)} KB)
                    </p>
                    {zipFile.size > 50 * 1024 * 1024 && (
                      <Alert className="mt-2 mb-2">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Large File Detected</AlertTitle>
                        <AlertDescription>
                          For files over 50MB, uploading may take some time. Please be patient.
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button
                      className="w-full mt-2"
                      onClick={() => uploadMutation.mutate([])}
                      disabled={uploadMutation.isPending || isProcessing}
                    >
                      {(uploadMutation.isPending || isProcessing) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload ZIP File
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-950">
              <h4 className="text-md font-semibold flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                Security Measures
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>All files are scanned for viruses before processing</li>
                <li>Filenames are sanitized to prevent directory traversal</li>
                <li>Files are processed in an isolated environment</li>
                <li>Only specific file types are allowed (.csv, .jpg, .png, etc.)</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {uploadMode === 'zip' ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-primary/10">
                  <h3 className="text-lg font-semibold flex items-center">
                    <FileArchive className="w-5 h-5 mr-2" />
                    ZIP File Mode
                  </h3>
                  <p className="mt-2">
                    {zipFile?.name} ({Math.round((zipFile?.size || 0) / 1024)} KB) is ready for upload.
                  </p>
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Security Notice</AlertTitle>
                    <AlertDescription>
                      The zip file will be scanned for viruses and all filenames will be sanitized during processing.
                    </AlertDescription>
                  </Alert>
                </div>
              
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-muted-foreground text-center">
                      Processing ZIP... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}
              
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCsvData([]);
                      setZipFile(null);
                    }}
                    disabled={isProcessing}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={() => uploadMutation.mutate([])}
                    disabled={uploadMutation.isPending || isProcessing || !zipFile}
                  >
                    {(uploadMutation.isPending || isProcessing) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Upload ZIP File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                      {(Object.entries(fileInputRefs) as [ImageTypes, React.RefObject<HTMLInputElement>][]).map(([type, ref]) => (
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
                              ref={ref}
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}