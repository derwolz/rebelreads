import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertCircle, Clock, Upload, Camera, Image, Pencil } from "lucide-react";

// Helper function for JSON requests
async function jsonRequest(url: string) {
  const res = await fetch(url, {
    method: 'GET',
    credentials: "include",
  });
  
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw json;
    } catch {
      throw new Error(text || res.statusText);
    }
  }
  
  return await res.json();
}

interface Question {
  id: number;
  question: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface AuthorResponse {
  id: number;
  questionId: number;
  authorId: number;
  text: string | null;  // Now nullable
  imageUrl: string | null;  // Now nullable
  createdAt: string;
  updatedAt: string;
}

export default function AuthorBashSubmission() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current active question
  const {
    data: activeQuestion,
    isLoading: isLoadingQuestion,
    isError: isQuestionError,
  } = useQuery<Question>({
    queryKey: ["/api/authorbash/questions/active"],
    queryFn: () => jsonRequest("/api/authorbash/questions/active"),
    enabled: !!user?.isAuthor,
  });

  // Fetch author's existing response to the active question
  const {
    data: existingResponse,
    isLoading: isLoadingResponse,
    isError: isResponseError,
    refetch: refetchResponse,
  } = useQuery<AuthorResponse>({
    queryKey: ["/api/authorbash/responses/mine"],
    queryFn: () => jsonRequest("/api/authorbash/responses/mine"),
    enabled: !!user?.isAuthor && !!activeQuestion,
  });
  
  // Set form data when existing response is loaded
  React.useEffect(() => {
    if (existingResponse && !isEditing) {
      setText(existingResponse.text || "");
      if (existingResponse.imageUrl) {
        setImagePreview(existingResponse.imageUrl);
      }
    }
  }, [existingResponse, isEditing]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setImage(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value.slice(0, 200));
  };

  // Submit new response
  const handleSubmit = async () => {
    if (!activeQuestion) {
      toast({
        title: "Missing information",
        description: "No active question found.",
        variant: "destructive",
      });
      return;
    }
    
    if (!text && !image && !imagePreview) {
      toast({
        title: "Missing information",
        description: "Please provide either text, an image, or both.",
        variant: "destructive",
      });
      return;
    }

    if (text && text.length > 200) {
      toast({
        title: "Text too long",
        description: "Response text must be 200 characters or less.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (text) {
        formData.append("text", text);
      }
      if (image) {
        formData.append("image", image);
      }

      const response = await fetch("/api/authorbash/responses", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit response");
      }

      toast({
        title: "Response submitted!",
        description: "Your response has been submitted successfully.",
      });

      // Refetch data
      queryClient.invalidateQueries({
        queryKey: ["/api/authorbash/responses/mine"],
      });
      refetchResponse();
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update existing response
  const handleUpdate = async () => {
    if (!existingResponse) {
      toast({
        title: "Missing information",
        description: "No existing response found to update.",
        variant: "destructive",
      });
      return;
    }
    
    if (!text && !image && !imagePreview) {
      toast({
        title: "Missing information",
        description: "Please provide either text, an image, or both.",
        variant: "destructive",
      });
      return;
    }

    if (text && text.length > 200) {
      toast({
        title: "Text too long",
        description: "Response text must be 200 characters or less.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      // Always send the text field, even if empty string
      // The server will convert empty string to null
      formData.append("text", text);
      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(`/api/authorbash/responses/${existingResponse.id}`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update response");
      }

      toast({
        title: "Response updated!",
        description: "Your response has been updated successfully.",
      });

      // Refetch data
      queryClient.invalidateQueries({
        queryKey: ["/api/authorbash/responses/mine"],
      });
      refetchResponse();
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate time remaining until end date
  const getTimeRemaining = (endDateString: string) => {
    const now = new Date();
    const endDate = new Date(endDateString);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      return `${diffDays} days remaining`;
    } else if (diffDays === 1) {
      return "1 day remaining";
    } else {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours > 0) {
        return `${diffHours} hours remaining`;
      } else {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minutes remaining`;
      }
    }
  };

  // Handle loading states
  if (!user) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-4">Sign in to Submit</h3>
        <p className="mb-6">You need to be signed in to submit responses to AuthorBash.</p>
        <Button asChild>
          <a href="/auth">Sign In</a>
        </Button>
      </div>
    );
  }

  if (!user.isAuthor) {
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Author Access Required</AlertTitle>
        <AlertDescription>
          Only authors can submit responses to AuthorBash. If you are an author,
          please make sure your account is properly set up.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoadingQuestion || (isLoadingResponse && !isEditing)) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading question...</span>
      </div>
    );
  }

  if (isQuestionError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load the current question. There may not be an active question at this time.
        </AlertDescription>
      </Alert>
    );
  }

  if (!activeQuestion) {
    return (
      <Alert className="mb-6">
        <Clock className="h-4 w-4" />
        <AlertTitle>No Active Question</AlertTitle>
        <AlertDescription>
          There is no active question at this time. Please check back later for the next AuthorBash prompt.
        </AlertDescription>
      </Alert>
    );
  }

  // Render the existing response (viewing mode)
  if (existingResponse && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Response to Week {activeQuestion.weekNumber}</CardTitle>
          <p className="text-muted-foreground mt-2">{activeQuestion.question}</p>
        </CardHeader>
        <CardContent>
          {existingResponse.imageUrl && (
            <div className="mb-6 aspect-video overflow-hidden rounded-md">
              <img 
                src={existingResponse.imageUrl} 
                alt={existingResponse.text || "Response image"} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {existingResponse.text && (
            <div className="border rounded-md p-4 bg-muted/30">
              <p>{existingResponse.text}</p>
            </div>
          )}
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <div>Submitted: {formatDate(existingResponse.createdAt)}</div>
            <div>{getTimeRemaining(activeQuestion.endDate)}</div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Response
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render the submission form (for new submissions or editing)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingResponse ? "Edit Your Response" : "Submit Your Response"}
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          Week {activeQuestion.weekNumber}: {activeQuestion.question}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label htmlFor="response-text">Your Response (max 200 characters)</Label>
            <div className="mt-1">
              <Textarea
                id="response-text"
                placeholder="Enter your response..."
                value={text}
                onChange={handleTextChange}
                maxLength={200}
                className="resize-none"
                rows={3}
              />
              <div className="text-xs text-right mt-1 text-muted-foreground">
                {text.length}/200 characters
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="response-image">Image</Label>
            <div className="mt-1">
              {imagePreview ? (
                <div className="relative aspect-video mb-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2 bg-background/80"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Image
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select an image, or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (JPG, PNG, GIF up to 5MB)
                  </p>
                </div>
              )}
              <input
                type="file"
                id="response-image"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {getTimeRemaining(activeQuestion.endDate)} for submissions
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {existingResponse && (
          <Button 
            variant="outline" 
            onClick={() => {
              setIsEditing(false);
              setText(existingResponse.text || "");
              setImagePreview(existingResponse.imageUrl);
              setImage(null);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button 
          onClick={existingResponse ? handleUpdate : handleSubmit}
          disabled={isSubmitting || (!text && !image && !imagePreview)}
          className={existingResponse ? "ml-auto" : ""}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {existingResponse ? "Updating..." : "Submitting..."}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {existingResponse ? "Update Response" : "Submit Response"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}