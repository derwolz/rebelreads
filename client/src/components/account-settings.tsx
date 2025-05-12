import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateProfile, updateProfileSchema } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export function AccountSettings() {
  const { user, isAuthor, becomeAuthorMutation, revokeAuthorMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const revokeButtonRef = React.useRef<HTMLButtonElement>(null);
  
  // Check if the user is using SSO
  const isSSO = user?.provider !== null && user?.provider !== undefined;
  
  // Initial verification state
  const [isVerified, setIsVerified] = useState(isSSO); // Auto-verified for SSO users
  const [showVerification, setShowVerification] = useState(!isSSO); // Skip verification for SSO users
  
  // Separate form for initial password verification
  const verificationForm = useForm({
    defaultValues: {
      verificationPassword: ""
    },
    resolver: zodResolver(
      z.object({
        verificationPassword: z.string().min(1, "Password is required")
      })
    )
  });

  const [verificationError, setVerificationError] = useState("");
  
  // Profile update form (email and username only)
  const profileForm = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email("Invalid email format"),
        username: z.string().min(3, "Username must be at least 3 characters"),
      })
    ),
    defaultValues: {
      email: user?.email || "",
      username: user?.username || "",
    },
  });
  
  // Password update form
  const passwordForm = useForm({
    resolver: zodResolver(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
          .regex(/[a-z]/, "Password must contain at least one lowercase letter")
          .regex(/[0-9]/, "Password must contain at least one number"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
      }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
  });
  
  // Reset the forms when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        email: user.email || "",
        username: user.username || "",
      });
    }
  }, [user, profileForm]);
  
  // Verify password mutation
  const verifyPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", "/api/verify-password", { password });
      if (!res.ok) {
        // Try to parse as JSON first
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Password verification failed");
        } else {
          // Fallback to text if not JSON
          const error = await res.text();
          throw new Error(error);
        }
      }
      return res.json();
    },
    onSuccess: () => {
      setIsVerified(true);
      setShowVerification(false);
      setVerificationError("");
    },
    onError: (error: Error) => {
      // Extract clean error message
      setVerificationError(error.message || "Password verification failed");
    }
  });
  
  // Handle verification form submission
  const onVerify = (data: { verificationPassword: string }) => {
    verifyPasswordMutation.mutate(data.verificationPassword);
  };
  
  // Update profile mutation (for email and username)
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { email: string, username: string }) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      if (!res.ok) {
        // Try to parse as JSON first
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update profile");
        } else {
          // Fallback to text if not JSON
          const error = await res.text();
          throw new Error(error);
        }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
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
  
  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { 
      currentPassword: string, 
      newPassword: string, 
      confirmPassword: string 
    }) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      if (!res.ok) {
        // Try to parse as JSON first
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update password");
        } else {
          // Fallback to text if not JSON
          const error = await res.text();
          throw new Error(error);
        }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      // Clear password fields after successful update
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmitProfile = (data: { email: string, username: string }) => {
    updateProfileMutation.mutate(data);
  };
  
  const onSubmitPassword = (data: { 
    currentPassword: string, 
    newPassword: string, 
    confirmPassword: string 
  }) => {
    updatePasswordMutation.mutate(data);
  };
  
  // If verification is required and not yet verified, show verification dialog
  if (showVerification && !isVerified) {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Your Identity</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your current password to access account settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Form {...verificationForm}>
            <form onSubmit={verificationForm.handleSubmit(onVerify)} className="space-y-4 py-2">
              <FormField
                control={verificationForm.control}
                name="verificationPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    {verificationError && (
                      <p className="text-sm font-medium text-destructive">{verificationError}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <AlertDialogFooter>
                <Button
                  type="submit"
                  disabled={verifyPasswordMutation.isPending}
                >
                  {verifyPasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        {/* Profile Information Form */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Profile Information</h3>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormDescription>
                      Your email address for notifications and account recovery
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Your unique username for logging in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mt-6">
                <Button 
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Password Change Form - Only shown for non-SSO users */}
        {!isSSO && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          autoComplete="new-password"
                          {...field}
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
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mt-6">
                  <Button 
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                  >
                    {updatePasswordMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Change Password
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
        
        {/* Information for SSO users */}
        {isSSO && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">SSO Authentication</h3>
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="text-sm text-muted-foreground">
                Your account uses {user?.provider} for authentication. 
                Password management is handled by your {user?.provider} account.
              </p>
            </div>
          </div>
        )}

        {/* Author Account Management Section */}
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
                          onClick={() => revokeAuthorMutation.mutate({ confirmUsername: user?.username || '' })}
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
                      onClick={() => becomeAuthorMutation.mutate({})}
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
      </CardContent>
    </Card>
  );
}