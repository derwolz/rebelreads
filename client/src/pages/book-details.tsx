import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Book, Rating, calculateWeightedRating, RATING_CRITERIA, DEFAULT_RATING_WEIGHTS } from "@shared/schema";
import { Heart } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { RatingDialog } from "@/components/rating-dialog";
import { FollowButton } from "@/components/follow-button";
import { format } from "date-fns";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useAuthModal } from "@/hooks/use-auth-modal";
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
import { useState, useEffect } from "react";
import type { ReferralLink } from "@shared/schema";
import { ReviewCard } from "@/components/review-card";
import { WishlistButton } from "@/components/wishlist-button";
import { apiRequest } from "@/lib/queryClient";
import { HorizontalBannerAd } from "@/components/banner-ads";

// Position-based weights for rating criteria
const POSITION_WEIGHTS = [0.35, 0.25, 0.20, 0.12, 0.08];

// Helper function to get weight percentage for a criteria based on position
function getWeightPercentage(criteriaName: string, criteriaOrder?: string[], criteriaWeights?: Record<string, number>): string {
  if (!criteriaOrder) {
    // Use default weights if no user preferences
    return `${(DEFAULT_RATING_WEIGHTS[criteriaName as keyof typeof DEFAULT_RATING_WEIGHTS] * 100).toFixed(0)}%`;
  }
  
  // If we have criteriaWeights, use those directly
  if (criteriaWeights && criteriaWeights[criteriaName]) {
    return `${(criteriaWeights[criteriaName] * 100).toFixed(0)}%`;
  }
  
  // Otherwise, fall back to position-based calculations
  const position = criteriaOrder.indexOf(criteriaName);
  if (position === -1) return "0%"; // Not found
  
  // Use the weight based on position
  return `${(POSITION_WEIGHTS[position] * 100).toFixed(0)}%`;
}

export default function BookDetails() {
  const [, params] = useRoute("/books/:id");
  const { user } = useAuth();
  const { setIsOpen: setAuthModalOpen } = useAuthModal();
  const [isOpen, setIsOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const { data: book } = useQuery<Book>({
    queryKey: [`/api/books/${params?.id}`],
  });

  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${params?.id}/ratings`],
  });
  
  // Fetch user's rating preferences if logged in
  const { data: ratingPreferences } = useQuery<{ 
    criteriaOrder: string[];
    criteriaWeights: Record<string, number>;
  }>({
    queryKey: ['/api/account/rating-preferences'],
    enabled: !!user,
  });

  // Record click-through when the page loads
  useEffect(() => {
    if (book?.id) {
      apiRequest(
        "POST",
        `/api/books/${book.id}/click-through`,
        {
          source: "direct",
          referrer: document.referrer,
        },
      );
    }
  }, [book?.id]);

  if (!book) return null;

  // Get user's rating preferences if available
  const userCriteriaOrder = ratingPreferences?.criteriaOrder;
  
  const averageRatings = ratings?.length
    ? {
        // Use user's preferences for the overall rating if available
        overall:
          ratings.reduce((acc, r) => acc + calculateWeightedRating(r, undefined, userCriteriaOrder), 0) /
          ratings.length,
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

  const handleRateClick = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
  };

  const filteredRatings = ratings
    ?.filter((rating) => {
      // Apply user preferences to rating calculation for filtering
      const overallRating = calculateWeightedRating(rating, undefined, userCriteriaOrder);
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
      return calculateWeightedRating(b, undefined, userCriteriaOrder) - 
             calculateWeightedRating(a, undefined, userCriteriaOrder);
    });

  return (
    <div>
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left column with book cover and action buttons */}
          <div>
            <div className="relative">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full rounded-lg shadow-lg"
              />
              <div className="absolute top-2 left-2">
                <WishlistButton
                  bookId={book.id}
                  variant="ghost"
                  size="icon"
                  className="bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 text-white hover:text-white [&[data-wishlisted='true']]:text-red-500 [&[data-wishlisted='true']]:hover:text-red-600 transition-colors"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {Array.isArray(book.referralLinks) &&
                book.referralLinks.length > 0 && (
                  <>
                    {book.referralLinks.map(
                      (link: ReferralLink, index: number) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                          onClick={async (e) => {
                            e.preventDefault();
                            await apiRequest(
                              "POST",
                              `/api/books/${book.id}/click-through`,
                              {
                                source: `referral_${link.retailer.toLowerCase()}`,
                                referrer: window.location.pathname,
                              },
                            );
                            window.open(link.url, "_blank");
                          }}
                        >
                          <Button variant="outline" className="w-full">
                            {link.customName || link.retailer}
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      ),
                    )}
                  </>
                )}
            </div>
          </div>

          {/* Right column with book details */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-xl">
                  by{" "}
                  <Link
                    href={`/authors/${book.authorId}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {book.author}
                  </Link>
                </p>
                <FollowButton
                  authorId={book.authorId}
                  authorName={book.author}
                  className="ml-2"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {book.genres.map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-sm">
                    {genre}
                  </Badge>
                ))}
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

              <p className="text-lg">{book.description}</p>

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
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">
                      Ratings & Reviews
                    </h2>
                    <div className="flex items-center gap-4">
                      <RatingDialog
                        bookId={book.id}
                        trigger={
                          <Button onClick={handleRateClick}>
                            Rate this book
                          </Button>
                        }
                      />
                      <Select
                        value={ratingFilter}
                        onValueChange={setRatingFilter}
                      >
                        <SelectTrigger className="w-[180px]">
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
                        <StarRating
                          rating={averageRatings.overall}
                          readOnly
                        />
                        <span className="text-sm text-muted-foreground">
                          ({averageRatings.overall.toFixed(2)})
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {userCriteriaOrder ? (
                          // If user has preferences, show a message
                          <p className="text-xs text-muted-foreground mb-2">
                            Showing ratings weighted to your preferences
                          </p>
                        ) : null}
                        <div className="flex justify-between items-center">
                          <span className="text-sm">
                            Enjoyment ({getWeightPercentage("enjoyment", ratingPreferences?.criteriaOrder, ratingPreferences?.criteriaWeights)})
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
                            Writing ({getWeightPercentage("writing", ratingPreferences?.criteriaOrder, ratingPreferences?.criteriaWeights)})
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
                            Themes ({getWeightPercentage("themes", ratingPreferences?.criteriaOrder, ratingPreferences?.criteriaWeights)})
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
                            Characters ({getWeightPercentage("characters", ratingPreferences?.criteriaOrder, ratingPreferences?.criteriaWeights)})
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
                            World Building ({getWeightPercentage("worldbuilding", ratingPreferences?.criteriaOrder, ratingPreferences?.criteriaWeights)})
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
                        imageSrc={book.coverUrl}
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
    </div>
  );
}