import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BetaKey } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, RefreshCw, Copy, Check } from "lucide-react";

// Form schema for creating a new beta key
const betaKeyFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional(),
  prefix: z.string().optional(),
});

type BetaKeyFormData = z.infer<typeof betaKeyFormSchema>;

export function AdminBetaKeysManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);

  // Fetch beta keys
  const { data: betaKeys, isLoading } = useQuery<BetaKey[]>({
    queryKey: ["/api/beta"],
    queryFn: async () => {
      const response = await fetch("/api/beta");
      if (!response.ok) {
        throw new Error("Failed to fetch beta keys");
      }
      return response.json();
    },
  });

  // Create new beta key
  const createBetaKeyMutation = useMutation({
    mutationFn: async (data: BetaKeyFormData) => {
      const response = await apiRequest("POST", "/api/beta", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Beta Key Created",
        description: "The beta key has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create beta key: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle beta key active status
  const toggleBetaKeyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/beta/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta"] });
      toast({
        title: "Beta Key Updated",
        description: "The beta key status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update beta key: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete beta key
  const deleteBetaKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/beta/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta"] });
      toast({
        title: "Beta Key Deleted",
        description: "The beta key has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete beta key: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Copy beta key to clipboard
  const copyToClipboard = (key: string, id: number) => {
    navigator.clipboard.writeText(key).then(
      () => {
        setCopiedKeyId(id);
        toast({
          title: "Copied to clipboard",
          description: "The beta key has been copied to your clipboard.",
        });
        
        // Reset the copy status after 2 seconds
        setTimeout(() => {
          setCopiedKeyId(null);
        }, 2000);
      },
      (err) => {
        toast({
          title: "Error",
          description: "Could not copy the beta key to clipboard.",
          variant: "destructive",
        });
      }
    );
  };

  // Form for creating new beta key
  const form = useForm<BetaKeyFormData>({
    resolver: zodResolver(betaKeyFormSchema),
    defaultValues: {
      description: "",
      usageLimit: 1,
      isActive: true,
      expiresAt: "",
      prefix: "BETA",
    },
  });

  const onSubmit = (data: BetaKeyFormData) => {
    // Convert empty string to undefined for optional fields
    const formattedData = {
      ...data,
      usageLimit: data.usageLimit || undefined,
      expiresAt: data.expiresAt || undefined,
      prefix: data.prefix || undefined,
    };
    
    createBetaKeyMutation.mutate(formattedData);
  };

  // Format date for display
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Never";
    try {
      if (typeof dateString === 'string') {
        return format(parseISO(dateString), "MMM dd, yyyy");
      } else if (dateString instanceof Date) {
        return format(dateString, "MMM dd, yyyy");
      }
      return "Invalid date";
    } catch (error) {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Beta Key Management</h3>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Beta Key</span>
        </Button>
      </div>

      {betaKeys && betaKeys.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {betaKeys.map((betaKey) => (
                  <TableRow key={betaKey.id}>
                    <TableCell className="font-mono flex items-center gap-2">
                      {betaKey.key}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(betaKey.key, betaKey.id)}
                      >
                        {copiedKeyId === betaKey.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{betaKey.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={betaKey.isActive}
                          onCheckedChange={(checked) => {
                            toggleBetaKeyMutation.mutate({
                              id: betaKey.id,
                              isActive: checked,
                            });
                          }}
                        />
                        <Badge
                          variant={betaKey.isActive ? "default" : "secondary"}
                        >
                          {betaKey.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {betaKey.usageCount} / {betaKey.usageLimit || "∞"}
                    </TableCell>
                    <TableCell>{betaKey.expiresAt ? formatDate(betaKey.expiresAt.toString()) : "Never"}</TableCell>
                    <TableCell>{betaKey.createdAt ? formatDate(betaKey.createdAt.toString()) : "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this beta key?")) {
                            deleteBetaKeyMutation.mutate(betaKey.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground mb-4">No beta keys found.</p>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create your first beta key</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Beta Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Beta Key</DialogTitle>
            <DialogDescription>
              Create a new beta key for users to access the application during beta.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description for this beta key"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This description helps you identify what this key is for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      How many times this key can be used. Leave empty for unlimited uses.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      When this key expires. Leave empty for no expiration.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Prefix</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="BETA"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Custom prefix for the generated key. Default is "BETA".
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Whether this beta key is active and can be used.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBetaKeyMutation.isPending}
                >
                  {createBetaKeyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Beta Key"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}