import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SignupInterest } from "@shared/schema";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Download, Search, RefreshCw, CheckCircle, Mail as MailIcon } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

// Extended SignupInterest type with beta key information
interface EnrichedSignupInterest extends SignupInterest {
  hasBetaKey: boolean;
  betaKeyDetails: any | null;
}

type SendBetaEmailsResult = {
  message: string;
  successful: number;
  failed: number;
  results: {
    successful: Array<{ id: number; email: string; betaKey: string }>;
    failed: Array<{ id: number; email: string; error: string }>;
  };
};

const BetaEmailsPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [filteredData, setFilteredData] = useState<EnrichedSignupInterest[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [showWithBetaKeys, setShowWithBetaKeys] = useState(false);
  
  // Fetch signup interests
  const { 
    data: signupInterests, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ["/api/admin/beta-emails/signup-interests"],
    queryFn: async () => {
      const response = await fetch("/api/admin/beta-emails/signup-interests");
      if (!response.ok) {
        throw new Error("Failed to fetch signup interests");
      }
      return response.json() as Promise<EnrichedSignupInterest[]>;
    },
  });

  // Send beta emails mutation
  const sendBetaEmailsMutation = useMutation({
    mutationFn: async (emailIds: number[]) => {
      const response = await fetch("/api/admin/beta-emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          emailIds,
          customMessage: customMessage.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send beta emails");
      }

      return response.json() as Promise<SendBetaEmailsResult>;
    },
    onSuccess: (data) => {
      toast({
        title: "Beta emails sent",
        description: `Successfully sent ${data.successful} beta emails. ${data.failed} failed.`,
      });
      
      // Clear selections and refetch data
      setSelectedRows([]);
      refetch();
      
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/beta-emails/signup-interests"] });
    },
    onError: (error) => {
      toast({
        title: "Error sending beta emails",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Filter data based on search and beta key status
  useEffect(() => {
    if (signupInterests) {
      let filtered = [...signupInterests];
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((item) => 
          item.email.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply beta key filter
      if (!showWithBetaKeys) {
        filtered = filtered.filter((item) => !item.hasBetaKey);
      }
      
      setFilteredData(filtered);
    }
  }, [search, signupInterests, showWithBetaKeys]);

  // Handle row selection
  const handleRowSelection = (id: number) => {
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (filteredData && filteredData.length > 0) {
      if (selectedRows.length === filteredData.length) {
        // If all are selected, unselect all
        setSelectedRows([]);
      } else {
        // Otherwise, select all
        setSelectedRows(filteredData.map((item) => item.id));
      }
    }
  };

  // Handle sending beta emails
  const handleSendBetaEmails = () => {
    if (selectedRows.length === 0) {
      toast({
        title: "No rows selected",
        description: "Please select at least one email to send beta keys.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if any selected rows already have beta keys
    if (signupInterests) {
      const selectedWithBetaKeys = signupInterests
        .filter(item => selectedRows.includes(item.id) && item.hasBetaKey);
      
      if (selectedWithBetaKeys.length > 0) {
        toast({
          title: "Some emails already have beta keys",
          description: `${selectedWithBetaKeys.length} of your selected emails already have beta keys. Please deselect them.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Open confirmation dialog
    setIsConfirmDialogOpen(true);
  };

  // Confirm sending beta emails
  const confirmSendBetaEmails = () => {
    sendBetaEmailsMutation.mutate(selectedRows);
    setIsConfirmDialogOpen(false);
  };

  // Export selected rows to CSV
  const exportSelectedToCSV = () => {
    if (selectedRows.length === 0) {
      toast({
        title: "No rows selected",
        description: "Please select at least one row to export.",
        variant: "destructive",
      });
      return;
    }

    if (!signupInterests) return;

    const selectedData = signupInterests.filter((item) => 
      selectedRows.includes(item.id)
    );

    const csvContent = [
      // CSV header
      "id,email,isPublisher,isAuthorInterest,createdAt",
      // CSV data rows
      ...selectedData.map((item) => 
        `${item.id},"${item.email}",${item.isPublisher},${item.isAuthorInterest},"${item.createdAt}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `beta-signup-interests-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Beta Email Management</CardTitle>
          <CardDescription>Error loading signup interests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Failed to load signup interests. Please try again later.</p>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Count users with and without beta keys
  const stats = signupInterests ? {
    total: signupInterests.length,
    withBetaKey: signupInterests.filter(i => i.hasBetaKey).length,
    withoutBetaKey: signupInterests.filter(i => !i.hasBetaKey).length
  } : { total: 0, withBetaKey: 0, withoutBetaKey: 0 };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Beta Email Management</CardTitle>
        <CardDescription>Send beta keys to users who've signed up for interest</CardDescription>
        <div className="flex gap-4 mt-2">
          <Badge variant="outline" className="px-3 py-1">
            Total: {stats.total}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-green-50 dark:bg-green-950/20">
            With Beta Key: {stats.withBetaKey}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Without Beta Key: {stats.withoutBetaKey}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="showWithBetaKeys" 
                checked={showWithBetaKeys} 
                onCheckedChange={(checked) => setShowWithBetaKeys(!!checked)}
              />
              <Label htmlFor="showWithBetaKeys" className="cursor-pointer">
                Show users with beta keys
              </Label>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={exportSelectedToCSV}
              disabled={selectedRows.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </Button>
            <Button
              onClick={handleSendBetaEmails}
              disabled={selectedRows.length === 0 || sendBetaEmailsMutation.isPending}
            >
              {sendBetaEmailsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send Beta Keys ({selectedRows.length})
            </Button>
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableCaption>
              {isLoading
                ? "Loading signup interests..."
                : `Showing ${filteredData?.length || 0} of ${signupInterests?.length || 0} signup interests`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredData?.length > 0 &&
                      selectedRows.length === filteredData?.length
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Interests</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Beta Key Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredData?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No signup interests found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData?.map((item) => (
                  <TableRow 
                    key={item.id}
                    className={item.hasBetaKey ? "bg-muted/30" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(item.id)}
                        onCheckedChange={() => handleRowSelection(item.id)}
                        aria-label={`Select row ${item.id}`}
                        disabled={item.hasBetaKey}
                      />
                    </TableCell>
                    <TableCell>{item.id}</TableCell>
                    <TableCell className="font-medium">{item.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {item.isPublisher && (
                          <Badge variant="outline">Publisher</Badge>
                        )}
                        {item.isAuthorInterest && (
                          <Badge variant="outline">Author</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {item.hasBetaKey ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span>Sent</span>
                          {item.betaKeyDetails && (
                            <Badge variant="outline" className="ml-2">
                              {new Date(item.betaKeyDetails.createdAt).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <MailIcon className="w-4 h-4 mr-1" />
                          <span>Not Sent</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send Beta Keys</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to send beta keys to {selectedRows.length} selected email(s).
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="my-4">
              <Label htmlFor="customMessage">Custom Message (Optional)</Label>
              <Textarea
                id="customMessage"
                placeholder="Add a custom message to include in the emails..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSendBetaEmails}>
                Send Beta Keys
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default BetaEmailsPage;