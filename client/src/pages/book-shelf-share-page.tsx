import { useEffect, useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { BookShelfShare } from "@/components/book-shelf-share";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  Share2, 
  BookOpen, 
  MessageCircle,
  Heart,
  Bookmark
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import logoWhite from "@/public/images/logowhite.svg";

interface Comment {
  id: number;
  content: string;
  username: string;
  createdAt: string;
}

export default function BookShelfSharePage() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);
  
  // Extract username and shelfname from query parameters with robust handling of special characters
  let username = "";
  let shelfname = "";
  
  try {
    // Parse search parameters with proper decoding
    const searchParams = new URLSearchParams(search);
    
    // Get username parameter with special character handling
    const rawUsername = searchParams.get("username");
    username = rawUsername ? decodeURIComponent(rawUsername) : "";
    
    // Get shelfname parameter with special character handling
    const rawShelfname = searchParams.get("shelfname");
    shelfname = rawShelfname ? decodeURIComponent(rawShelfname) : "";
    
    // Edge case: If the URL has malformed parameters like ?username=X?shelfname=Y
    if (username && !shelfname) {
      const questionMarkIndex = search.indexOf('?', 1); // Skip the first ? in the search
      if (questionMarkIndex !== -1) {
        const secondPart = search.substring(questionMarkIndex + 1);
        const secondParams = new URLSearchParams(secondPart);
        const rawSecondShelfname = secondParams.get("shelfname");
        shelfname = rawSecondShelfname ? decodeURIComponent(rawSecondShelfname) : "";
      }
    }
    
    // Handle any other special cases like '+' being converted to spaces
    username = username.replace(/\+/g, ' ');
    shelfname = shelfname.replace(/\+/g, ' ');
    
  } catch (error) {
    console.error("Error parsing URL parameters:", error);
    // Fallback to empty values, which will trigger the redirect in useEffect
  }
  
  // Fetch comments for this shelf (mock data for now, replace with actual API)
  const { data: comments = [], refetch: refetchComments } = useQuery<Comment[]>({
    queryKey: [`/api/book-shelf/comments?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelfname)}`],
    enabled: !!username && !!shelfname,
    // This is a placeholder until proper API is implemented
    initialData: [],
  });
  
  useEffect(() => {
    // If username or shelfname is not provided, redirect to the user's shelves
    if (!username || !shelfname) {
      navigate("/profile?tab=bookshelves");
    }
  }, [username, shelfname, navigate]);

  // Function to handle sharing the bookshelf
  const handleShare = async () => {
    try {
      // Create the shareable URL
      const shareUrl = `${window.location.origin}/book-shelf/share?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelfname)}`;
      
      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `${shelfname} by ${username}`,
          text: `Check out this bookshelf: ${shelfname} by ${username}`,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied!",
          description: "The bookshelf link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      // Handle errors (user might have canceled share, or permission denied)
      console.error("Error sharing:", error);
    }
  };
  
  // Function to handle adding a comment (placeholder)
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      // This is a placeholder for the actual API call
      // Replace with actual implementation when API endpoint is created
      /*
      await apiRequest("POST", "/api/book-shelf/comments", {
        username,
        shelfName: shelfname,
        content: commentText,
      });
      */
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
      
      setCommentText("");
      setShowCommentForm(false);
      refetchComments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header with logo */}
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/">
            <img src={logoWhite} alt="Sirened Logo" className="h-8" />
          </Link>
          
          <Button variant="ghost" size="sm" onClick={handleShare} className="text-primary-foreground">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Left sidebar with call-to-action buttons */}
        <div className="w-full md:w-16 bg-primary/10 flex flex-row md:flex-col justify-center md:justify-start items-center p-2 space-y-0 md:space-y-4 space-x-4 md:space-x-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-primary/20"
            onClick={() => window.open('/explore', '_blank')}
          >
            <BookOpen className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-primary/20"
            onClick={() => window.open(`/authors/${username}`, '_blank')}
          >
            <Heart className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-primary/20"
            onClick={() => window.open('/discover', '_blank')}
          >
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Main content area */}
        <div className="flex-grow p-4 md:p-6">
          <Card className="border shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Main shelf content */}
                <div className="w-full md:w-2/3 p-4 md:p-6">
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold">{shelfname}</h1>
                    <Link href={`/authors/${username}`} className="text-primary hover:underline">
                      by {username}
                    </Link>
                  </div>
                  
                  <div className="mb-6">
                    <BookShelfShare username={username} shelfName={shelfname} />
                  </div>
                  
                  {/* Comment button */}
                  <div className="mt-4 flex justify-between items-center border-t pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCommentForm(!showCommentForm)}
                      className="gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Add Comment
                    </Button>
                    
                    {/* Comment form */}
                    {showCommentForm && (
                      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                          <CardContent className="p-4 space-y-4">
                            <h3 className="text-lg font-medium">Add Comment</h3>
                            <Textarea
                              placeholder="Write your comment..."
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setShowCommentForm(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddComment} disabled={!commentText.trim()}>
                                Submit
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right sidebar with notes and comments */}
                <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l">
                  <Tabs defaultValue="notes" className="w-full">
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="notes" className="p-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          <p className="text-muted-foreground text-sm italic">
                            Notes from the shelf owner will appear here.
                          </p>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="comments" className="p-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {comments.length > 0 ? (
                            comments.map((comment) => (
                              <div key={comment.id} className="border rounded-lg p-3 text-sm">
                                <div className="font-medium mb-1">{comment.username || "Anonymous"}</div>
                                <p>{comment.content}</p>
                                <div className="text-xs text-muted-foreground mt-2">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted-foreground text-sm italic">
                              No comments yet. Be the first to comment!
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}