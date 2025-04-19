import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useBeta } from "@/hooks/use-beta";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Redirect, useLocation } from "wouter";
import { SiGoogle } from "react-icons/si";
import { GoogleBetaAuthDialog } from "@/components/google-beta-auth-dialog";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
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
    // Only redirect to /pro if this is a new author registration
    if (isRegistration && user.isAuthor) {
      setLocation("/pro");
    } else {
      setLocation("/");
    }
  };

  // If user is already logged in, redirect to home or pro
  if (user) {
    return <Redirect to={user.isAuthor ? "/pro" : "/"} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <GoogleBetaAuthDialog 
            isOpen={isGoogleBetaDialogOpen} 
            onOpenChange={setIsGoogleBetaDialogOpen} 
          />
          
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to BookCatalogue</CardTitle>
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
                <TabsList className="grid w-full grid-cols-2 mb-8">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-md px-8">
          <h1 className="text-4xl font-bold mb-6">Discover Your Next Favorite Read</h1>
          <p className="text-xl mb-8">
            Join our community of book lovers. Track your reading journey, discover new titles, and connect with authors.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <div className="mr-2 h-5 w-5 text-primary">✓</div>
              <span>Maintain your personalized book collection</span>
            </li>
            <li className="flex items-center">
              <div className="mr-2 h-5 w-5 text-primary">✓</div>
              <span>Get tailored recommendations</span>
            </li>
            <li className="flex items-center">
              <div className="mr-2 h-5 w-5 text-primary">✓</div>
              <span>Rate and review your favorite books</span>
            </li>
            <li className="flex items-center">
              <div className="mr-2 h-5 w-5 text-primary">✓</div>
              <span>Connect directly with authors</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}