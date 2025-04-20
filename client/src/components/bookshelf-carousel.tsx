import { Link } from "wouter";
import { BookShelf } from "@shared/schema";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, BookOpen, Share2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BookshelfCarouselProps {
  bookshelves?: BookShelf[];
  isLoading: boolean;
}

export function BookshelfCarousel({ bookshelves, isLoading }: BookshelfCarouselProps) {
  // Define custom options for carousel
  const carouselOptions = {
    align: "start" as const,
    dragFree: true,
    containScroll: "trimSnaps" as const,
  };

  return (
    <div className="relative">
      <Carousel className="w-full" opts={carouselOptions}>
        <CarouselContent>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <CarouselItem key={i} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <BookshelfCardSkeleton />
                </CarouselItem>
              ))
            : bookshelves && bookshelves.length > 0
            ? bookshelves.map((shelf) => (
                <CarouselItem key={shelf.id} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <BookshelfCard shelf={shelf} />
                </CarouselItem>
              ))
            : (
              <CarouselItem className="basis-full">
                <div className="flex flex-col items-center justify-center h-40 bg-muted/20 rounded-lg p-4 text-center">
                  <Book className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No bookshelves yet. Create one in your profile settings.
                  </p>
                </div>
              </CarouselItem>
            )}
        </CarouselContent>
        {bookshelves && bookshelves.length > 1 && (
          <>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </>
        )}
      </Carousel>
    </div>
  );
}

interface BookshelfCardProps {
  shelf: BookShelf;
}

function BookshelfCard({ shelf }: BookshelfCardProps) {
  // Get the username from useAuth hook
  const { user } = useAuth();
  const { toast } = useToast();
  const username = user?.username || "";
  const [showShareButton, setShowShareButton] = useState(false);
  
  // Create the regular and dedicated view URLs
  const shelfUrl = `/book-shelf?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelf.title)}`;
  const shareUrl = `${window.location.origin}/book-shelf/share?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelf.title)}`;
  
  // Handle copying the share URL
  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();  // Prevent navigation
    e.stopPropagation(); // Stop event from bubbling to parent link

    try {
      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `${shelf.title} Bookshelf by ${username}`,
          text: `Check out my bookshelf: ${shelf.title}`,
          url: shareUrl
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Share link copied!",
          description: "The link to your bookshelf has been copied to clipboard.",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setShowShareButton(true)}
      onMouseLeave={() => setShowShareButton(false)}
    >
      <Link href={shelfUrl}>
        <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer">
          <div className="aspect-[3/4] relative">
            <img
              src={shelf.coverImageUrl || "/images/default-bookshelf-cover.svg"}
              alt={shelf.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-medium text-lg line-clamp-2">{shelf.title}</h3>
            </div>
            
            {/* Share button - shown on hover */}
            <div className={`absolute top-2 right-2 transition-opacity duration-200 ${showShareButton ? 'opacity-100' : 'opacity-0'}`}>
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={handleShareClick}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Dedicated view button */}
            <div className={`absolute top-2 left-2 transition-opacity duration-200 ${showShareButton ? 'opacity-100' : 'opacity-0'}`}>
              <a 
                href={`/book-shelf/share?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelf.title)}`}
                onClick={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
          <CardContent className="p-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">View Shelf</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function BookshelfCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="aspect-[3/4] bg-muted animate-pulse" />
      <CardContent className="p-3">
        <Skeleton className="h-5 w-full" />
      </CardContent>
    </Card>
  );
}