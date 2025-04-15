import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart, 
  LineChart, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  PlusCircle, 
  Settings, 
  UserPlus, 
  X, 
  Check,
  AlertTriangle
} from "lucide-react";

interface Publisher {
  id: number;
  publisher_name: string;
  publisher_description?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  website?: string;
  logo_url?: string;
  createdAt: string;
  userId: number;
}

interface Author {
  id: number;
  userId: number;
  author_name: string;
  author_image_url?: string | null;
  bio?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  website?: string | null;
}

interface Book {
  id: number;
  title: string;
  authorId: number;
  description: string;
  publishedDate: string;
  pageCount: number;
  formats: string[];
  impressionCount: number;
  clickThroughCount: number;
  authorName?: string;
  images?: Array<{
    imageUrl: string;
    imageType: string;
  }>;
}

interface AuthorWithBooks {
  author: Author;
  books: Book[];
  metrics?: {
    totalImpressions: number;
    totalClickThroughs: number;
    conversionRate: number;
  }
}

// Schema for adding a new author to the publisher
const addAuthorSchema = z.object({
  author_id: z.number({
    required_error: "Please select an author",
  }),
  contract_start: z.string({
    required_error: "Please specify a contract start date",
  }),
});

// Schema for updating publisher profile
const updatePublisherSchema = z.object({
  publisher_name: z.string().min(1, "Publisher name is required"),
  publisher_description: z.string().optional(),
  business_email: z.string().email("Invalid email format").optional(),
  business_phone: z.string().optional(),
  business_address: z.string().optional(),
  website: z.string().url("Invalid URL format").optional().or(z.literal('')),
});

export default function PublisherDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddAuthorDialog, setShowAddAuthorDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  
  // Fetch publisher profile
  const { data: publisherProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["/api/account/publisher-profile"],
  });

  // Fetch publisher authors with their books
  const { data: authorsWithBooks, isLoading: loadingAuthors } = useQuery({
    queryKey: ["/api/catalogue/publisher/authors"],
    enabled: !!publisherProfile,
  });

  // Fetch all authors for adding to publisher
  const { data: availableAuthors, isLoading: loadingAvailableAuthors } = useQuery({
    queryKey: ["/api/catalogue/authors/available"],
    enabled: showAddAuthorDialog,
  });

  // Form for adding an author
  const addAuthorForm = useForm<z.infer<typeof addAuthorSchema>>({
    resolver: zodResolver(addAuthorSchema),
    defaultValues: {
      contract_start: new Date().toISOString().split('T')[0],
    },
  });

  // Form for updating publisher profile
  const updateProfileForm = useForm<z.infer<typeof updatePublisherSchema>>({
    resolver: zodResolver(updatePublisherSchema),
    defaultValues: {
      publisher_name: publisherProfile?.publisher_name || "",
      publisher_description: publisherProfile?.publisher_description || "",
      business_email: publisherProfile?.business_email || "",
      business_phone: publisherProfile?.business_phone || "",
      business_address: publisherProfile?.business_address || "",
      website: publisherProfile?.website || "",
    },
  });

  // When publisher profile is loaded, update the form values
  React.useEffect(() => {
    if (publisherProfile) {
      updateProfileForm.reset({
        publisher_name: publisherProfile.publisher_name,
        publisher_description: publisherProfile.publisher_description,
        business_email: publisherProfile.business_email,
        business_phone: publisherProfile.business_phone,
        business_address: publisherProfile.business_address,
        website: publisherProfile.website,
      });
    }
  }, [publisherProfile, updateProfileForm]);

  // Add author mutation
  const addAuthorMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addAuthorSchema>) => {
      const response = await fetch(`/api/publishers/${publisherProfile?.id}/authors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add author");
      }

      return response.json();
    },
    onSuccess: () => {
      setShowAddAuthorDialog(false);
      addAuthorForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/catalogue/publisher/authors"] });
      toast({
        title: "Author added",
        description: "The author has been added to your publisher profile",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add author",
        variant: "destructive",
      });
    },
  });

  // Update publisher profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updatePublisherSchema>) => {
      const response = await fetch(`/api/publishers/${publisherProfile?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      setShowEditProfileDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/account/publisher-profile"] });
      toast({
        title: "Profile updated",
        description: "Your publisher profile has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Remove author mutation
  const removeAuthorMutation = useMutation({
    mutationFn: async (authorId: number) => {
      const response = await fetch(`/api/publishers/${publisherProfile?.id}/authors/${authorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove author");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogue/publisher/authors"] });
      toast({
        title: "Author removed",
        description: "The author has been removed from your publisher profile",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove author",
        variant: "destructive",
      });
    },
  });

  const onSubmitAddAuthor = (data: z.infer<typeof addAuthorSchema>) => {
    addAuthorMutation.mutate(data);
  };

  const onSubmitUpdateProfile = (data: z.infer<typeof updatePublisherSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const handleRemoveAuthor = (authorId: number) => {
    if (confirm("Are you sure you want to remove this author?")) {
      removeAuthorMutation.mutate(authorId);
    }
  };

  // Calculate metrics for publisher dashboard
  const getTotalAuthors = () => authorsWithBooks?.length || 0;
  const getTotalBooks = () => 
    authorsWithBooks?.reduce((total, { books }) => total + books.length, 0) || 0;
  const getTotalImpressions = () => 
    authorsWithBooks?.reduce((total, { books }) => 
      total + books.reduce((sum, book) => sum + (book.impressionCount || 0), 0), 0) || 0;
  const getTotalClickThroughs = () => 
    authorsWithBooks?.reduce((total, { books }) => 
      total + books.reduce((sum, book) => sum + (book.clickThroughCount || 0), 0), 0) || 0;
  const getConversionRate = () => {
    const impressions = getTotalImpressions();
    const clicks = getTotalClickThroughs();
    return impressions ? (clicks / impressions * 100).toFixed(2) : "0.00";
  };

  // Calculate metrics for each author
  const getAuthorMetrics = (books: Book[]) => {
    const totalImpressions = books.reduce((sum, book) => sum + (book.impressionCount || 0), 0);
    const totalClickThroughs = books.reduce((sum, book) => sum + (book.clickThroughCount || 0), 0);
    const conversionRate = totalImpressions ? (totalClickThroughs / totalImpressions * 100) : 0;
    
    return {
      totalImpressions,
      totalClickThroughs,
      conversionRate,
    };
  };

  if (loadingProfile) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <div>Loading publisher profile...</div>
      </div>
    );
  }

  if (!publisherProfile) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Publisher Access Required</CardTitle>
            <CardDescription>
              You need to have a publisher account to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              If you believe this is an error, please contact support or check your account settings.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.href = "/settings"}>
              Go to Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{publisherProfile.publisher_name} Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your authors, books, and publishing metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditProfileDialog(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button onClick={() => setShowAddAuthorDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Author
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authors">Authors</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Authors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalAuthors()}</div>
                <p className="text-xs text-muted-foreground">
                  Authors under your management
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalBooks()}</div>
                <p className="text-xs text-muted-foreground">
                  Books published by your authors
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalImpressions().toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Book views across all platforms
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getConversionRate()}%</div>
                <p className="text-xs text-muted-foreground">
                  Click-through rate on impressions
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Publisher Information</CardTitle>
                <CardDescription>Details about your publishing house</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium">Description</div>
                    <p className="text-sm text-muted-foreground">
                      {publisherProfile.publisher_description || "No description provided."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">Business Email</div>
                      <p className="text-sm text-muted-foreground">
                        {publisherProfile.business_email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">Business Phone</div>
                      <p className="text-sm text-muted-foreground">
                        {publisherProfile.business_phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">Business Address</div>
                      <p className="text-sm text-muted-foreground">
                        {publisherProfile.business_address || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">Website</div>
                      <p className="text-sm text-muted-foreground">
                        {publisherProfile.website ? (
                          <a 
                            href={publisherProfile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {publisherProfile.website}
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => setShowEditProfileDialog(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>
          </div>

          {loadingAuthors ? (
            <div className="py-6 text-center">Loading authors data...</div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
                <CardDescription>Top performing authors and books</CardDescription>
              </CardHeader>
              <CardContent>
                {authorsWithBooks && authorsWithBooks.length > 0 ? (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Top Authors by Impressions</h3>
                      <div className="space-y-4">
                        {authorsWithBooks
                          .map(({ author, books }) => ({
                            author,
                            metrics: getAuthorMetrics(books)
                          }))
                          .sort((a, b) => b.metrics.totalImpressions - a.metrics.totalImpressions)
                          .slice(0, 3)
                          .map(({ author, metrics }) => (
                            <div key={author.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                {author.author_image_url ? (
                                  <img 
                                    src={author.author_image_url} 
                                    alt={author.author_name} 
                                    className="h-10 w-10 rounded-full mr-3"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{author.author_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {metrics.totalImpressions.toLocaleString()} impressions
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {metrics.conversionRate.toFixed(2)}% conversion rate
                              </Badge>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Top Books by Click-Through Rate</h3>
                      <div className="space-y-4">
                        {authorsWithBooks
                          .flatMap(({ books, author }) => 
                            books.map(book => ({ ...book, authorName: author.author_name }))
                          )
                          .filter(book => book.impressionCount > 0)
                          .sort((a, b) => 
                            (b.clickThroughCount / b.impressionCount) - 
                            (a.clickThroughCount / a.impressionCount)
                          )
                          .slice(0, 3)
                          .map(book => (
                            <div key={book.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                {book.images?.find(img => img.imageType === "mini")?.imageUrl ? (
                                  <img 
                                    src={book.images.find(img => img.imageType === "mini")?.imageUrl} 
                                    alt={book.title} 
                                    className="h-12 w-10 object-cover rounded mr-3"
                                  />
                                ) : (
                                  <div className="h-12 w-10 rounded bg-primary/10 flex items-center justify-center mr-3">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{book.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    by {book.authorName || "Unknown author"}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {book.impressionCount > 0 
                                  ? ((book.clickThroughCount / book.impressionCount) * 100).toFixed(2) 
                                  : "0.00"}% CTR
                              </Badge>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No data available</h3>
                    <p className="text-muted-foreground mb-4">
                      Add authors to your publisher profile to see performance metrics.
                    </p>
                    <Button onClick={() => setShowAddAuthorDialog(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Author
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Authors Tab */}
        <TabsContent value="authors">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manage Authors</CardTitle>
                  <CardDescription>
                    Add, remove, and manage authors published by your company
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddAuthorDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Author
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAuthors ? (
                <div className="py-6 text-center">Loading authors data...</div>
              ) : authorsWithBooks && authorsWithBooks.length > 0 ? (
                <div className="space-y-6">
                  {authorsWithBooks.map(({ author, books }) => {
                    const metrics = getAuthorMetrics(books);
                    return (
                      <Card key={author.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              {author.author_image_url ? (
                                <img 
                                  src={author.author_image_url} 
                                  alt={author.author_name} 
                                  className="h-12 w-12 rounded-full mr-4"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                                  <Users className="h-6 w-6 text-primary" />
                                </div>
                              )}
                              <div>
                                <CardTitle>{author.author_name}</CardTitle>
                                <CardDescription>
                                  {books.length} book{books.length !== 1 ? 's' : ''}
                                </CardDescription>
                              </div>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRemoveAuthor(author.id)}
                            >
                              <X className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">
                                Total Impressions
                              </div>
                              <div className="text-xl font-bold">
                                {metrics.totalImpressions.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">
                                Click-throughs
                              </div>
                              <div className="text-xl font-bold">
                                {metrics.totalClickThroughs.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">
                                Conversion Rate
                              </div>
                              <div className="text-xl font-bold">
                                {metrics.conversionRate.toFixed(2)}%
                              </div>
                            </div>
                          </div>

                          {books.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Books</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {books.map(book => (
                                  <div 
                                    key={book.id} 
                                    className="border rounded p-3 flex items-center"
                                  >
                                    {book.images?.find(img => img.imageType === "mini")?.imageUrl ? (
                                      <img 
                                        src={book.images.find(img => img.imageType === "mini")?.imageUrl} 
                                        alt={book.title} 
                                        className="h-12 w-10 object-cover rounded mr-3"
                                      />
                                    ) : (
                                      <div className="h-12 w-10 rounded bg-primary/10 flex items-center justify-center mr-3">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                      </div>
                                    )}
                                    <div className="overflow-hidden">
                                      <div className="font-medium truncate" title={book.title}>
                                        {book.title}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {book.impressionCount.toLocaleString()} views
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No authors found</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't added any authors to your publisher profile yet.
                  </p>
                  <Button onClick={() => setShowAddAuthorDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Author
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Books Tab */}
        <TabsContent value="books">
          <Card>
            <CardHeader>
              <CardTitle>All Books</CardTitle>
              <CardDescription>
                Books published by your authors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAuthors ? (
                <div className="py-6 text-center">Loading book data...</div>
              ) : (
                <Table>
                  <TableCaption>
                    All books from your publisher's authors
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Click-throughs</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authorsWithBooks?.flatMap(({ books, author }) => 
                      books.map(book => ({ ...book, authorName: author.author_name }))
                    ).sort((a, b) => b.impressionCount - a.impressionCount)
                    .map(book => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {book.images?.find(img => img.imageType === "mini")?.imageUrl ? (
                              <img 
                                src={book.images.find(img => img.imageType === "mini")?.imageUrl} 
                                alt={book.title} 
                                className="h-10 w-8 object-cover rounded mr-3"
                              />
                            ) : (
                              <div className="h-10 w-8 rounded bg-primary/10 flex items-center justify-center mr-3">
                                <BookOpen className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <span className="truncate max-w-[200px]" title={book.title}>
                              {book.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{book.authorName}</TableCell>
                        <TableCell>{new Date(book.publishedDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{book.impressionCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{book.clickThroughCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {book.impressionCount > 0 
                            ? ((book.clickThroughCount / book.impressionCount) * 100).toFixed(2) 
                            : "0.00"}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Publishing Analytics</CardTitle>
                <CardDescription>
                  Performance metrics for your publishing company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Performance Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Impressions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {getTotalImpressions().toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Across all books and authors
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Click-throughs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {getTotalClickThroughs().toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Across all books and authors
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Average Conversion Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {getConversionRate()}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Click-through rate on impressions
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Author Rankings</h3>
                    <Table>
                      <TableCaption>
                        Authors ranked by engagement metrics
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Books</TableHead>
                          <TableHead className="text-right">Impressions</TableHead>
                          <TableHead className="text-right">Click-throughs</TableHead>
                          <TableHead className="text-right">Conversion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {authorsWithBooks?.map(({ author, books }, index) => {
                          const metrics = getAuthorMetrics(books);
                          return (
                            <TableRow key={author.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{author.author_name}</TableCell>
                              <TableCell>{books.length}</TableCell>
                              <TableCell className="text-right">{metrics.totalImpressions.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{metrics.totalClickThroughs.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{metrics.conversionRate.toFixed(2)}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Author Dialog */}
      <Dialog open={showAddAuthorDialog} onOpenChange={setShowAddAuthorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Author to Publisher</DialogTitle>
            <DialogDescription>
              Add an author to your publisher's roster
            </DialogDescription>
          </DialogHeader>

          <Form {...addAuthorForm}>
            <form onSubmit={addAuthorForm.handleSubmit(onSubmitAddAuthor)} className="space-y-4">
              <FormField
                control={addAuthorForm.control}
                name="author_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value || ""}
                      >
                        <option value="" disabled>Select an author</option>
                        {availableAuthors?.map((author: Author) => (
                          <option key={author.id} value={author.id}>
                            {author.author_name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addAuthorForm.control}
                name="contract_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddAuthorDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addAuthorMutation.isPending}>
                  {addAuthorMutation.isPending ? "Adding..." : "Add Author"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Publisher Profile</DialogTitle>
            <DialogDescription>
              Update your publisher details
            </DialogDescription>
          </DialogHeader>

          <Form {...updateProfileForm}>
            <form onSubmit={updateProfileForm.handleSubmit(onSubmitUpdateProfile)} className="space-y-4">
              <FormField
                control={updateProfileForm.control}
                name="publisher_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publisher Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateProfileForm.control}
                name="publisher_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateProfileForm.control}
                name="business_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateProfileForm.control}
                name="business_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateProfileForm.control}
                name="business_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateProfileForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditProfileDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}