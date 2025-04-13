import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Search, Copy, RefreshCw, UserPlus } from "lucide-react";

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  // Fetch list of users for publisher assignment
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/sales/users', searchTerm],
    queryFn: async () => {
      const query = searchTerm ? `?query=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`/api/sales/users${query}`);
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      return res.json();
    },
  });

  // Fetch verification codes
  const { data: codes, isLoading: isLoadingCodes } = useQuery<VerificationCode[]>({
    queryKey: ['/api/account/verification-codes'],
    queryFn: async () => {
      const res = await fetch('/api/account/verification-codes');
      if (!res.ok) {
        throw new Error('Failed to fetch verification codes');
      }
      return res.json();
    },
  });

  // Fetch verified publishers
  const { data: publishers, isLoading: isLoadingPublishers } = useQuery<Publisher[]>({
    queryKey: ['/api/account/verified-publishers'],
    queryFn: async () => {
      const res = await fetch('/api/account/verified-publishers');
      if (!res.ok) {
        throw new Error('Failed to fetch verified publishers');
      }
      return res.json();
    },
  });

  // Generate a new verification code
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/account/generate-verification-code', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Failed to generate verification code', data);
        throw new Error(data.details || data.error || 'Failed to generate verification code');
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log("Successfully generated verification code:", data);
      toast({
        title: "Success",
        description: "Verification code generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/account/verification-codes'] });
    },
    onError: (error) => {
      console.error("Error generating verification code:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate verification code",
        variant: "destructive",
      });
    },
  });

  // Select a user for publisher assignment
  const selectUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  // Setup form validation for publisher assignment
  const assignPublisherSchema = z.object({
    publisher_name: z.string().min(1, "Publisher name is required"),
    publisher_description: z.string().optional(),
    business_email: z.string().email("Invalid email format").optional(),
  });

  const assignForm = useForm<z.infer<typeof assignPublisherSchema>>({
    resolver: zodResolver(assignPublisherSchema),
    defaultValues: {
      publisher_name: "",
      publisher_description: "",
      business_email: "",
    },
  });

  // Assign publisher status mutation
  const assignPublisherMutation = useMutation({
    mutationFn: async (data: z.infer<typeof assignPublisherSchema>) => {
      if (!selectedUser) {
        throw new Error('No user selected');
      }

      const res = await fetch('/api/sales/assign-publisher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...data,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to assign publisher status');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Publisher status assigned to ${selectedUser?.username}`,
      });
      setShowUserDialog(false);
      setSelectedUser(null);
      assignForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/sales/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account/verified-publishers'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign publisher status",
        variant: "destructive",
      });
    },
  });

  const onSubmitAssignPublisher = (data: z.infer<typeof assignPublisherSchema>) => {
    assignPublisherMutation.mutate(data);
  };

  // Copy verification code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Verification code copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Manage Users</TabsTrigger>
          <TabsTrigger value="codes">Verification Codes</TabsTrigger>
          <TabsTrigger value="publishers">Verified Publishers</TabsTrigger>
        </TabsList>

        {/* Users Tab - For assigning publisher status */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publisher Assignment</CardTitle>
              <CardDescription>
                Assign publisher status to users in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search users by name or email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="py-6 text-center">Loading users...</div>
              ) : (
                <Table>
                  <TableCaption>
                    {users?.length === 0
                      ? "No users found"
                      : `Showing ${users?.length} user${users?.length === 1 ? "" : "s"}`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.isPublisher ? (
                            <Badge>Publisher</Badge>
                          ) : (
                            <Badge variant="outline">Regular User</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!user.isPublisher && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectUser(user)}
                            >
                              <UserPlus className="mr-1 h-4 w-4" />
                              Assign Publisher
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Codes Tab */}
        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Codes</CardTitle>
              <CardDescription>
                Generate and manage verification codes for publisher assignment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => generateCodeMutation.mutate()} 
                disabled={generateCodeMutation.isPending}
                className="mb-4"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {generateCodeMutation.isPending ? "Generating..." : "Generate New Code"}
              </Button>

              {isLoadingCodes ? (
                <div className="py-6 text-center">Loading verification codes...</div>
              ) : (
                <Table>
                  <TableCaption>
                    {!codes || codes.length === 0 
                      ? "No verification codes found" 
                      : `Showing ${codes.length} verification code${codes.length === 1 ? "" : "s"}`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Verification Code</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes?.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono">{code.verification_code}</TableCell>
                        <TableCell>{new Date(code.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(code.verification_code)}
                          >
                            <Copy className="mr-1 h-4 w-4" />
                            Copy
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verified Publishers Tab */}
        <TabsContent value="publishers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verified Publishers</CardTitle>
              <CardDescription>
                View and manage publishers in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPublishers ? (
                <div className="py-6 text-center">Loading publishers...</div>
              ) : (
                <Table>
                  <TableCaption>
                    {!publishers || publishers.length === 0 
                      ? "No publishers found" 
                      : `Showing ${publishers.length} publisher${publishers.length === 1 ? "" : "s"}`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Publisher Name</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Business Email</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publishers?.map((publisher) => (
                      <TableRow key={publisher.id}>
                        <TableCell className="font-medium">{publisher.publisher_name}</TableCell>
                        <TableCell>{publisher.user?.username || "Unknown"}</TableCell>
                        <TableCell>{publisher.business_email || "—"}</TableCell>
                        <TableCell>{new Date(publisher.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for assigning publisher status */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Publisher Status</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `Assign publisher status to ${selectedUser.username} (${selectedUser.email})`
                : "Select a user to assign publisher status"}
            </DialogDescription>
          </DialogHeader>

          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onSubmitAssignPublisher)} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="publisher_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publisher Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Publisher Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={assignForm.control}
                name="publisher_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publisher Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Publisher Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={assignForm.control}
                name="business_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Business Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowUserDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={assignPublisherMutation.isPending}>
                  {assignPublisherMutation.isPending ? "Assigning..." : "Assign Publisher Status"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}