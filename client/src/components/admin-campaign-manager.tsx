import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  CalendarIcon, 
  Plus, 
  Loader2, 
  PenSquare, 
  PlayCircle, 
  PauseCircle,
  CheckCircle,
  ChevronDown, 
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

// Define the campaign types
const campaignTypeLabels = {
  ad: "Advertisement",
  survey: "Reader Survey",
  review_boost: "Review Boost",
};

// Define Book type
type Book = {
  id: number;
  title: string;
  authorId: number;
  authorName?: string;
};

// Define Campaign Type
type Campaign = {
  id: number;
  name: string;
  type: "ad" | "survey" | "review_boost";
  status: "active" | "completed" | "paused";
  startDate: string;
  endDate: string;
  spent: string;
  budget: string;
  keywords?: string[];
  adType?: "banner" | "feature" | "keyword";
  authorId: number;
  metrics?: {
    impressions?: number;
    clicks?: number;
    responses?: number;
    reviews?: number;
  };
  createdAt: string;
  books?: Book[];
};

// New Campaign Form type
type NewCampaignForm = {
  name: string;
  type: "ad" | "survey" | "review_boost";
  status: "active" | "paused";
  startDate: Date;
  endDate: Date;
  budget: string;
  adType?: "banner" | "feature" | "keyword";
  books: number[];
  keywords?: string[];
  authorId?: number; // For admin campaigns this might be optional or a system ID
};

export function AdminCampaignManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState<NewCampaignForm>({
    name: "",
    type: "ad",
    status: "active",
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Default to 30 days
    budget: "100",
    books: [],
    keywords: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCardIds, setExpandedCardIds] = useState<Record<number, boolean>>({});
  
  // Fetch all campaigns (admin view)
  const { data: campaigns, isLoading: loadingCampaigns } = useQuery<Campaign[]>({
    queryKey: ['/api/admin/campaigns'],
  });
  
  // Fetch all books for selection
  const { data: allBooks, isLoading: loadingBooks } = useQuery<Book[]>({
    queryKey: ['/api/admin/books/list'],
  });
  
  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: (campaignData: NewCampaignForm) => 
      apiRequest('/api/admin/campaigns', 'POST', campaignData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      setIsCreatingCampaign(false);
      toast({
        title: "Campaign created",
        description: "The campaign has been created successfully.",
      });
      // Reset form
      setNewCampaign({
        name: "",
        type: "ad",
        status: "active",
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        budget: "100",
        books: [],
        keywords: [],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating campaign",
        description: error.message || "There was an error creating the campaign.",
        variant: "destructive",
      });
    }
  });
  
  // Update campaign status mutation
  const updateCampaignStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "paused" | "completed" }) => 
      apiRequest(`/api/admin/campaigns/${id}/status`, 'PATCH', { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      toast({
        title: "Status updated",
        description: "The campaign status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message || "There was an error updating the campaign status.",
        variant: "destructive",
      });
    }
  });
  
  // Handle campaign form submission
  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.books.length) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select at least one book.",
        variant: "destructive",
      });
      return;
    }
    
    createCampaign.mutate(newCampaign);
  };
  
  // Toggle book selection
  const toggleBookSelection = (bookId: number) => {
    setNewCampaign(prev => {
      const bookIndex = prev.books.indexOf(bookId);
      if (bookIndex > -1) {
        // Remove book if already selected
        return {
          ...prev,
          books: prev.books.filter(id => id !== bookId)
        };
      } else {
        // Add book if not selected
        return {
          ...prev,
          books: [...prev.books, bookId]
        };
      }
    });
  };
  
  // Toggle card expansion
  const toggleCardExpansion = (campaignId: number) => {
    setExpandedCardIds(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };
  
  // Filter campaigns by search term
  const filteredCampaigns = campaigns?.filter(campaign => 
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.books && campaign.books.some(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );
  
  // Filter books by search in creation form
  const filteredBooks = allBooks?.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.authorName && book.authorName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loadingCampaigns || loadingBooks) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Mobile campaign card view
  const campaignCards = (
    <div className="space-y-4 md:hidden">
      {filteredCampaigns?.map((campaign) => (
        <Card key={campaign.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{campaign.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline">
                    {campaignTypeLabels[campaign.type as keyof typeof campaignTypeLabels]}
                    {campaign.type === "ad" && ` (${campaign.adType})`}
                  </Badge>
                  <Badge
                    variant={
                      campaign.status === "active"
                        ? "default"
                        : campaign.status === "completed"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <button 
                onClick={() => toggleCardExpansion(campaign.id)}
                className="p-2 rounded-full hover:bg-secondary"
              >
                {expandedCardIds[campaign.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {expandedCardIds[campaign.id] && (
              <div className="mt-4 space-y-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium">Timeline</div>
                  <div className="text-sm mt-1">
                    <div>
                      Started: {format(new Date(campaign.startDate), 'MMM d, yyyy')}
                    </div>
                    <div className="text-muted-foreground">
                      Ends: {format(new Date(campaign.endDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Books</div>
                  <div className="space-y-1 mt-1">
                    {campaign.books?.map((book) => (
                      <div key={book.id} className="text-sm">
                        {book.title}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Budget</div>
                  <div className="space-y-1 mt-1">
                    <div className="text-sm">
                      ${Number(campaign.spent).toFixed(2)} spent of ${Number(campaign.budget).toFixed(2)}
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(Number(campaign.spent) / Number(campaign.budget)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Performance</div>
                  <div className="space-y-1 text-sm mt-1">
                    {campaign.type === "ad" && campaign.metrics && (
                      <>
                        <div>{campaign.metrics.impressions || 0} impressions</div>
                        <div>{campaign.metrics.clicks || 0} clicks</div>
                        <div>
                          CTR:{" "}
                          {campaign.metrics.clicks && campaign.metrics.impressions
                            ? ((campaign.metrics.clicks / campaign.metrics.impressions) * 100).toFixed(1)
                            : 0}
                          %
                        </div>
                      </>
                    )}
                    {campaign.type === "survey" && campaign.metrics && (
                      <div>{campaign.metrics.responses || 0} responses</div>
                    )}
                    {campaign.type === "review_boost" && campaign.metrics && (
                      <div>{campaign.metrics.reviews || 0} new reviews</div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end pt-2">
                  {campaign.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCampaignStatus.mutate({ id: campaign.id, status: "paused" })}
                    >
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {campaign.status === "paused" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCampaignStatus.mutate({ id: campaign.id, status: "active" })}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                  {(campaign.status === "active" || campaign.status === "paused") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCampaignStatus.mutate({ id: campaign.id, status: "completed" })}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Desktop campaign table view
  const campaignTable = (
    <div className="rounded-md border hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timeline</TableHead>
            <TableHead>Books</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCampaigns?.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {campaignTypeLabels[campaign.type as keyof typeof campaignTypeLabels]}
                  {campaign.type === "ad" && ` (${campaign.adType})`}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    campaign.status === "active"
                      ? "default"
                      : campaign.status === "completed"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>
                    Started: {format(new Date(campaign.startDate), 'MMM d, yyyy')}
                  </div>
                  <div className="text-muted-foreground">
                    Ends: {format(new Date(campaign.endDate), 'MMM d, yyyy')}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm max-w-[200px] truncate">
                  {campaign.books?.map(book => book.title).join(", ")}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  ${Number(campaign.spent).toFixed(2)} of ${Number(campaign.budget).toFixed(2)}
                </div>
                <div className="h-2 w-full max-w-[100px] rounded-full bg-secondary mt-1">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(Number(campaign.spent) / Number(campaign.budget)) * 100}%`,
                    }}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  {campaign.type === "ad" && campaign.metrics && (
                    <>
                      <div>{campaign.metrics.impressions || 0} impressions</div>
                      <div>{campaign.metrics.clicks || 0} clicks</div>
                      <div>
                        CTR:{" "}
                        {campaign.metrics.clicks && campaign.metrics.impressions
                          ? ((campaign.metrics.clicks / campaign.metrics.impressions) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </>
                  )}
                  {campaign.type === "survey" && campaign.metrics && (
                    <div>{campaign.metrics.responses || 0} responses</div>
                  )}
                  {campaign.type === "review_boost" && campaign.metrics && (
                    <div>{campaign.metrics.reviews || 0} new reviews</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {campaign.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCampaignStatus.mutate({ id: campaign.id, status: "paused" })}
                    >
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {campaign.status === "paused" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCampaignStatus.mutate({ id: campaign.id, status: "active" })}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                  {(campaign.status === "active" || campaign.status === "paused") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCampaignStatus.mutate({ id: campaign.id, status: "completed" })}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns or books..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isCreatingCampaign} onOpenChange={setIsCreatingCampaign}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new promotional campaign across the platform
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Campaign Details</TabsTrigger>
                  <TabsTrigger value="books">Select Books</TabsTrigger>
                  <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Campaign Name</Label>
                      <Input 
                        id="name" 
                        placeholder="Enter campaign name" 
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Campaign Type</Label>
                        <Select 
                          value={newCampaign.type} 
                          onValueChange={(value: "ad" | "survey" | "review_boost") => 
                            setNewCampaign({...newCampaign, type: value})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ad">Advertisement</SelectItem>
                            <SelectItem value="survey">Reader Survey</SelectItem>
                            <SelectItem value="review_boost">Review Boost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {newCampaign.type === "ad" && (
                        <div className="space-y-2">
                          <Label htmlFor="adType">Ad Type</Label>
                          <Select 
                            value={newCampaign.adType} 
                            onValueChange={(value: "banner" | "feature" | "keyword") => 
                              setNewCampaign({...newCampaign, adType: value})
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select ad type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="banner">Banner</SelectItem>
                              <SelectItem value="feature">Featured</SelectItem>
                              <SelectItem value="keyword">Keyword</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newCampaign.startDate ? (
                                format(newCampaign.startDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newCampaign.startDate}
                              onSelect={(date) => date && setNewCampaign({...newCampaign, startDate: date})}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newCampaign.endDate ? (
                                format(newCampaign.endDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newCampaign.endDate}
                              onSelect={(date) => date && setNewCampaign({...newCampaign, endDate: date})}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget ($)</Label>
                      <Input 
                        id="budget" 
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter budget amount" 
                        value={newCampaign.budget}
                        onChange={(e) => setNewCampaign({...newCampaign, budget: e.target.value})}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="books" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search books..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      Selected books: {newCampaign.books.length}
                    </div>
                    
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <div className="space-y-2">
                        {filteredBooks?.map((book) => (
                          <div
                            key={book.id}
                            className="flex items-center space-x-2 p-2 hover:bg-secondary/50 rounded-md"
                          >
                            <Checkbox
                              id={`book-${book.id}`}
                              checked={newCampaign.books.includes(book.id)}
                              onCheckedChange={() => toggleBookSelection(book.id)}
                            />
                            <Label
                              htmlFor={`book-${book.id}`}
                              className="flex-grow cursor-pointer"
                            >
                              {book.title}
                              {book.authorName && (
                                <span className="text-sm text-muted-foreground block">
                                  by {book.authorName}
                                </span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Initial Status</Label>
                      <Select 
                        value={newCampaign.status} 
                        onValueChange={(value: "active" | "paused") => 
                          setNewCampaign({...newCampaign, status: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newCampaign.type === "ad" && newCampaign.adType === "keyword" && (
                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords (comma separated)</Label>
                        <Textarea 
                          id="keywords" 
                          placeholder="Enter keywords separated by commas"
                          value={newCampaign.keywords?.join(", ") || ""}
                          onChange={(e) => {
                            const keywords = e.target.value
                              .split(",")
                              .map(keyword => keyword.trim())
                              .filter(keyword => keyword.length > 0);
                            setNewCampaign({...newCampaign, keywords});
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          These keywords will be used to target your ads
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatingCampaign(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCampaign}
                disabled={createCampaign.isPending}
              >
                {createCampaign.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {filteredCampaigns?.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No campaigns found</p>
        </div>
      ) : (
        <>
          {campaignTable}
          {campaignCards}
        </>
      )}
    </div>
  );
}