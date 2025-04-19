import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBeta } from "@/hooks/use-beta";
import { Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GoogleBetaAuthDialog } from "@/components/google-beta-auth-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema, loginSchema, LoginData } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiGoogle } from "react-icons/si";

export default function AuthWallPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { isBetaActive } = useBeta();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [isGoogleBetaDialogOpen, setIsGoogleBetaDialogOpen] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  
  // List of paths that are always allowed
  const allowedPaths = ["/landing", "/how-it-works", "/partner", "/scroll-landing", "/wave-demo"];
  const isAllowedPath = allowedPaths.some(path => location.startsWith(path));
  const isApiPath = location.startsWith("/api");

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
    // Only redirect to /pro if this is a new author registration
    if (isRegistration && user.isAuthor) {
      setLocation("/pro");
    } else {
      setLocation("/");
    }
  };

  // Redirect cases
  if (!isBetaActive) {
    // If beta is not active, redirect to homepage
    return <Redirect to="/" />;
  }
  
  if (user) {
    // If user is logged in, redirect to homepage
    return <Redirect to="/" />;
  }
  
  if (isAllowedPath || isApiPath) {
    // If accessing allowed public paths, let them through
    return <Redirect to={location} />;
  }

  // If the user clicked to show the auth form, render it
  if (showAuthForm) {
    return (
      <>
        <GoogleBetaAuthDialog 
          isOpen={isGoogleBetaDialogOpen} 
          onOpenChange={setIsGoogleBetaDialogOpen} 
        />
        
        <div className="flex justify-center items-center min-h-screen bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <div className="flex flex-col space-y-2 mt-6">
                        <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
                          {loginMutation.isPending ? "Logging in..." : "Login"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => window.location.href = "/landing"}
                          className="w-full"
                        >
                          Learn more about our platform
                        </Button>
                      </div>
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
                      <div className="flex flex-col space-y-2 mt-6">
                        <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
                          {registerMutation.isPending ? "Registering..." : "Register"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => window.location.href = "/landing"}
                          className="w-full"
                        >
                          Learn more about our platform
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Initial screen that prompts the user to access the auth form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Private Beta</h1>
          <p className="text-lg text-muted-foreground">
            This site is currently in private beta. Please log in with your beta access credentials.
          </p>
          <Button 
            size="lg" 
            className="mt-4"
            onClick={() => setShowAuthForm(true)}
          >
            Login to Access
          </Button>
          <p className="text-sm text-muted-foreground mt-8">
            Don&apos;t have an account? <br />
            <Button variant="link" onClick={() => setShowAuthForm(true)}>
              Register with your beta key
            </Button>
          </p>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/landing"}
          >
            Learn more about our platform
          </Button>
        </div>
      </div>
    </div>
  );
}