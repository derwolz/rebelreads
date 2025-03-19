import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Book } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdBiddingWizardProps {
  open: boolean;
  onClose: () => void;
  books: Book[];
}

const adBiddingSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  adType: z.enum(["banner", "feature", "keyword"]),
  books: z.array(z.number()).min(1, "Select at least one book"),
  startDate: z.date(),
  endDate: z.date(),
  budget: z.number().min(50, "Minimum budget is $50"),
  keywords: z.string(),
  dailyBudget: z.number().min(5, "Minimum daily budget is $5"),
  maxBidAmount: z.number().min(0.1, "Minimum bid amount is $0.10"),
  targetCPC: z.number().min(0.1, "Minimum target CPC is $0.10"),
});

type AdBiddingForm = z.infer<typeof adBiddingSchema>;

export function AdBiddingWizard({ open, onClose, books }: AdBiddingWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);

  const form = useForm<AdBiddingForm>({
    resolver: zodResolver(adBiddingSchema),
    defaultValues: {
      adType: "banner",
      books: [],
      budget: 50,
      keywords: "",
      dailyBudget: 10,
      maxBidAmount: 0.5,
      targetCPC: 0.2,
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (values: AdBiddingForm) => {
      const formattedData = {
        name: values.name,
        type: "ad",
        adType: values.adType,
        books: values.books,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        budget: values.budget.toString(),
        keywords: values.keywords.split(",").map(k => k.trim()).filter(Boolean),
        status: "active",
        biddingStrategy: "automatic",
        dailyBudget: values.dailyBudget.toString(),
        maxBidAmount: values.maxBidAmount.toString(),
        targetCPC: values.targetCPC.toString(),
      };

      return await apiRequest("campaigns", {
        method: "POST",
        data: formattedData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Created",
        description: "Your ad campaign has been created successfully.",
      });
      onClose();
    },
    onError: (err: Error) => {
      console.error("Error creating campaign:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdBiddingForm) => {
    createCampaign.mutate(data);
  };

  const toggleBook = (bookId: number) => {
    const newBooks = selectedBooks.includes(bookId)
      ? selectedBooks.filter((id) => id !== bookId)
      : [...selectedBooks, bookId];
    setSelectedBooks(newBooks);
    form.setValue("books", newBooks);
  };

  const adTypeInfo = {
    banner: {
      title: "Banner Advertisement",
      description: "Premium placement at the top of the home page and special sidebar placement in search results. Maximum visibility for your books.",
    },
    feature: {
      title: "Feature Highlight",
      description: "Subtle highlighting with a colored border around your book in natural search results. Limited to 5 advertised results per 50 to maintain a natural browsing experience.",
    },
    keyword: {
      title: "Keyword Bidding",
      description: "Bid on specific keywords to show your books when readers search for those terms. Perfect for targeting specific audiences and genres.",
    },
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ad Campaign</DialogTitle>
          <DialogDescription>
            Set up your advertising campaign to reach more readers
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="adType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertisement Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ad type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="banner">Banner Ad</SelectItem>
                      <SelectItem value="feature">Feature Highlight</SelectItem>
                      <SelectItem value="keyword">Keyword Bidding</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value && adTypeInfo[field.value as keyof typeof adTypeInfo].description}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Spring Reading Promotion" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="books"
              render={() => (
                <FormItem>
                  <FormLabel>Select Books</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {books.map((book) => (
                      <Button
                        key={book.id}
                        type="button"
                        variant={selectedBooks.includes(book.id) ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => toggleBook(book.id)}
                      >
                        {book.title}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
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
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
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
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
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
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
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
                  <FormLabel>Campaign Budget (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={50}
                      step={10}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum budget is $50. Recommended budget depends on campaign duration and reach.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Keywords</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter keywords separated by commas (e.g., fantasy, magic, adventure)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Keywords help target your ads to readers interested in specific themes or genres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dailyBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Budget (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      step={1}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum amount to spend per day
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxBidAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Bid Amount (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum amount to bid per keyword
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetCPC"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Cost per Click (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Target cost per click for automatic bidding
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCampaign.isPending}>
                {createCampaign.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}