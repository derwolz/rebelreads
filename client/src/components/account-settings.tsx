import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateProfile, updateProfileSchema } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AccountSettings() {
  const { user, isAuthor, becomeAuthorMutation, revokeAuthorMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const revokeButtonRef = React.useRef<HTMLButtonElement>(null);
  
  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      email: user?.email || "",
      username: user?.username || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: UpdateProfile) => {
    updateProfileMutation.mutate(data);
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" value={field.value || ''} />
                  </FormControl>
                  <FormDescription>
                    Your email address for notifications and account recovery
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>
                    Your unique username for logging in
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">Change Password</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          autoComplete="current-password"
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          autoComplete="new-password"
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters long
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          autoComplete="new-password"
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-6">
                <Button type="submit">Save Changes</Button>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div>
                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-2">Author Account Management</h3>
                    <p className="text-sm text-muted-foreground mb-4">Manage your author status</p>
                    
                    {isAuthor ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Active</div>
                          <span className="text-sm font-medium">You are registered as an author</span>
                        </div>
                        
                        <p className="text-sm">
                          As an author, you can publish books, manage your portfolio, and access analytics.
                        </p>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              className="w-full"
                            >
                              Revoke Author Status
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke Author Status</AlertDialogTitle>
                              
                              {/* Use regular div instead of AlertDialogDescription to avoid nesting issues */}
                              <div className="space-y-4 py-2">
                                <div className="bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/30">
                                  <strong>Warning: This action cannot be undone!</strong>
                                </div>
                                
                                <p>Revoking your author status will:</p>
                                <div className="ml-5 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span>•</span> Delete all books you've published
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span>•</span> Remove your author profile and analytics
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span>•</span> Remove access to author-specific features
                                  </div>
                                </div>
                                
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                                  <p className="text-amber-800 text-sm font-medium">
                                    Consider carefully before proceeding, as this will delete all your published content.
                                  </p>
                                </div>
                              </div>
                            </AlertDialogHeader>
                            <AlertDialogAction
                              ref={revokeButtonRef}
                              onClick={() => revokeAuthorMutation.mutate()}
                              className="bg-destructive text-destructive-foreground"
                            >
                              I understand, revoke my author status
                            </AlertDialogAction>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm">
                          Become an author to publish books, sell directly to readers, and build your online presence.
                        </p>
                        <Button 
                          onClick={() => becomeAuthorMutation.mutate()}
                          className="w-full"
                        >
                          Register as Author
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}