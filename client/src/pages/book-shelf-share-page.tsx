import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { BookShelfShare } from "@/components/book-shelf-share";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BookShelfSharePage() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Extract username and shelfname from query parameters
  // In the URL the query params might look like ?username=user&shelfname=shelf
  // Or it might be ?username=user?shelfname=shelf (note the second ? instead of &)
  // We need to handle both cases
  let username = "";
  let shelfname = "";

  // Extract from regular format ?username=X&shelfname=Y
  const standardParams = new URLSearchParams(search);
  username = standardParams.get("username") || "";
  shelfname = standardParams.get("shelfname") || "";

  // If username exists but not shelfname, try to extract from ?username=X?shelfname=Y format
  if (username && !shelfname) {
    const questionMarkIndex = search.indexOf('?', 1); // Skip the first ? in the search
    if (questionMarkIndex !== -1) {
      const secondPart = search.substring(questionMarkIndex + 1);
      const secondParams = new URLSearchParams(secondPart);
      shelfname = secondParams.get("shelfname") || "";
    }
  }
  
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile?tab=bookshelves")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{shelfname}</h1>
          <span className="text-muted-foreground">by {username}</span>
        </div>
        
        {/* Show share button if the user is the owner */}
        {user?.username === username && (
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </div>
      
      {/* Main content with the BookShelfShare component */}
      <div className="mb-12">
        <BookShelfShare username={username} shelfName={shelfname} />
      </div>
    </main>
  );
}