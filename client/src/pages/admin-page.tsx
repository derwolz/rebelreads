import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainNav } from "@/components/main-nav";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DragDropFile } from "@/components/drag-drop-file";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminStats {
  totalUsers: number;
  totalBooks: number;
  totalReviews: number;
  activeUsers: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewCsvFile, setReviewCsvFile] = useState<File | null>(null);
  const [bookCsvFile, setBookCsvFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const uploadReviewsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("csv", file);
      const res = await apiRequest("POST", "/api/admin/bulk-upload-reviews", formData);
      const data = await res.json();
      if (data.errors) {
        throw new Error(data.errors.join('\n'));
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      setReviewCsvFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadBooksMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("csv", file);
      const res = await apiRequest("POST", "/api/admin/bulk-upload-books", formData);
      const data = await res.json();
      if (data.errors) {
        throw new Error(data.errors.join('\n'));
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      setBookCsvFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReviewUpload = () => {
    if (reviewCsvFile) {
      uploadReviewsMutation.mutate(reviewCsvFile);
    }
  };

  const handleBookUpload = () => {
    if (bookCsvFile) {
      uploadBooksMutation.mutate(bookCsvFile);
    }
  };

  return (
    <div>
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="bulk-review-upload">Bulk Review Upload</TabsTrigger>
            <TabsTrigger value="bulk-book-upload">Bulk Book Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalUsers ?? "Loading..."}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Books
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalBooks ?? "Loading..."}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalReviews ?? "Loading..."}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.activeUsers ?? "Loading..."}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bulk-review-upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Review Upload</CardTitle>
                <CardDescription>
                  Upload reviews in CSV format. The system will automatically:
                  - Use the public domain user (ID: 9) as the reviewer
                  - Determine the book ID based on the book title
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    Your CSV file should include the following columns:
                  </AlertDescription>
                </Alert>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>book_title</TableCell>
                      <TableCell>text</TableCell>
                      <TableCell>Title of the book to review</TableCell>
                      <TableCell>Yes</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>enjoyment</TableCell>
                      <TableCell>number (1-5)</TableCell>
                      <TableCell>Overall enjoyment rating</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>writing</TableCell>
                      <TableCell>number (1-5)</TableCell>
                      <TableCell>Writing quality rating</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>themes</TableCell>
                      <TableCell>number (1-5)</TableCell>
                      <TableCell>Theme development rating</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>characters</TableCell>
                      <TableCell>number (1-5)</TableCell>
                      <TableCell>Character development rating</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>worldbuilding</TableCell>
                      <TableCell>number (1-5)</TableCell>
                      <TableCell>World-building rating</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>review</TableCell>
                      <TableCell>text</TableCell>
                      <TableCell>Written review content</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>analysis</TableCell>
                      <TableCell>json</TableCell>
                      <TableCell>Analysis data in JSON format</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="mt-6">
                  <DragDropFile
                    file={reviewCsvFile}
                    onFileChange={setReviewCsvFile}
                    accept=".csv"
                    maxSize={5 * 1024 * 1024} // 5MB max
                  />
                  {reviewCsvFile && (
                    <button
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      onClick={handleReviewUpload}
                      disabled={uploadReviewsMutation.isPending}
                    >
                      {uploadReviewsMutation.isPending ? "Uploading..." : "Upload Reviews"}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-book-upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Book Upload</CardTitle>
                <CardDescription>
                  Upload books in CSV format. The system will automatically:
                  - Generate unique IDs for new books
                  - Convert arrays (genres, formats) from comma-separated strings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    Your CSV file should include the following columns:
                  </AlertDescription>
                </Alert>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>title</TableCell>
                      <TableCell>text</TableCell>
                      <TableCell>Book title</TableCell>
                      <TableCell>Yes</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>description</TableCell>
                      <TableCell>text</TableCell>
                      <TableCell>Book description</TableCell>
                      <TableCell>Yes</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>cover_url</TableCell>
                      <TableCell>text</TableCell>
                      <TableCell>URL to book cover image</TableCell>
                      <TableCell>Yes</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>author</TableCell>
                      <TableCell>text</TableCell>
                      <TableCell>Author name</TableCell>
                      <TableCell>Yes</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>genres</TableCell>
                      <TableCell>comma-separated text</TableCell>
                      <TableCell>Book genres (e.g. "Fantasy,Adventure")</TableCell>
                      <TableCell>Yes</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>formats</TableCell>
                      <TableCell>comma-separated text</TableCell>
                      <TableCell>Available formats (e.g. "Hardcover,eBook")</TableCell>
                      <TableCell>Yes</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>page_count</TableCell>
                      <TableCell>number</TableCell>
                      <TableCell>Number of pages</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>published_date</TableCell>
                      <TableCell>date (YYYY-MM-DD)</TableCell>
                      <TableCell>Publication date</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>language</TableCell>
                      <TableCell>text</TableCell>
                      <TableCell>Book language</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>isbn</TableCell>
                      <TableCell>text</TableCell>
                      <TableCell>ISBN number</TableCell>
                      <TableCell>No</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="mt-6">
                  <DragDropFile
                    file={bookCsvFile}
                    onFileChange={setBookCsvFile}
                    accept=".csv"
                    maxSize={5 * 1024 * 1024} // 5MB max
                  />
                  {bookCsvFile && (
                    <button
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      onClick={handleBookUpload}
                      disabled={uploadBooksMutation.isPending}
                    >
                      {uploadBooksMutation.isPending ? "Uploading..." : "Upload Books"}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>User management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Book Management</CardTitle>
                <CardDescription>
                  Manage books and their content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Book management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Management</CardTitle>
                <CardDescription>
                  Handle user reviews and content moderation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Review management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}