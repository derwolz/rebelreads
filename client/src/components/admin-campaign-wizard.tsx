import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { z } from "zod";
import { 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  CalendarIcon,
  Search,
  X
} from "lucide-react";

// Define the campaign schema for form validation
const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string(),
  status: z.string(),
  budget: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  books: z.array(z.number()).default([]),
});

// Define the form values type
type CampaignFormValues = z.infer<typeof campaignSchema>;

// The component for creating and editing campaigns
export function AdminCampaignWizard({ 
  onSuccess,
  onCancel
}: { 
  onSuccess: () => void,
  onCancel: () => void 
}) {
  const [booksSearchQuery, setBooksSearchQuery] = useState("");
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
        const error = await res.json();
        throw new Error(error.message || 'Failed to create campaign');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      toast({
        title: "Campaign created",
        description: "The campaign has been created successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: CampaignFormValues) => {
    createCampaign.mutate(values);
  };

  // Filter books based on search query
  const filteredBooks = books?.filter((book: any) => {
    if (!booksSearchQuery) return true;
    
    const searchLower = booksSearchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(searchLower) || 
      (book.authorName && book.authorName.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Campaign</DialogTitle>
        <DialogDescription>
          Set up a new promotional campaign to highlight books across the platform
        </DialogDescription>
      </DialogHeader>
      
      <div className="px-4 py-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  
                  {/* Book Search Input */}
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search books by title or author..."
                      className="pl-8"
                      value={booksSearchQuery}
                      onChange={(e) => setBooksSearchQuery(e.target.value)}
                    />
                    {booksSearchQuery && (
                      <X
                        className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer"
                        onClick={() => setBooksSearchQuery("")}
                      />
                    )}
                  </div>
                  
                  <div className="border rounded-md p-4 space-y-3 max-h-[200px] overflow-y-auto">
                    {loadingBooks ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : filteredBooks?.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        {booksSearchQuery ? "No books match your search" : "No books available"}
                      </p>
                    ) : (
                      filteredBooks?.map((book: any) => (
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
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="mr-2"
              >
                Cancel
              </Button>
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
      </div>
    </>
  );
}