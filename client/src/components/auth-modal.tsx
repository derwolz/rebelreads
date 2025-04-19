import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useBeta } from "@/hooks/use-beta";
import { queryClient } from "@/lib/queryClient";
import { insertUserSchema, loginSchema, LoginData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocation } from "wouter";
import { SiGoogle } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoogleBetaAuthDialog } from "./google-beta-auth-dialog";
import { LoginVerificationDialog } from "./login-verification-dialog";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const { 
    user, 
    loginMutation, 
    registerMutation, 
    verificationNeeded, 
    verificationUserId,
    verifyLoginMutation
  } = useAuth();
  const { isBetaActive } = useBeta();
  const [, setLocation] = useLocation();
  const [isGoogleBetaDialogOpen, setIsGoogleBetaDialogOpen] = useState(false);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", betaKey: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      newsletterOptIn: false,
      isAuthor: false,
      betaKey: "",
    },
  });

  const handleSSOLogin = (provider: string) => {
    if (provider === 'google') {
      if (isBetaActive) {
        // If beta is active, show the beta key dialog first
        setIsGoogleBetaDialogOpen(true);
      } else {
        // If not in beta, proceed directly to Google OAuth
        window.location.href = '/api/auth/google';
      }
    } else {
      // For other providers that aren't implemented yet
      console.log(`Login with ${provider} - Not yet implemented`);
    }
  };

  const handleSuccess = (user: any, isRegistration: boolean) => {
    // If verification is needed, the auth dialog should stay open
    // but the verification dialog will appear (controlled by the verificationNeeded state)
    if (user.verificationNeeded) {
      // The login mutation handler in useAuth.tsx already sets verificationNeeded and verificationUserId
      // So we don't need to do anything here, just prevent the auth modal from closing
      return;
    }

    // For normal login/registration success, close the auth modal
    onOpenChange(false);
    
    // Only redirect to /pro if this is a new author registration
    if (isRegistration && user.isAuthor) {
      setLocation("/pro");
    }
  };

  return (
    <>
      <GoogleBetaAuthDialog 
        isOpen={isGoogleBetaDialogOpen} 
        onOpenChange={setIsGoogleBetaDialogOpen} 
      />
      
      {/* Verification Dialog - shown when login requires verification */}
      {verificationUserId !== null && verificationNeeded && (
        <LoginVerificationDialog 
          userId={verificationUserId as number}
          isOpen={verificationNeeded}
          maskedEmail="your.email@example.com"
          onClose={() => {
            // Force a reload to reset the verification state
            loginMutation.reset();
            
            // Use useAuth's global mutation to invalidate queries
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            queryClient.invalidateQueries({ queryKey: ["/api/author-status"] });
            
            // Close modals by resetting app state (parent component will be updated)
            setTimeout(() => window.location.reload(), 100);
          }}
          onSuccess={(user: any) => handleSuccess(user, false)}
        />
      )}
      
      <Dialog open={isOpen && !verificationNeeded} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome Back</DialogTitle>
            <DialogDescription>
              Sign in to your account or create a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mb-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSSOLogin('google')}
            >
              <SiGoogle className="mr-2" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit((data) => {
                    loginMutation.mutate(data, {
                      onSuccess: (user) => handleSuccess(user, false)
                    });
                  })}
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email or username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isBetaActive && (
                    <FormField
                      control={loginForm.control}
                      name="betaKey"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Beta Key</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your beta key" {...field} />
                          </FormControl>
                          <FormDescription>
                            Required for first-time login during beta testing phase.
                            Returning users who have already used a beta key don't need to enter it again.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button className="w-full mt-6" type="submit">
                    Login
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit((data) => {
                    registerMutation.mutate(data, {
                      onSuccess: (user) => handleSuccess(user, true)
                    });
                  })}
                >
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="isAuthor"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>I am registering as a:</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "author")}
                            defaultValue="reader"
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="reader" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Reader
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="author" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Author
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Authors will have access to additional features for publishing and managing books
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="newsletterOptIn"
                    render={({ field }) => (
                      <FormItem className="mt-4 flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Subscribe to newsletter
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  {isBetaActive && (
                    <FormField
                      control={registerForm.control}
                      name="betaKey"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Beta Key</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your beta key" {...field} />
                          </FormControl>
                          <FormDescription>
                            Required during beta testing phase
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button className="w-full mt-6" type="submit">
                    Register
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}