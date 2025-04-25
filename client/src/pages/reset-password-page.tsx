import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Define the steps of the password reset flow
enum ResetStep {
  REQUEST = "request", // User enters email
  VERIFY = "verify",   // User enters verification code
  RESET = "reset",     // User enters new password
  SUCCESS = "success", // Password reset success
}

// Schema for email request form
const emailRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Schema for verification code form
const verifyCodeSchema = z.object({
  code: z
    .string()
    .min(6, "Verification code must be 6 characters")
    .max(6, "Verification code must be 6 characters"),
});

// Schema for password reset form
const passwordResetSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Component for the password reset page
export default function ResetPasswordPage() {
  const [currentStep, setCurrentStep] = useState<ResetStep>(ResetStep.REQUEST);
  const [email, setEmail] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Form for email request
  const emailForm = useForm<z.infer<typeof emailRequestSchema>>({
    resolver: zodResolver(emailRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form for verification code
  const codeForm = useForm<z.infer<typeof verifyCodeSchema>>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  // Form for password reset
  const passwordForm = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Request password reset
  const handleRequestReset = async (values: z.infer<typeof emailRequestSchema>) => {
    try {
      const response = await apiRequest("POST", "/api/request-password-reset", {
        email: values.email,
      });

      if (response.ok) {
        setEmail(values.email);
        setCurrentStep(ResetStep.VERIFY);
        toast({
          title: "Verification code sent",
          description: "Please check your email for the verification code",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to request password reset",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting password reset:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Verify code
  const handleVerifyCode = async (values: z.infer<typeof verifyCodeSchema>) => {
    try {
      // First we need to get the user ID by email
      const lookupResponse = await apiRequest("POST", "/api/account/lookup-by-email", {
        email: email,
      });

      if (!lookupResponse.ok) {
        toast({
          title: "Error",
          description: "Invalid email or verification code",
          variant: "destructive",
        });
        return;
      }

      const userData = await lookupResponse.json();
      setUserId(userData.userId);

      // Now verify the code
      const response = await apiRequest("POST", "/api/account/verification/verify", {
        userId: userData.userId,
        code: values.code,
        type: "password_reset",
      });

      if (response.ok) {
        setVerificationCode(values.code);
        setCurrentStep(ResetStep.RESET);
        toast({
          title: "Code verified",
          description: "Please enter your new password",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset password
  const handleResetPassword = async (values: z.infer<typeof passwordResetSchema>) => {
    try {
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found. Please start over.",
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest("POST", "/api/account/verification/reset-password", {
        userId: userId,
        code: verificationCode,
        newPassword: values.password,
      });

      if (response.ok) {
        setCurrentStep(ResetStep.SUCCESS);
        toast({
          title: "Success",
          description: "Your password has been reset successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {currentStep === ResetStep.REQUEST &&
              "Enter your email to receive a verification code"}
            {currentStep === ResetStep.VERIFY &&
              "Enter the verification code sent to your email"}
            {currentStep === ResetStep.RESET &&
              "Create a new password for your account"}
            {currentStep === ResetStep.SUCCESS &&
              "Your password has been reset successfully"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Request password reset */}
          {currentStep === ResetStep.REQUEST && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleRequestReset)}>
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormDescription>
                        We'll send a verification code to this email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-4">
                  Send Reset Code
                </Button>
              </form>
            </Form>
          )}

          {/* Step 2: Verify code */}
          {currentStep === ResetStep.VERIFY && (
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(handleVerifyCode)}>
                <FormField
                  control={codeForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the 6-digit code sent to {email}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col space-y-2 mt-4">
                  <Button type="submit">Verify Code</Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setCurrentStep(ResetStep.REQUEST)}
                  >
                    Back to Email
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Step 3: Reset password */}
          {currentStep === ResetStep.RESET && (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handleResetPassword)}>
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Password must be at least 8 characters with one uppercase letter,
                        one lowercase letter, and one number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col space-y-2 mt-4">
                  <Button type="submit">Reset Password</Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setCurrentStep(ResetStep.VERIFY)}
                  >
                    Back to Verification
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Step 4: Success */}
          {currentStep === ResetStep.SUCCESS && (
            <div className="text-center py-6">
              <p className="mb-6">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <Button
                onClick={() => navigate("/")}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {currentStep !== ResetStep.SUCCESS && (
            <Button
              variant="link"
              onClick={() => navigate("/")}
            >
              Back to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}