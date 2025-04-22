import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import {
  Book,
  Rating,
  Author,
  calculateWeightedRating,
  RATING_CRITERIA,
  DEFAULT_RATING_WEIGHTS,
  RatingPreferences,
  GenreTaxonomy,
} from "@shared/schema";
import { Heart, ChevronRight } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { RatingDialog } from "@/components/rating-dialog";
import { FollowButton } from "@/components/follow-button";
import { format } from "date-fns";
import { ChevronDown, ExternalLink, MoreVertical, Ban, Flag } from "lucide-react";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import type { ReferralLink } from "@shared/schema";
import { ReviewCard } from "@/components/review-card";
import { WishlistButton } from "@/components/wishlist-button";
import { ShelveItDialog } from "@/components/shelve-it-dialog";
import { apiRequest } from "@/lib/queryClient";
import { HorizontalBannerAd } from "@/components/banner-ads";
import { ContentReportDialog } from "@/components/content-report-dialog";
import { useTheme } from "@/hooks/use-theme";
// Position-based weights for rating criteria
const POSITION_WEIGHTS = [0.35, 0.25, 0.2, 0.12, 0.08];

// Helper function to get weight percentage for a criteria based on preferences
function getWeightPercentage(
  criteriaName: string,
  prefs?: RatingPreferences,
): string {
  if (!prefs) {
    // Use default weights if no user preferences
    return `${(DEFAULT_RATING_WEIGHTS[criteriaName as keyof typeof DEFAULT_RATING_WEIGHTS] * 100).toFixed(0)}%`;
  }

  // If we have individual weight columns, use those directly
  if (prefs[criteriaName as keyof RatingPreferences] !== undefined) {
    // Convert any string values to numbers for percentage calculation
    const value = prefs[criteriaName as keyof RatingPreferences];
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    return `${(Number(numericValue) * 100).toFixed(0)}%`;
  }

  // Fall back to default weights if preference structure is unknown
  return `${(DEFAULT_RATING_WEIGHTS[criteriaName as keyof typeof DEFAULT_RATING_WEIGHTS] * 100).toFixed(0)}% [[default]] `;
}

export default function BookDetails() {
  const [matchBooksId, paramsById] = useRoute("/books/:id");
  const [matchBookDetails] = useRoute("/book-details");
  const [location] = useLocation();
  const { user } = useAuth();
  const { setIsOpen: setAuthModalOpen } = useAuthModal();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenresExpanded, setIsGenresExpanded] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const {theme} = useTheme();
  // Parse query parameters if we're using the secure URL format
  const urlSearchParams = new URLSearchParams(window.location.search);
  const authorName = urlSearchParams.get('authorName');
  const bookTitle = urlSearchParams.get('bookTitle');
  const isUsingSecureFormat = matchBookDetails && authorName && bookTitle;
  
  // For debugging
  useEffect(() => {
    if (isUsingSecureFormat) {
      console.log(`Using secure book details format with authorName: ${authorName}, bookTitle: ${bookTitle}`);
    } else if (paramsById) {
      console.log(`Using traditional book ID format with ID: ${paramsById.id}`);
    }
  }, [isUsingSecureFormat, authorName, bookTitle, paramsById]);
  
  // Query book data based on URL format
  const { data: book } = useQuery<Book>({
    queryKey: isUsingSecureFormat 
      ? [`/api/public/book-details?authorName=${encodeURIComponent(authorName!)}&bookTitle=${encodeURIComponent(bookTitle!)}`]
      : [`/api/books/${paramsById?.id}`],
    enabled: !!(isUsingSecureFormat || !!paramsById?.id),
  });

  // Ratings still use book ID
  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${book?.id}/ratings`],
    enabled: !!book?.id,
  });

  const { data: author } = useQuery<Author>({
    queryKey: [`/api/books/${book?.id}/author`],
    enabled: !!book?.id, // Only run query when book is loaded
  });
  
  // Fetch publisher information for this author using public endpoint
  const { data: publisher } = useQuery<any>({
    queryKey: [`/api/public/authors/${author?.id}/publisher`],
    enabled: !!author?.id, // Only run query when author is loaded
  });

  // Fetch taxonomies for this book
  const { data: bookTaxonomies = [] } = useQuery<
    {
      taxonomyId: number;
      type: string;
      rank: number;
      name: string;
      description?: string;
    }[]
  >({
    queryKey: [`/api/books/${book?.id}/taxonomies`],
    // This endpoint might return 401 if not authenticated, so we'll handle empty results
    enabled: !!book?.id,
  });

  // Fetch user's rating preferences if logged in
  const { data: ratingPreferences } = useQuery<RatingPreferences>({
    queryKey: ["/api/rating-preferences"],
    enabled: !!user,
  });

  // Record click-through when the page loads
  useEffect(() => {
    if (book?.id) {
      apiRequest("POST", `/api/books/${book.id}/click-through`, {
        source: "direct",
        referrer: document.referrer,
      });
    }
  }, [book?.id]);
  
  // Record impressions for referral links when they are displayed
  useEffect(() => {
    // Only record impressions if the book has referral links
    if (book && book.referralLinks && Array.isArray(book.referralLinks) && book.referralLinks.length > 0) {
      // Record a book impression with each referral link as source
      book.referralLinks.forEach((link: ReferralLink) => {
        apiRequest(
          "POST",
          `/api/books/${book.id}/impression`,
          {
            source: `referral_${link.retailer.toLowerCase()}_display`, 
            context: "book_details"
          }
        ).catch(error => {
          console.error("Failed to record referral link impression:", error);
        });
      });
    }
  }, [book?.id, book?.referralLinks]);

  if (!book) return null;

  // Calculate individual unweighted ratings per vector
  const unweightedRatings = ratings?.length
    ? {
        enjoyment:
          ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length,
        writing:
          ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
        themes: ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
        characters:
          ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length,
        worldbuilding:
          ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length,
      }
    : null;

  // Calculate overall weighted rating using user preferences and the unweighted individual ratings
  const averageRatings = unweightedRatings
    ? {
        ...unweightedRatings,
        overall: calculateWeightedRating(
          {
            enjoyment: unweightedRatings.enjoyment,
            writing: unweightedRatings.writing,
            themes: unweightedRatings.themes,
            characters: unweightedRatings.characters,
            worldbuilding: unweightedRatings.worldbuilding,
          } as Rating,
          ratingPreferences,
        ),
      }
    : null;

  const handleRateClick = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
  };

  const filteredRatings = ratings
    ?.filter((rating) => {
      // Apply user preferences to rating calculation for filtering
      const overallRating = calculateWeightedRating(rating, ratingPreferences);
      switch (ratingFilter) {
        case "5":
          return overallRating >= 4.5;
        case "4":
          return overallRating >= 3.5 && overallRating < 4.5;
        case "3":
          return overallRating >= 2.5 && overallRating < 3.5;
        case "2":
          return overallRating >= 1.5 && overallRating < 2.5;
        case "1":
          return overallRating < 1.5;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // First sort by featured status
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      // Then by rating - using user preferences
      return (
        calculateWeightedRating(b, ratingPreferences) -
        calculateWeightedRating(a, ratingPreferences)
      );
    });

  return (
    <div className="relative">
      {/* Background image */}
      {book.images?.find((img) => img.imageType === "background") && (
        <div
          className="fixed inset-0 w-full h-full z-[-2]  pointer-events-none bg-no-repeat bg-cover bg-center "
          style={{
            backgroundImage: `url('${book.images.find((img) => img.imageType === "background")?.imageUrl}')`,
          }}
        />
      )}
      <div
        className="fixed inset-0 w-full h-full z-[-1]"
        style={{
          background: (theme === "dark") ?
            "linear-gradient(to right, rgb(var(--background-rgb)), rgba(var(--background-rgb), 0.95), rgba(var(--background-rgb), 0.95), rgba(var(--background-rgb), 0.95), rgb(var(--background-rgb)))" : "linear-gradient(to right, rgb(var(--background-rgb)), rgba(var(--background-rgb), 0.92), rgba(var(--background-rgb), 0.90), rgba(var(--background-rgb), 0.92), rgb(var(--background-rgb)))",
        }}
      />
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left column with book cover and action buttons - sticky on desktop, scrollable on mobile */}
          <div className="md:sticky md:top-20 self-start" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="relative">
              <img
                src={
                  book.images?.find((img) => img.imageType === "book-detail")
                    ?.imageUrl || "/images/placeholder-book.png"
                }
                alt={book.title}
                className="w-full rounded-lg shadow-lg"
              />
              <div className="absolute top-2 left-2 flex space-x-2">
                <WishlistButton
                  bookId={book.id}
                  variant="ghost"
                  size="icon"
                  className="bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 text-white hover:text-white [&[data-wishlisted='true']]:text-red-500 [&[data-wishlisted='true']]:hover:text-red-600 transition-colors"
                />
                <ShelveItDialog
                  bookId={book.id}
                  variant="ghost"
                  size="icon"
                  className="bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 text-white hover:text-white transition-colors"
                />
              </div>
            </div>
            {/* Referral links with improved mobile layout */}
            <div className="mt-4 space-y-2 gap-2 overflow-y-auto max-h-[200px] md:max-h-[calc(100vh-500px)]">
              {Array.isArray(book.referralLinks) &&
                book.referralLinks.length > 0 && 
                book.referralLinks.map(
                  (link: ReferralLink, index: number) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block"
                      onClick={async (e) => {
                            // Prevent default to handle the tracking
                            e.preventDefault();
                            
                            // Process the click-through and weight tracking
                            try {
                              // Record weighted impression with referral-click type (weight 1.0)
                              await apiRequest(
                                "POST",
                                `/api/books/${book.id}/impression`,
                                {
                                  source: `referral_${link.retailer.toLowerCase()}_click`,
                                  context: "book_details",
                                  type: "referral-click",
                                  weight: 1.0
                                }
                              );
                              
                              // Also record standard click-through for traditional tracking
                              await apiRequest(
                                "POST",
                                `/api/books/${book.id}/click-through`,
                                {
                                  source: `referral_${link.retailer.toLowerCase()}_click`,
                                  referrer: window.location.pathname,
                                },
                              );
                            } catch (error) {
                              console.error("Failed to record click-through:", error);
                              // Continue with navigation even if tracking fails
                            }
                            
                            // Ensure URL has a proper protocol
                            let targetUrl = link.url;
                            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                              targetUrl = 'https://' + targetUrl;
                            }
                            
                            // Open the URL in a new tab
                            window.open(targetUrl, "_blank");
                          }}
                        >
                          {/* Apply different styles based on position:
                            First link: primary color
                            Second link: secondary color
                            Rest: gray (muted) */}
                          <Button 
                            variant={index === 0 ? "default" : index === 1 ? "outline" : "ghost"} 
                            className="w-full my-1"
                          >
                            {link.faviconUrl && (
                              <img
                                src={link.faviconUrl}
                                alt=""
                                className="w-4 h-4 mr-2 inline-block"
                              />
                            )}
                            <span>
                              {/* Show custom name if available, otherwise show domain or URL */}
                              {link.customName || link.domain || link.url}{" "}
                            </span>
                            <ExternalLink className="w-4 h-4 ml-2 inline-block" />
                          </Button>
                        </a>
                      ),
                    )}
                )
            </div>
          </div>

          {/* Right column with book details */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-4xl font-bold">{book.title}</h1>
                
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">More actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setReportDialogOpen(true)}>
                        <Flag className="mr-2" /> Report content
                      </DropdownMenuItem>
                      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => {
                            e.preventDefault();
                          }}>
                            <Ban className="mr-2" /> Block content
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Block content</DialogTitle>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <p>Select what you'd like to block:</p>
                            <div className="space-y-2">
                              {author?.author_name && (
                                <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={async () => {
                                    if (!user) {
                                      setAuthModalOpen(true);
                                      return;
                                    }
                                    
                                    try {
                                      const res = await apiRequest(
                                        "POST",
                                        "/api/filters",
                                        {
                                          blockType: "author",
                                          blockId: book.authorId,
                                          blockName: author.author_name
                                        }
                                      );
                                      if (res.ok) {
                                        toast({
                                          title: "Author blocked",
                                          description: `You won't see content from ${author.author_name} anymore.`
                                        });
                                        setBlockDialogOpen(false);
                                      } else {
                                        toast({
                                          title: "Failed to block author",
                                          description: "Please try again later.",
                                          variant: "destructive"
                                        });
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to block author. Please try again later.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  <Ban className="mr-2 h-4 w-4" /> 
                                  Block author: {author.author_name}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={async () => {
                                  if (!user) {
                                    setAuthModalOpen(true);
                                    return;
                                  }
                                  
                                  try {
                                    const res = await apiRequest(
                                      "POST",
                                      "/api/filters",
                                      {
                                        blockType: "book",
                                        blockId: book.id,
                                        blockName: book.title
                                      }
                                    );
                                    if (res.ok) {
                                      toast({
                                        title: "Book blocked",
                                        description: `You won't see ${book.title} anymore.`
                                      });
                                      setBlockDialogOpen(false);
                                    } else {
                                      toast({
                                        title: "Failed to block book",
                                        description: "Please try again later.",
                                        variant: "destructive"
                                      });
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to block book. Please try again later.",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <Ban className="mr-2 h-4 w-4" /> 
                                Block book: {book.title}
                              </Button>
                              
                              {/* Display the publisher block option only if the author has a publisher */}
                              {publisher && (
                                <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={async () => {
                                    if (!user) {
                                      setAuthModalOpen(true);
                                      return;
                                    }
                                    
                                    try {
                                      const res = await apiRequest(
                                        "POST",
                                        "/api/filters",
                                        {
                                          blockType: "publisher",
                                          blockId: publisher.id,
                                          blockName: publisher.name
                                        }
                                      );
                                      if (res.ok) {
                                        toast({
                                          title: "Publisher blocked",
                                          description: `You won't see content from ${publisher.name} anymore.`
                                        });
                                        setBlockDialogOpen(false);
                                      } else {
                                        toast({
                                          title: "Failed to block publisher",
                                          description: "Please try again later.",
                                          variant: "destructive"
                                        });
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to block publisher. Please try again later.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  <Ban className="mr-2 h-4 w-4" /> 
                                  Block publisher: {publisher.name}
                                </Button>
                              )}
                              
                              {bookTaxonomies && bookTaxonomies.length > 0 && (
                                <>
                                  <div className="mt-4 pt-4 border-t">
                                    <h4 className="font-medium mb-2">Block genres or themes:</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {bookTaxonomies.map((taxonomy) => (
                                        <Button
                                          key={taxonomy.taxonomyId}
                                          variant="outline"
                                          size="sm"
                                          onClick={async () => {
                                            if (!user) {
                                              setAuthModalOpen(true);
                                              return;
                                            }
                                            
                                            try {
                                              const res = await apiRequest(
                                                "POST",
                                                "/api/filters",
                                                {
                                                  blockType: "taxonomy",
                                                  blockId: taxonomy.taxonomyId,
                                                  blockName: taxonomy.name
                                                }
                                              );
                                              if (res.ok) {
                                                toast({
                                                  title: `"${taxonomy.name}" blocked`,
                                                  description: `You won't see books with the ${taxonomy.type}: ${taxonomy.name}`
                                                });
                                                setBlockDialogOpen(false);
                                              } else {
                                                toast({
                                                  title: "Failed to block taxonomy",
                                                  description: "Please try again later.",
                                                  variant: "destructive"
                                                });
                                              }
                                            } catch (error) {
                                              toast({
                                                title: "Error",
                                                description: "Failed to block taxonomy. Please try again later.",
                                                variant: "destructive"
                                              });
                                            }
                                          }}
                                          className="flex items-center gap-1"
                                        >
                                          <Ban className="h-3 w-3" />
                                          <span className={taxonomy.type === "genre" ? "font-medium" : ""}>
                                            {taxonomy.name}
                                          </span>
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-xl">
                  by{" "}
                  <Link
                    href={`/author?authorName=${encodeURIComponent(author?.author_name || book.authorName || '')}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {author?.author_name || book.authorName}
                  </Link>
                </p>
                {author?.author_name && (
                  <FollowButton
                    authorId={book.authorId}
                    authorName={author.author_name}
                    className="ml-2"
                  />
                )}
              </div>

              <div className="relative mb-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <TooltipProvider>
                    {bookTaxonomies && bookTaxonomies.length > 0 ? (
                      <>
                        {bookTaxonomies.slice(0, 5).map((taxonomy) => (
                          <Tooltip key={`${taxonomy.taxonomyId}-${taxonomy.rank}`}>
                            <TooltipTrigger>
                              <div>
                                <Badge
                                  variant={
                                    taxonomy.type === "genre"
                                      ? "default"
                                      : taxonomy.type === "subgenre"
                                      ? "secondary"
                                      : taxonomy.type === "theme"
                                      ? "outline"
                                      : "destructive"
                                  }
                                  className="text-sm cursor-help"
                                >
                                  {taxonomy.name}
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            {taxonomy.description && (
                              <TooltipContent className="max-w-xs">
                                <p>{taxonomy.description}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        ))}
                        
                        {bookTaxonomies.length > 5 && (
                          <>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 ml-1"
                              onClick={() => setIsGenresExpanded(!isGenresExpanded)}
                            >
                              <span>+{bookTaxonomies.length - 5} more</span>
                              <ChevronDown 
                                className={`h-3 w-3 transition-transform duration-200 ${
                                  isGenresExpanded ? "transform rotate-180" : ""
                                }`} 
                              />
                            </Button>
                            
                            {isGenresExpanded && (
                              <div 
                                className="absolute z-10 top-full left-0 mt-2 p-4 rounded-md shadow-lg border bg-background w-full
                                animate-in slide-in-from-top-2 fade-in-0 duration-300"
                              >
                                <ScrollArea className="max-h-[40vh]">
                                  <div className="flex flex-wrap gap-2">
                                    {bookTaxonomies.map((taxonomy) => (
                                      <Tooltip
                                        key={`expanded-${taxonomy.taxonomyId}-${taxonomy.rank}`}
                                      >
                                        <TooltipTrigger>
                                          <div>
                                            <Badge
                                              variant={
                                                taxonomy.type === "genre"
                                                  ? "default"
                                                  : taxonomy.type === "subgenre"
                                                  ? "secondary"
                                                  : taxonomy.type === "theme"
                                                  ? "outline"
                                                  : "destructive"
                                              }
                                              className="text-sm cursor-help"
                                            >
                                              {taxonomy.name}
                                            </Badge>
                                          </div>
                                        </TooltipTrigger>
                                        {taxonomy.description && (
                                          <TooltipContent className="max-w-xs">
                                            <p>{taxonomy.description}</p>
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      // Fallback for compatibility with older books that still use the genres array
                      Array.isArray((book as any).genres) &&
                      (book as any).genres.map((genre: string) => (
                        <Badge key={genre} variant="secondary" className="text-sm">
                          {genre}
                        </Badge>
                      ))
                    )}
                  </TooltipProvider>
                </div>
              </div>

              {book.formats && book.formats.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Available Formats
                  </h3>
                  <div className="flex gap-4">
                    {book.formats.map((format) => (
                      <span
                        key={format}
                        className="text-sm bg-muted px-4 py-2 rounded-md"
                      >
                        {format.charAt(0).toUpperCase() + format.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-base md:text-lg break-words overflow-hidden">
                {book.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 max-w-full">{paragraph}</p>
                ))}
              </div>

              <div className="grid gap-8">
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">More Details</h2>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            isOpen ? "transform rotate-180" : ""
                          }`}
                        />
                        <span className="sr-only">Toggle details</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="space-y-4 mt-4">
                    {book.originalTitle && (
                      <div>
                        <span className="font-medium">Original Title:</span>{" "}
                        {book.originalTitle}
                      </div>
                    )}
                    {book.series && (
                      <div>
                        <span className="font-medium">Series:</span>{" "}
                        {book.series}
                      </div>
                    )}
                    {book.setting && (
                      <div>
                        <span className="font-medium">Setting:</span>{" "}
                        {book.setting}
                      </div>
                    )}
                    {book.characters && book.characters.length > 0 && (
                      <div>
                        <span className="font-medium">Characters:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {book.characters.map((character, index) => (
                            <Badge key={index} variant="outline">
                              {character}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {book.awards && book.awards.length > 0 && (
                      <div>
                        <span className="font-medium">Awards:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {book.awards.map((award, index) => (
                            <Badge key={index} variant="outline">
                              {award}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {book.pageCount && (
                      <div>
                        <span className="font-medium">Pages:</span>{" "}
                        {book.pageCount}
                      </div>
                    )}
                    {book.publishedDate && (
                      <div>
                        <span className="font-medium">Published:</span>{" "}
                        {format(new Date(book.publishedDate), "MMMM d, yyyy")}
                      </div>
                    )}
                    {book.isbn && (
                      <div>
                        <span className="font-medium">ISBN:</span> {book.isbn}
                      </div>
                    )}
                    {book.asin && (
                      <div>
                        <span className="font-medium">ASIN:</span> {book.asin}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Language:</span>{" "}
                      {book.language}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <h2 className="text-2xl font-semibold">
                      Ratings & Reviews
                    </h2>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <RatingDialog
                        bookId={book.id}
                        trigger={
                          <Button onClick={handleRateClick} className="w-full sm:w-auto">
                            Rate this book
                          </Button>
                        }
                      />
                      <Select
                        value={ratingFilter}
                        onValueChange={setRatingFilter}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Ratings</SelectItem>
                          <SelectItem value="5">5 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="2">2 Stars</SelectItem>
                          <SelectItem value="1">1 Star</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {averageRatings ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <StarRating rating={averageRatings.overall} readOnly />
                        <span className="text-sm text-muted-foreground">
                          ({averageRatings.overall.toFixed(2)})
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {ratingPreferences ? (
                          // If user has preferences, show a message
                          <p className="text-xs text-muted-foreground mb-2">
                            Showing ratings weighted to your preferences
                          </p>
                        ) : null}
                        <div className="flex justify-between items-center">
                          <span className="text-sm">
                            Enjoyment (
                            {getWeightPercentage(
                              "enjoyment",
                              ratingPreferences,
                            )}
                            )
                          </span>
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={averageRatings.enjoyment}
                              readOnly
                              size="sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              ({averageRatings.enjoyment.toFixed(2)})
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">
                            Writing (
                            {getWeightPercentage("writing", ratingPreferences)})
                          </span>
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={averageRatings.writing}
                              readOnly
                              size="sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              ({averageRatings.writing.toFixed(2)})
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">
                            Themes (
                            {getWeightPercentage("themes", ratingPreferences)})
                          </span>
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={averageRatings.themes}
                              readOnly
                              size="sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              ({averageRatings.themes.toFixed(2)})
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">
                            Characters (
                            {getWeightPercentage(
                              "characters",
                              ratingPreferences,
                            )}
                            )
                          </span>
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={averageRatings.characters}
                              readOnly
                              size="sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              ({averageRatings.characters.toFixed(2)})
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">
                            World Building (
                            {getWeightPercentage(
                              "worldbuilding",
                              ratingPreferences,
                            )}
                            )
                          </span>
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={averageRatings.worldbuilding}
                              readOnly
                              size="sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              ({averageRatings.worldbuilding.toFixed(2)})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No ratings yet</p>
                  )}

                  {/* Horizontal Banner Ad */}
                  {book.id && (
                    <div className="my-8">
                      <HorizontalBannerAd
                        campaignId={1}
                        bookId={book.id}
                        imageSrc={
                          book.images?.find(
                            (img) => img.imageType === "book-detail",
                          )?.imageUrl || "/images/placeholder-book.png"
                        }
                        title={`Readers also enjoyed: ${book.title}`}
                        description="More from this author and similar titles you might enjoy."
                        ctaText="Explore More"
                        source="book-details"
                        position="before-reviews"
                      />
                    </div>
                  )}

                  <div className="space-y-4 mt-8">
                    <h3 className="text-xl font-semibold">Reviews</h3>
                    <div className="max-w-3xl space-y-4">
                      {filteredRatings?.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Report Content Dialog */}
      {book && (
        <ContentReportDialog 
          bookId={book.id} 
          open={reportDialogOpen} 
          onOpenChange={setReportDialogOpen} 
        />
      )}
    </div>
  );
}
