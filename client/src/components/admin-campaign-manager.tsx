import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarIcon, Plus, Edit2, BarChart2, BookCopy, Filter, Search, X, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define campaign creation schema
const campaignSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  type: z.enum(["ad", "promotion", "survey", "review_boost"]),
  status: z.enum(["active", "paused", "completed"]),
  startDate: z.date(),
  endDate: z.date(),
  budget: z.string().optional(),
  books: z.array(z.number()).min(1, "Select at least one book"),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

// Campaign status badge component
function CampaignStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500">Active</Badge>;
    case "paused":
      return <Badge className="bg-yellow-500">Paused</Badge>;
    case "completed":
      return <Badge className="bg-gray-500">Completed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

// Format date function
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy");
}

// Main component
export function AdminCampaignManager() {
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaignDetailsOpen, setCampaignDetailsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up form for campaign creation
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      type: "promotion",
      status: "active",
      budget: "0",
      books: [],
    },
  });

  // Query to fetch all campaigns for admin view
  const { 
    data: campaigns, 
    isLoading: loadingCampaigns 
  } = useQuery({
    queryKey: ['/api/admin/campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/admin/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    }
  });

  // Query to fetch all books for campaign creation
  const { 
    data: books, 
    isLoading: loadingBooks 
  } = useQuery({
    queryKey: ['/api/admin/campaigns/books/list'],
    queryFn: async () => {
      const res = await fetch('/api/admin/campaigns/books/list');
      if (!res.ok) throw new Error('Failed to fetch books');
      return res.json();
    }
  });

  // Mutation to create a new campaign
  const createCampaign = useMutation({
    mutationFn: async (formData: CampaignFormValues) => {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Campaign created",
        description: "The campaign has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating campaign",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to update campaign status
  const updateCampaignStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(`/api/admin/campaigns/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update campaign status');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      toast({
        title: "Status updated",
        description: "The campaign status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: CampaignFormValues) => {
    createCampaign.mutate(values);
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns?.filter((campaign: any) => {
    let matchesSearch = true;
    let matchesFilter = true;
    
    // Apply search query filter if set
    if (searchQuery) {
      matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    // Apply status filter if set
    if (filterStatus) {
      matchesFilter = campaign.status === filterStatus;
    }
    
    return matchesSearch && matchesFilter;
  });

  // View campaign details
  const viewCampaignDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setCampaignDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Management</h1>
          <p className="text-muted-foreground">
            Create and manage promotional campaigns across the platform
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new promotional campaign to highlight books across the platform
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter campaign name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campaign type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="promotion">Promotion</SelectItem>
                            <SelectItem value="ad">Advertisement</SelectItem>
                            <SelectItem value="survey">Survey</SelectItem>
                            <SelectItem value="review_boost">Review Boost</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Budget for this campaign (in credits)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="books"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Books</FormLabel>
                      <div className="border rounded-md p-4 space-y-3 max-h-[200px] overflow-y-auto">
                        {loadingBooks ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : books?.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">No books available</p>
                        ) : (
                          books?.map((book: any) => (
                            <div key={book.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`book-${book.id}`} 
                                checked={field.value?.includes(book.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, book.id]);
                                  } else {
                                    field.onChange(
                                      field.value?.filter((id) => id !== book.id)
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`book-${book.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {book.title}
                                {book.authorName && <span className="text-muted-foreground ml-1">by {book.authorName}</span>}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit"
                    disabled={createCampaign.isPending}
                  >
                    {createCampaign.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Campaign
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <X
              className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer"
              onClick={() => setSearchQuery("")}
            />
          )}
        </div>
        
        <Select
          value={filterStatus || ""}
          onValueChange={(value) => setFilterStatus(value || null)}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            Manage promotional campaigns across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCampaigns ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : campaigns?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No campaigns found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create your first campaign
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Books</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No campaigns match your filter criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCampaigns?.map((campaign: any) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {campaign.type === "ad" ? "Advertisement" : 
                             campaign.type === "promotion" ? "Promotion" :
                             campaign.type === "survey" ? "Survey" :
                             campaign.type === "review_boost" ? "Review Boost" :
                             campaign.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <CampaignStatusBadge status={campaign.status} />
                        </TableCell>
                        <TableCell>{formatDate(campaign.startDate)}</TableCell>
                        <TableCell>{formatDate(campaign.endDate)}</TableCell>
                        <TableCell>{campaign.books?.length || 0} books</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewCampaignDetails(campaign)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Details Sheet */}
      <Sheet open={campaignDetailsOpen} onOpenChange={setCampaignDetailsOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          {selectedCampaign && (
            <>
              <SheetHeader>
                <SheetTitle>Campaign Details</SheetTitle>
                <SheetDescription>
                  View and manage campaign information
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-6">
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="books">Books</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                        <p className="text-base">{selectedCampaign.name}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                        <p className="text-base">
                          {selectedCampaign.type === "ad" ? "Advertisement" : 
                           selectedCampaign.type === "promotion" ? "Promotion" :
                           selectedCampaign.type === "survey" ? "Survey" :
                           selectedCampaign.type === "review_boost" ? "Review Boost" :
                           selectedCampaign.type}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                        <div className="mt-1">
                          <CampaignStatusBadge status={selectedCampaign.status} />
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Budget</h4>
                        <p className="text-base">{selectedCampaign.budget || "0"} credits</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Start Date</h4>
                        <p className="text-base">{formatDate(selectedCampaign.startDate)}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">End Date</h4>
                        <p className="text-base">{formatDate(selectedCampaign.endDate)}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-3">Update Status</h4>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={selectedCampaign.status === "active" ? "default" : "outline"}
                          onClick={() => updateCampaignStatus.mutate({ 
                            id: selectedCampaign.id, 
                            status: "active" 
                          })}
                          disabled={selectedCampaign.status === "active" || updateCampaignStatus.isPending}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Active
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedCampaign.status === "paused" ? "default" : "outline"}
                          onClick={() => updateCampaignStatus.mutate({ 
                            id: selectedCampaign.id, 
                            status: "paused" 
                          })}
                          disabled={selectedCampaign.status === "paused" || updateCampaignStatus.isPending}
                        >
                          <AlertCircle className="mr-1 h-4 w-4" />
                          Paused
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedCampaign.status === "completed" ? "default" : "outline"}
                          onClick={() => updateCampaignStatus.mutate({ 
                            id: selectedCampaign.id, 
                            status: "completed" 
                          })}
                          disabled={selectedCampaign.status === "completed" || updateCampaignStatus.isPending}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Completed
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="books" className="mt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book Title</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCampaign.books?.length === 0 ? (
                            <TableRow>
                              <TableCell className="h-24 text-center">
                                No books in this campaign
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedCampaign.books?.map((book: any) => (
                              <TableRow key={book.id}>
                                <TableCell>{book.title}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="metrics" className="mt-4">
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Campaign Metrics</h3>
                      <p className="text-muted-foreground mb-6">
                        Detailed metrics for this campaign will be shown here. 
                        This feature is still in development.
                      </p>
                      
                      <div className="w-full grid grid-cols-2 gap-4">
                        <div className="border rounded-md p-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Impressions</h4>
                          <p className="text-2xl font-bold">
                            {selectedCampaign.metrics?.totalImpressions || 0}
                          </p>
                        </div>
                        
                        <div className="border rounded-md p-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Clicks</h4>
                          <p className="text-2xl font-bold">
                            {selectedCampaign.metrics?.totalClicks || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}