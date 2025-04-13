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
import { Search, Plus, Loader2, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: number;
  username: string;
  email: string;
  isSeller?: boolean;
}

interface Seller {
  id: number;
  userId: number;
  name: string;
  email: string;
  company: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

export function AdminSellersManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewSellerOpen, setIsNewSellerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [formData, setFormData] = useState({
    userId: 0,
    name: "",
    email: "",
    company: "",
    notes: ""
  });

  // Fetch all sellers
  const { data: sellers, isLoading } = useQuery({
    queryKey: ['/api/admin/sellers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/sellers');
      if (!response.ok) {
        throw new Error('Failed to fetch sellers');
      }
      return response.json() as Promise<Seller[]>;
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

  // Create new seller mutation
  const createSellerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/admin/sellers', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Seller created",
        description: "The seller has been created successfully.",
      });
      setIsNewSellerOpen(false);
      setFormData({
        userId: 0,
        name: "",
        email: "",
        company: "",
        notes: ""
      });
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sellers'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create seller",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.name || !formData.email || !formData.company) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createSellerMutation.mutate(formData);
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      userId: user.id,
      email: user.email || "",
      name: user.username || ""
    });
    setShowUserSearch(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Seller Management</h3>
        <Dialog open={isNewSellerOpen} onOpenChange={setIsNewSellerOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus size={16} />
              <span>Create Seller</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Seller</DialogTitle>
              <DialogDescription>
                Assign seller status to a user, allowing them to verify publishers.
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
                                  ${user.isSeller ? 'opacity-50' : ''}`}
                                onClick={() => !user.isSeller && selectUser(user)}
                              >
                                <div>
                                  <div className="font-medium">{user.username}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                                {user.isSeller && (
                                  <Badge variant="outline">Already a seller</Badge>
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
                <Label htmlFor="name">Seller Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewSellerOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSellerMutation.isPending || !selectedUser}
                >
                  {createSellerMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Seller
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : sellers && sellers.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell className="font-medium">{seller.name}</TableCell>
                  <TableCell>{seller.company}</TableCell>
                  <TableCell>
                    {seller.user ? seller.user.email : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={seller.status === 'active' ? 'default' : 'secondary'}
                    >
                      {seller.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(seller.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No sellers found.</p>
          <p>Create a seller to get started.</p>
        </div>
      )}
    </div>
  );
}