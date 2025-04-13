import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Plus, Loader2, UserPlus, Copy, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  isPublisher?: boolean;
}

interface Publisher {
  id: number;
  userId?: number;
  name: string;
  publisher_name: string;
  publisher_description?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  website?: string;
  logoUrl?: string;
  createdAt: string;
  approvedAt?: string;
  user?: {
    id: number;
    email: string;
    username: string;
    displayName?: string;
  };
}

interface VerificationCode {
  id: number;
  sellerId: number;
  verification_code: string;
  createdAt: string;
}

export function SalesPublisherManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewVerificationOpen, setIsNewVerificationOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [formData, setFormData] = useState({
    userId: 0,
    name: "",
    publisher_name: "",
    publisher_description: "",
    business_email: "",
    notes: ""
  });

  // Fetch seller info
  const { data: sellerInfo } = useQuery({
    queryKey: ['/api/account/publisher-seller-profile'],
    queryFn: async () => {
      const response = await fetch('/api/account/publisher-seller-profile');
      if (!response.ok) {
        throw new Error('Failed to fetch seller profile');
      }
      return response.json();
    }
  });

  // Fetch verification codes
  const { data: verificationCodes, isLoading: loadingCodes } = useQuery({
    queryKey: ['/api/account/verification-codes'],
    queryFn: async () => {
      const response = await fetch('/api/account/verification-codes');
      if (!response.ok) {
        throw new Error('Failed to fetch verification codes');
      }
      return response.json() as Promise<VerificationCode[]>;
    }
  });

  // Fetch publishers verified by this seller
  const { data: publishers, isLoading: loadingPublishers } = useQuery({
    queryKey: ['/api/account/verified-publishers'],
    queryFn: async () => {
      const response = await fetch('/api/account/verified-publishers');
      if (!response.ok) {
        throw new Error('Failed to fetch verified publishers');
      }
      return response.json() as Promise<Publisher[]>;
    }
  });

  // Search for users
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['/api/admin/users/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await fetch(`/api/admin/users/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      return response.json() as Promise<User[]>;
    },
    enabled: searchQuery.length >= 2
  });

  // Generate verification code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/account/generate-verification-code', 'POST');
    },
    onSuccess: (data) => {
      setVerificationCode(data.verification_code);
      queryClient.invalidateQueries({ queryKey: ['/api/account/verification-codes'] });
      toast({
        title: "Verification code generated",
        description: "The code has been generated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate code",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Assign publisher status mutation
  const assignPublisherMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/sales/assign-publisher', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Publisher status assigned",
        description: "The user has been assigned publisher status successfully.",
      });
      // Reset form and refresh data
      setFormData({
        userId: 0,
        name: "",
        publisher_name: "",
        publisher_description: "",
        business_email: "",
        notes: ""
      });
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/account/verified-publishers'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to assign publisher status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  const handleGenerateCode = () => {
    generateCodeMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
        toast({
          title: "Copied to clipboard",
          description: "The verification code has been copied to your clipboard.",
        });
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast({
          title: "Failed to copy",
          description: "Please try copying the code manually.",
          variant: "destructive",
        });
      }
    );
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      userId: user.id,
      name: user.username || "",
      business_email: user.email || "",
    });
    setShowUserSearch(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.publisher_name) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    assignPublisherMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="publishers">
        <TabsList>
          <TabsTrigger value="publishers">Publishers</TabsTrigger>
          <TabsTrigger value="codes">Verification Codes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="publishers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Verified Publishers</h3>
            <Dialog open={isNewVerificationOpen} onOpenChange={setIsNewVerificationOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus size={16} />
                  <span>Verify New Publisher</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Verify New Publisher</DialogTitle>
                  <DialogDescription>
                    Assign publisher status to a user, allowing them to publish books and manage authors.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="user">User</Label>
                    <div className="relative">
                      {selectedUser ? (
                        <div className="flex justify-between items-center p-2 border rounded-md">
                          <div>
                            <span className="font-medium">{selectedUser.username}</span>
                            <span className="text-sm text-muted-foreground ml-2">({selectedUser.email})</span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowUserSearch(true)}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Search for a user by email or username"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onClick={() => setShowUserSearch(true)}
                            />
                            <Button type="button" variant="ghost" size="icon">
                              <Search size={18} />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {showUserSearch && searchResults && searchResults.length > 0 && (
                        <Card className="absolute w-full mt-1 z-50">
                          <CardContent className="p-2">
                            {isSearching ? (
                              <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            ) : (
                              <ul className="max-h-60 overflow-auto">
                                {searchResults.map((user) => (
                                  <li 
                                    key={user.id} 
                                    className={`p-2 hover:bg-accent rounded-md cursor-pointer flex justify-between items-center
                                      ${user.isPublisher ? 'opacity-50' : ''}`}
                                    onClick={() => !user.isPublisher && selectUser(user)}
                                  >
                                    <div>
                                      <div className="font-medium">{user.username}</div>
                                      <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </div>
                                    {user.isPublisher && (
                                      <Badge variant="outline">Already a publisher</Badge>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="publisher_name">Publisher Name</Label>
                    <Input
                      id="publisher_name"
                      value={formData.publisher_name}
                      onChange={(e) => setFormData({ ...formData, publisher_name: e.target.value })}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">The official name of the publishing company</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="publisher_description">Publisher Description</Label>
                    <Textarea
                      id="publisher_description"
                      value={formData.publisher_description}
                      onChange={(e) => setFormData({ ...formData, publisher_description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="business_email">Business Email</Label>
                    <Input
                      id="business_email"
                      type="email"
                      value={formData.business_email}
                      onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Optional notes about this publisher (only visible to sales)"
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsNewVerificationOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={assignPublisherMutation.isPending || !selectedUser}
                    >
                      {assignPublisherMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Verify Publisher
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {loadingPublishers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : publishers && publishers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Publisher Name</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Verified On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publishers.map((publisher) => (
                    <TableRow key={publisher.id}>
                      <TableCell className="font-medium">{publisher.publisher_name}</TableCell>
                      <TableCell>
                        {publisher.user ? `${publisher.user.username} (${publisher.user.email})` : publisher.name}
                      </TableCell>
                      <TableCell>{publisher.business_email || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(publisher.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No publishers verified yet.</p>
              <p>You can verify a new publisher using the button above.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="codes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Verification Codes</h3>
            <Button 
              onClick={handleGenerateCode} 
              disabled={generateCodeMutation.isPending}
              className="flex items-center gap-2"
            >
              {generateCodeMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <Plus size={16} />
              <span>Generate New Code</span>
            </Button>
          </div>
          
          {verificationCode && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>New Verification Code</AlertTitle>
              <AlertDescription className="flex items-center justify-between mt-2">
                <code className="bg-muted px-3 py-1 rounded-md">{verificationCode}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(verificationCode)}
                  className="ml-2"
                >
                  {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {loadingCodes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : verificationCodes && verificationCodes.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Verification Code</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verificationCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">{code.verification_code}</TableCell>
                      <TableCell>{new Date(code.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(code.verification_code)}
                        >
                          <Copy size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No verification codes generated yet.</p>
              <p>Generate a code to allow users to become publishers.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}