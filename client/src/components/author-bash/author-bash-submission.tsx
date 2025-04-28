import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Helper function for FormData requests
async function formDataRequest(url: string, options: { method: string; body: FormData }) {
  const res = await fetch(url, {
    method: options.method,
    body: options.body,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle, Upload } from "lucide-react";

export default function AuthorBashSubmission() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const maxChars = 200;

  // Define types for API responses
  interface Question {
    id: number;
    question: string;
    weekNumber: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }

  interface Response {
    id: number;
    questionId: number;
    authorId: number;
    text: string;
    imageUrl: string;
    retentionCount: number;
    impressionCount: number;
  }

  // Fetch the current active question
  const { data: activeQuestion, isLoading: isLoadingQuestion } = useQuery<Question>({
    queryKey: ["/api/authorbash/questions/active"],
    retry: false,
  });

  // Fetch author's existing response (if any)
  const { data: myResponse, isLoading: isLoadingResponse } = useQuery<Response>({
    queryKey: ["/api/authorbash/responses/mine"],
    retry: false,
    // Using .catch for error handling instead of onError
    // to be compatible with the TanStack Query API
  });

  // Setup mutation for submitting a response
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      let url = "/api/authorbash/responses";
      let method = "POST";
      
      // If editing an existing response
      if (myResponse?.id) {
        url = `/api/authorbash/responses/${myResponse.id}`;
        method = "PATCH";
      }
      
      return formDataRequest(url, {
        method,
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: myResponse?.id ? "Response updated!" : "Response submitted!",
        description: "Your response has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/authorbash/responses/mine"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.error || "Failed to submit your response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle text input change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= maxChars) {
      setText(newText);
      setCharCount(newText.length);
    }
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeQuestion) {
      toast({
        title: "No active question",
        description: "There is no active question to respond to at this time.",
        variant: "destructive",
      });
      return;
    }
    
    if (!text.trim()) {
      toast({
        title: "Text required",
        description: "Please enter a response text.",
        variant: "destructive",
      });
      return;
    }
    
    if (!imageFile && !myResponse?.imageUrl) {
      toast({
        title: "Image required",
        description: "Please select an image for your response.",
        variant: "destructive",
      });
      return;
    }
    
    // Create form data for the submission
    const formData = new FormData();
    formData.append("text", text);
    if (imageFile) {
      formData.append("image", imageFile);
    }
    
    mutation.mutate(formData);
  };

  // Initialize form with existing response (if any)
  useEffect(() => {
    if (myResponse) {
      setText(myResponse.text);
      setCharCount(myResponse.text.length);
      if (myResponse.imageUrl) {
        setPreviewUrl(myResponse.imageUrl);
      }
    }
  }, [myResponse]);

  if (isLoadingQuestion) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading question...</span>
      </div>
    );
  }

  if (!activeQuestion) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Active Question</AlertTitle>
        <AlertDescription>
          There is no active question available at this time. Please check back later.
        </AlertDescription>
      </Alert>
    );
  }

  const hasSubmitted = !!myResponse;

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>This Week's Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{activeQuestion.question}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Week {activeQuestion.weekNumber} • Ending {new Date(activeQuestion.endDate).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {hasSubmitted && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Response Submitted</AlertTitle>
          <AlertDescription>
            You have already submitted a response to this question. You can edit your response below.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{hasSubmitted ? "Edit Your Response" : "Submit Your Response"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="response-text">Your Response</Label>
              <Textarea 
                id="response-text"
                placeholder="Your response in 200 characters or less..."
                value={text}
                onChange={handleTextChange}
                className="mt-1 resize-none"
                rows={3}
              />
              <div className="text-right text-sm text-muted-foreground mt-1">
                {charCount}/{maxChars} characters
              </div>
            </div>

            <div>
              <Label htmlFor="response-image">Image</Label>
              <div className="mt-1">
                <Input
                  id="response-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mb-2"
                />
                {previewUrl && (
                  <div className="relative mt-2 rounded-md overflow-hidden border border-input">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-[300px] w-auto mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {hasSubmitted ? "Updating..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {hasSubmitted ? "Update Response" : "Submit Response"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}