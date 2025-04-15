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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertTriangle,
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
  };
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
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
});

export default function PublisherDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddAuthorDialog, setShowAddAuthorDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  // Define publisher status data interface
  interface PublisherStatusData {
    isPublisher: boolean;
    publisherDetails: {
      id: number;
      userId: number;
      publisher_name: string;
      publisher_description?: string;
      business_email?: string;
      business_phone?: string;
      business_address?: string;
      website?: string;
      logo_url?: string;
      createdAt: string;
    } | null;
  }

  // Define publisher profile interface
  interface PublisherProfile {
    id: number;
    userId: number;
    publisher_name: string;
    publisher_description?: string;
    business_email?: string;
    business_phone?: string;
    business_address?: string;
    website?: string;
    logo_url?: string;
    createdAt: string;
  }

  // Fetch publisher profile
  const { data: publisherData, isLoading: loadingPublisher } =
    useQuery<PublisherStatusData>({
      queryKey: ["/api/publisher-status"],
      queryFn: () =>
        fetch("/api/publisher-status").then((res) => res.json()),
    });

  // Only fetch publisher profile if user is a publisher
  const { data: publisherProfile, isLoading: loadingProfile } =
    useQuery<PublisherProfile>({
      queryKey: ["/api/publisher-profile"],
      enabled: !!publisherData?.isPublisher,
      queryFn: () =>
        fetch("/api/publisher-profile").then((res) => res.json()),
    });

  // Fetch publisher authors with their books
  const { data: authorsWithBooks, isLoading: loadingAuthors } = useQuery<
    AuthorWithBooks[]
  >({
    queryKey: ["/api/catalogue/publisher/authors"],
    enabled: !!publisherProfile,
    queryFn: () =>
      fetch("/api/catalogue/publisher/authors").then((res) => res.json()),
  });

  // Fetch all authors for adding to publisher
  const { data: availableAuthors, isLoading: loadingAvailableAuthors } =
    useQuery<Author[]>({
      queryKey: ["/api/catalogue/authors/available"],
      enabled: showAddAuthorDialog,
      queryFn: () =>
        fetch("/api/catalogue/authors/available").then((res) => res.json()),
    });

  // Form for adding an author
  const addAuthorForm = useForm<z.infer<typeof addAuthorSchema>>({
    resolver: zodResolver(addAuthorSchema),
    defaultValues: {
      contract_start: new Date().toISOString().split("T")[0],
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
      const response = await fetch(
        `/api/publishers/${profile.id}/authors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add author");
      }

      return response.json();
    },
    onSuccess: () => {
      setShowAddAuthorDialog(false);
      addAuthorForm.reset();
      queryClient.invalidateQueries({
        queryKey: ["/api/catalogue/publisher/authors"],
      });
      toast({
        title: "Author added",
        description: "The author has been added to your publisher profile",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add author",
        variant: "destructive",
      });
    },
  });

  // Update publisher profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updatePublisherSchema>) => {
      const response = await fetch(`/api/publishers/${profile.id}`, {
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
      queryClient.invalidateQueries({
        queryKey: ["/api/publisher-profile"],
      });
      toast({
        title: "Profile updated",
        description: "Your publisher profile has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Remove author mutation
  const removeAuthorMutation = useMutation({
    mutationFn: async (authorId: number) => {
      const response = await fetch(
        `/api/publishers/${profile.id}/authors/${authorId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove author");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/catalogue/publisher/authors"],
      });
      toast({
        title: "Author removed",
        description: "The author has been removed from your publisher profile",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove author",
        variant: "destructive",
      });
    },
  });

  const onSubmitAddAuthor = (data: z.infer<typeof addAuthorSchema>) => {
    addAuthorMutation.mutate(data);
  };

  const onSubmitUpdateProfile = (
    data: z.infer<typeof updatePublisherSchema>,
  ) => {
    updateProfileMutation.mutate(data);
  };

  const handleRemoveAuthor = (authorId: number) => {
    if (confirm("Are you sure you want to remove this author?")) {
      removeAuthorMutation.mutate(authorId);
    }
  };

  // Calculate metrics for publisher dashboard
  const getTotalAuthors = (): number => authorsWithBooks?.length || 0;

  const getTotalBooks = (): number =>
    authorsWithBooks?.reduce(
      (total: number, { books }: AuthorWithBooks) => total + books.length,
      0,
    ) || 0;

  const getTotalImpressions = (): number =>
    authorsWithBooks?.reduce(
      (total: number, { books }: AuthorWithBooks) =>
        total +
        books.reduce(
          (sum: number, book: Book) => sum + (book.impressionCount || 0),
          0,
        ),
      0,
    ) || 0;

  const getTotalClickThroughs = (): number =>
    authorsWithBooks?.reduce(
      (total: number, { books }: AuthorWithBooks) =>
        total +
        books.reduce(
          (sum: number, book: Book) => sum + (book.clickThroughCount || 0),
          0,
        ),
      0,
    ) || 0;

  const getConversionRate = (): string => {
    const impressions = getTotalImpressions();
    const clicks = getTotalClickThroughs();
    return impressions ? ((clicks / impressions) * 100).toFixed(2) : "0.00";
  };

  // Calculate metrics for each author
  const getAuthorMetrics = (books: Book[]) => {
    const totalImpressions = books.reduce(
      (sum, book) => sum + (book.impressionCount || 0),
      0,
    );
    const totalClickThroughs = books.reduce(
      (sum, book) => sum + (book.clickThroughCount || 0),
      0,
    );
    const conversionRate = totalImpressions
      ? (totalClickThroughs / totalImpressions) * 100
      : 0;

    return {
      totalImpressions,
      totalClickThroughs,
      conversionRate,
    };
  };

  // Check if we're still loading basic info
  if (loadingPublisher) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <div>Loading publisher information...</div>
      </div>
    );
  }

  // Check if user is a publisher
  if (!publisherData?.isPublisher) {
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
            <div className="flex gap-2 items-center text-amber-500 mb-4">
              <AlertTriangle size={20} />
              <p>You don't have publisher privileges.</p>
            </div>
            <p>
              If you believe this is an error, please contact support or check
              your account settings.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/settings")}
            >
              Go to Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check if we're still loading publisher profile
  if (loadingProfile) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <div>Loading publisher profile...</div>
      </div>
    );
  }

  // Since we check loadingProfile before rendering, we know publisherProfile is defined here
  // but TypeScript doesn't know that, so we'll add a check to satisfy TypeScript
  const profile = publisherProfile as PublisherProfile;

  // We have verified publisher profile is loaded
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {profile.publisher_name} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your authors, books, and publishing metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEditProfileDialog(true)}
          >
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
                <CardTitle className="text-sm font-medium">
                  Total Authors
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Total Books
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Total Impressions
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getTotalImpressions().toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Book views across all platforms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
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
                <CardDescription>
                  Details about your publishing house
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium">Description</div>
                    <p className="text-sm text-muted-foreground">
                      {profile.publisher_description ||
                        "No description provided."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">Business Email</div>
                      <p className="text-sm text-muted-foreground">
                        {profile.business_email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">Business Phone</div>
                      <p className="text-sm text-muted-foreground">
                        {profile.business_phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">Business Address</div>
                      <p className="text-sm text-muted-foreground">
                        {profile.business_address || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <div className="font-medium">Website</div>
                      <p className="text-sm text-muted-foreground">
                        {profile.website ? (
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {profile.website}
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {loadingAuthors ? (
            <div className="flex justify-center p-4">
              <p>Loading author data...</p>
            </div>
          ) : authorsWithBooks?.length ? (
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Author Activity</CardTitle>
                  <CardDescription>
                    Performance of your top authors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Author</TableHead>
                        <TableHead>Books</TableHead>
                        <TableHead>Impressions</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Conversion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {authorsWithBooks.slice(0, 5).map(({ author, books }) => {
                        const metrics = getAuthorMetrics(books);
                        return (
                          <TableRow key={author.id}>
                            <TableCell className="font-medium">
                              {author.author_name}
                            </TableCell>
                            <TableCell>{books.length}</TableCell>
                            <TableCell>
                              {metrics.totalImpressions.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {metrics.totalClickThroughs.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {metrics.conversionRate.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("authors")}
                  >
                    View All Authors
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Authors Yet</CardTitle>
                <CardDescription>
                  Add authors to your publisher profile to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Start Building Your Team
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add authors to your publisher profile to start managing
                    their books and tracking analytics.
                  </p>
                  <Button onClick={() => setShowAddAuthorDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Your First Author
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Authors Tab */}
        <TabsContent value="authors">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Managed Authors</h2>
            <Button onClick={() => setShowAddAuthorDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Author
            </Button>
          </div>

          {loadingAuthors ? (
            <div className="flex justify-center p-8">
              <p>Loading authors...</p>
            </div>
          ) : authorsWithBooks?.length ? (
            <div className="grid grid-cols-1 gap-4">
              {authorsWithBooks.map(({ author, books }) => {
                const metrics = getAuthorMetrics(books);
                return (
                  <Card key={author.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 items-center">
                          {author.author_image_url ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden">
                              <img
                                src={author.author_image_url}
                                alt={author.author_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <CardTitle>{author.author_name}</CardTitle>
                            <CardDescription>
                              {books.length}{" "}
                              {books.length === 1 ? "book" : "books"} published
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAuthor(author.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">
                            Impressions
                          </span>
                          <span className="text-lg font-bold">
                            {metrics.totalImpressions.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">
                            Clicks
                          </span>
                          <span className="text-lg font-bold">
                            {metrics.totalClickThroughs.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">
                            Conversion Rate
                          </span>
                          <span className="text-lg font-bold">
                            {metrics.conversionRate.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {books.length > 0 ? (
                        <div>
                          <h4 className="font-medium mb-2">Books:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {books.map((book) => (
                              <div
                                key={book.id}
                                className="p-2 border rounded-md"
                              >
                                <div className="font-medium">{book.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  Published:{" "}
                                  {new Date(
                                    book.publishedDate,
                                  ).toLocaleDateString()}
                                </div>
                                <div className="text-xs">
                                  {book.formats.map((format) => (
                                    <Badge
                                      key={format}
                                      variant="outline"
                                      className="mr-1 mt-1"
                                    >
                                      {format}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">
                            No books published yet
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Authors Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't added any authors to your publisher profile yet.
                </p>
                <Button onClick={() => setShowAddAuthorDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Your First Author
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Books Tab */}
        <TabsContent value="books">
          <h2 className="text-2xl font-bold mb-4">Published Books</h2>

          {loadingAuthors ? (
            <div className="flex justify-center p-8">
              <p>Loading books...</p>
            </div>
          ) : authorsWithBooks?.length ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {authorsWithBooks.flatMap(({ author, books }) =>
                  books.map((book) => (
                    <Card key={book.id}>
                      <div className="relative">
                        {book.images?.find(
                          (img) => img.imageType === "book-card",
                        ) ? (
                          <img
                            src={
                              book.images.find(
                                (img) => img.imageType === "book-card",
                              )?.imageUrl
                            }
                            alt={book.title}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle className="line-clamp-1">
                          {book.title}
                        </CardTitle>
                        <CardDescription>
                          By {author.author_name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {book.description}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Published:{" "}
                            </span>
                            {new Date(book.publishedDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Pages:{" "}
                            </span>
                            {book.pageCount}
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Impressions:{" "}
                            </span>
                            {book.impressionCount.toLocaleString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Clicks:{" "}
                            </span>
                            {book.clickThroughCount.toLocaleString()}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex gap-1 flex-wrap">
                          {book.formats.map((format) => (
                            <Badge
                              key={format}
                              variant="outline"
                              className="mr-1"
                            >
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </CardFooter>
                    </Card>
                  )),
                )}
              </div>

              {!authorsWithBooks.flatMap(({ books }) => books).length && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Books Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      None of your authors have published any books yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Books Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add authors to your publisher profile to manage their books.
                </p>
                <Button onClick={() => setShowAddAuthorDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add an Author
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <h2 className="text-2xl font-bold mb-4">Publishing Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Impression Overview</CardTitle>
                <CardDescription>Total impressions by author</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                {loadingAuthors ? (
                  <p>Loading analytics data...</p>
                ) : authorsWithBooks?.length ? (
                  <div className="w-full h-full">
                    {/* Placeholder for chart - would use Recharts in real implementation */}
                    <div className="bg-muted rounded-md h-full w-full flex items-center justify-center">
                      <BarChart className="h-16 w-16 text-muted-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      No data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Trends</CardTitle>
                <CardDescription>Click-through rate over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                {loadingAuthors ? (
                  <p>Loading analytics data...</p>
                ) : authorsWithBooks?.length ? (
                  <div className="w-full h-full">
                    {/* Placeholder for chart - would use Recharts in real implementation */}
                    <div className="bg-muted rounded-md h-full w-full flex items-center justify-center">
                      <LineChart className="h-16 w-16 text-muted-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      No data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance by Author</CardTitle>
              <CardDescription>
                Detailed metrics for each author
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAuthors ? (
                <div className="flex justify-center p-4">
                  <p>Loading performance data...</p>
                </div>
              ) : authorsWithBooks?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Author</TableHead>
                      <TableHead>Books</TableHead>
                      <TableHead>Total Impressions</TableHead>
                      <TableHead>Total Clicks</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Avg. Impressions per Book</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authorsWithBooks.map(({ author, books }) => {
                      const metrics = getAuthorMetrics(books);
                      const avgImpressions = books.length
                        ? (metrics.totalImpressions / books.length).toFixed(0)
                        : "0";

                      return (
                        <TableRow key={author.id}>
                          <TableCell className="font-medium">
                            {author.author_name}
                          </TableCell>
                          <TableCell>{books.length}</TableCell>
                          <TableCell>
                            {metrics.totalImpressions.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {metrics.totalClickThroughs.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {metrics.conversionRate.toFixed(2)}%
                          </TableCell>
                          <TableCell>{avgImpressions}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">
                    No authors added yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Author Dialog */}
      <Dialog open={showAddAuthorDialog} onOpenChange={setShowAddAuthorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Author to Publisher</DialogTitle>
            <DialogDescription>
              Add an existing author to your publisher profile.
            </DialogDescription>
          </DialogHeader>

          <Form {...addAuthorForm}>
            <form
              onSubmit={addAuthorForm.handleSubmit(onSubmitAddAuthor)}
              className="space-y-4"
            >
              <FormField
                control={addAuthorForm.control}
                name="author_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={loadingAvailableAuthors}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      >
                        <option value="">Select an author</option>
                        {availableAuthors?.map((author) => (
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddAuthorDialog(false)}
                >
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
      <Dialog
        open={showEditProfileDialog}
        onOpenChange={setShowEditProfileDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Publisher Profile</DialogTitle>
            <DialogDescription>
              Update your publisher information.
            </DialogDescription>
          </DialogHeader>

          <Form {...updateProfileForm}>
            <form
              onSubmit={updateProfileForm.handleSubmit(onSubmitUpdateProfile)}
              className="space-y-4"
            >
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
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Describe your publishing house"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={updateProfileForm.control}
                  name="business_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          type="email"
                          placeholder="contact@publisher.com"
                        />
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
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="(123) 456-7890"
                        />
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
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="123 Publishing St, City"
                        />
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
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="https://publisher.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditProfileDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
