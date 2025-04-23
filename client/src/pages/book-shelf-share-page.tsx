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
    
    // Log parameters for debugging
    console.log("BookShelfSharePage parameters:", { username, shelfname });
    
  } catch (error) {
    console.error("Error parsing URL parameters:", error);
    // Fallback to empty values, which will trigger the redirect in useEffect
  }
  
  useEffect(() => {
    // If username or shelfname is not provided, log it but don't redirect
    if (!username || !shelfname) {
      console.log("Missing parameters in book-shelf-share URL:", { username, shelfname });
      // No redirect here - just log the issue
    }
  }, [username, shelfname]);

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
    <main className="w-full flex justify-center bg-background min-h-[calc(100vh-5rem)] text-foreground p-0 m-0 pt-6">
      <BookShelfShare username={username} shelfName={shelfname} />
    </main>
  );
}