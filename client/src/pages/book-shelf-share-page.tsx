import { useEffect, useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { BookShelfShare } from "@/components/book-shelf-share";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  MessageCircle,
  BookOpen,
  User,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import logoWhite from "@/public/images/logowhite.svg";
import { BookRack } from "@/components/book-rack";
import { useQuery } from "@tanstack/react-query";
import { Book } from "../types";

interface Comment {
  id: number;
  content: string;
  username: string;
  createdAt: string;
}

// Define the shelf data structure
interface ShelfData {
  shelf: {
    id: number;
    userId: number;
    title: string;
    coverImageUrl: string;
    createdAt: string;
    updatedAt: string;
  };
  books: Book[];
  bookNotes: any[];
  shelfNotes: any[];
}

// Mock comments data for display purposes
const mockComments: Comment[] = [
  {
    id: 1,
    content: "Wait? You like this book too?",
    username: "User 1",
    createdAt: "2026-03-04T03:24:00Z"
  },
  {
    id: 2,
    content: "Hey if you like these books you should check out my shelf 👇",
    username: "User 2",
    createdAt: "2026-03-04T03:24:00Z"
  },
  {
    id: 3,
    content: "Hey great selection. What the author's characterization are absolutely fascinating.",
    username: "Anonymous",
    createdAt: "2026-03-04T04:32:00Z"
  }
];

export default function BookShelfSharePage() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  
  // First extract URL parameters
  const [pageParams, setPageParams] = useState<{username: string, shelfname: string}>({
    username: "",
    shelfname: ""
  });
  
  // Extract URL parameters on component mount
  useEffect(() => {
    let extractedUsername = "";
    let extractedShelfname = "";
    
    try {
      // Parse search parameters with proper decoding
      const searchParams = new URLSearchParams(search);
      
      // Get username parameter with special character handling
      const rawUsername = searchParams.get("username");
      extractedUsername = rawUsername ? decodeURIComponent(rawUsername) : "";
      
      // Get shelfname parameter with special character handling
      const rawShelfname = searchParams.get("shelfname");
      extractedShelfname = rawShelfname ? decodeURIComponent(rawShelfname) : "";
      
      // Edge case: If the URL has malformed parameters like ?username=X?shelfname=Y
      if (extractedUsername && !extractedShelfname) {
        const questionMarkIndex = search.indexOf('?', 1); // Skip the first ? in the search
        if (questionMarkIndex !== -1) {
          const secondPart = search.substring(questionMarkIndex + 1);
          const secondParams = new URLSearchParams(secondPart);
          const rawSecondShelfname = secondParams.get("shelfname");
          extractedShelfname = rawSecondShelfname ? decodeURIComponent(rawSecondShelfname) : "";
        }
      }
      
      // Handle any other special cases like '+' being converted to spaces
      extractedUsername = extractedUsername.replace(/\+/g, ' ');
      extractedShelfname = extractedShelfname.replace(/\+/g, ' ');
      
      // Update state with extracted parameters
      setPageParams({
        username: extractedUsername,
        shelfname: extractedShelfname
      });
    } catch (error) {
      console.error("Error parsing URL parameters:", error);
      // Fallback to empty values, which will trigger the redirect in useEffect
    }
  }, [search]);

  // Fetch the bookshelf data with exact query parameter names as expected by the server
  const { data: shelfData, isLoading: isShelfLoading } = useQuery<ShelfData>({
    queryKey: [`/api/book-shelf?username=${encodeURIComponent(pageParams.username)}&shelfname=${encodeURIComponent(pageParams.shelfname)}`],
    enabled: !!pageParams.username && !!pageParams.shelfname,
  });
  
  // Only redirect if BOTH username and shelfname are missing
  // This ensures we don't redirect prematurely when parameters are being loaded
  useEffect(() => {
    if (search && !pageParams.username && !pageParams.shelfname) {
      console.log('Missing both username and shelfname parameters, redirecting to profile');
      navigate("/profile?tab=bookshelves");
    }
  }, [pageParams, navigate, search]);

  // Function to handle sharing the bookshelf
  const handleShare = async () => {
    try {
      // Create the shareable URL - ensure we're using the correct route format
      const shareUrl = `${window.location.origin}/book-shelf/share?username=${encodeURIComponent(pageParams.username)}&shelfname=${encodeURIComponent(pageParams.shelfname)}`;
      
      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `${pageParams.shelfname} by ${pageParams.username}`,
          text: `Check out this bookshelf: ${pageParams.shelfname} by ${pageParams.username}`,
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
  
  // Function to handle adding a comment
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    // Add the new comment to the local state
    const newComment: Comment = {
      id: Date.now(),
      content: commentText,
      username: user?.username || "Anonymous",
      createdAt: new Date().toISOString()
    };
    
    setComments([newComment, ...comments]);
    setCommentText("");
    setShowCommentForm(false);
    
    toast({
      title: "Comment Added",
      description: "Your comment has been added successfully."
    });
    
    // In a real implementation, you would save this to the database
    // await apiRequest("POST", "/api/book-shelf/comments", {
    //   username: pageParams.username,
    //   shelfName: pageParams.shelfname,
    //   content: commentText,
    // });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-2 py-2">
        <div className="flex flex-col">
          {/* Top section with logo and share button */}
          <div className="flex justify-between items-center mb-4">
            <img src={logoWhite} alt="Sirened Logo" className="h-10" />
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-white">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Main content container */}
          <div className="flex flex-row">
            {/* Left sidebar with author's call-to-action buttons */}
            <div className="w-10 space-y-4 mr-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1 bg-zinc-900 rounded-md"
                onClick={() => window.open('https://valkyriextruck.com/book', '_blank')}
              >
                <BookOpen className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1 bg-zinc-900 rounded-md"
                onClick={() => window.open('https://valkyriextruck.com', '_blank')}
              >
                <User className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1 bg-zinc-900 rounded-md"
                onClick={() => window.open('https://x.com/thekingofstank', '_blank')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Book content card */}
            <div className="flex-grow flex bg-zinc-900 rounded-md overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Left side: Book details */}
                <div className="w-full md:w-2/3 p-4">
                  <BookShelfShare 
                    username={pageParams.username} 
                    shelfName={pageParams.shelfname} 
                  />
                  
                  {/* Comment button at bottom */}
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCommentForm(!showCommentForm)}
                      className="gap-2 bg-transparent border border-zinc-700 text-white"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Comment
                    </Button>
                  </div>
                </div>
                
                {/* Right side: Comments section */}
                <div className="w-full md:w-1/3 bg-zinc-800/70 p-4">
                  <ScrollArea className="h-[500px] pr-2">
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="border-b border-zinc-700 pb-3 mb-3 text-sm">
                          <div className="font-medium mb-1 flex items-center">
                            <span>{comment.username}</span>
                            <span className="text-xs text-zinc-400 ml-2">
                              {new Date(comment.createdAt).toLocaleDateString()} - {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="text-zinc-200">{comment.content}</p>
                          
                          {/* Show shelf link for mock data demonstration */}
                          {comment.id === 2 && (
                            <div className="mt-2 flex items-center bg-zinc-900 rounded p-2">
                              <div className="w-8 h-8 bg-gray-700 mr-2 rounded"></div>
                              <div className="text-xs">
                                <div className="font-bold">[ BOOK SHELF NAME ]</div>
                                <div className="text-zinc-400">User</div>
                                <div className="text-xs text-zinc-500">sirened.com</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bookshelf display at the bottom using BookRack component */}
      <div className="mt-8 px-2">
        <h3 className="text-lg font-semibold text-white mb-2">{pageParams.shelfname}</h3>
        <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-md">
          {/* Use BookRack component with real data */}
          <BookRack 
            title="" 
            books={shelfData?.books || []} 
            isLoading={isShelfLoading}
            className="m-0 mb-0 h-36" // Custom height for the rack
          />
        </div>
      </div>
      
      {/* Comment form modal */}
      {showCommentForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-700">
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-medium text-white">Add Comment</h3>
              <Textarea
                placeholder="Write your comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCommentForm(false)} className="bg-transparent text-white border-zinc-700">
                  Cancel
                </Button>
                <Button onClick={handleAddComment} disabled={!commentText.trim()} className="bg-purple-700 hover:bg-purple-600">
                  Submit
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}