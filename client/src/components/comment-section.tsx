import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { parseMessageContent } from "@/lib/message-parser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Send } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Comment {
  id: number;
  shelfId: number;
  userId: number | null;
  username: string | null;
  displayName: string | null;
  content: string;
  createdAt: string;
  userProfileImage: string | null;
}

interface CommentSectionProps {
  shelfId: number;
  className?: string;
}

export function CommentSection({ shelfId, className }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [anonymousUsername, setAnonymousUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query to fetch comments
  const { 
    data: comments,
    isLoading: isLoadingComments,
    error: commentsError,
    refetch: refetchComments
  } = useQuery<Comment[]>({
    queryKey: [`/api/bookshelves/${shelfId}/comments`]
  });

  // Mutation to add a new comment
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string, username?: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/bookshelves/${shelfId}/comments`,
        commentData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear the comment input
      setNewComment("");
      if (!user) {
        setAnonymousUsername("");
      }
      
      // Display success message
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
      
      // Refetch comments to update the list
      queryClient.invalidateQueries({ queryKey: [`/api/bookshelves/${shelfId}/comments`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add comment: ${error}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Prepare comment data - if logged in, username is automatic
    const commentData: { content: string, username?: string } = {
      content: newComment
    };
    
    // If user is not logged in, use the provided username
    if (!user && anonymousUsername.trim()) {
      commentData.username = anonymousUsername;
    }
    
    addCommentMutation.mutate(commentData);
  };

  // Format date for display
  const formatCommentDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  // Display loading state
  if (isLoadingComments) {
    return (
      <div className={cn("p-4 space-y-4", className)}>
        <h3 className="text-lg font-medium text-foreground">Comments</h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex space-x-4 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted/80"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted/80 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted/80 rounded"></div>
                  <div className="h-4 bg-muted/80 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Display error state
  if (commentsError) {
    return (
      <div className={cn("p-4", className)}>
        <h3 className="text-lg font-medium text-foreground">Comments</h3>
        <div className="p-4 rounded-md bg-red-900/20 border border-red-800 text-red-100 mt-4">
          <p>Error loading comments. Please try again later.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => refetchComments()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <h3 className="text-lg font-medium text-foreground mb-4">Comments</h3>
      
      {/* Comments list - using flex-grow to expand and fill available space */}
      <ScrollArea className="flex-grow pr-4 mb-4 h-[340px]">
        <div className="space-y-4">
          {comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="bg-background/70 border-b border-border rounded-none p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={comment.userProfileImage || undefined} />
                    <AvatarFallback className="bg-muted/80 text-muted">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground/80">
                        {comment.displayName || "Anonymous"}
                      </p>
                      <time className="text-xs text-foreground/50">
                        {formatCommentDate(comment.createdAt)}
                      </time>
                    </div>
                    <div className="text-sm text-foreground break-words">
                      {parseMessageContent(comment.content).map((content, i) => (
                        <React.Fragment key={i}>{content}</React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p>No comments yet. Be the first to leave a comment!</p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Add comment form - using mt-auto to push to bottom if needed */}
      <form onSubmit={handleSubmitComment} className="mt-auto">
        {!user && (
          <div className="flex space-x-2 mb-3">
            <Avatar className="h-10 w-10 border border-gray-600">
              <AvatarFallback className="bg-muted/80 text-gray-300">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <Input
              value={anonymousUsername}
              onChange={(e) => setAnonymousUsername(e.target.value)}
              placeholder="Your name (optional)"
              className="flex-1 bg-gray-800/50 border-gray-700"
            />
          </div>
        )}
        <div className="flex relative space-x-2">
          {user && (
            <Avatar className="h-10 w-10 border border-gray-600">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-muted/80 text-gray-300">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 flex bg-background/20 border-border border rounded">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 min-h-[80px] text-foreground/80 resize-none bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none"
            />
            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="self-end self-center border-l rounded-none text-primary bg-transparent h-full hover:bg-border/20"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}