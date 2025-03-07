import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Book, Rating, calculateWeightedRating } from "@shared/schema";
import { MainNav } from "@/components/main-nav";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { RatingDialog } from "@/components/rating-dialog";
import { FollowButton } from "@/components/follow-button";
import { format } from "date-fns";
import { ChevronDown, ExternalLink } from "lucide-react";
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

export default function BookDetails() {
  const [, params] = useRoute("/books/:id");
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const { data: book } = useQuery<Book>({
    queryKey: [`/api/books/${params?.id}`],
  });

  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${params?.id}/ratings`],
  });

  // Record click-through when the page loads
  useEffect(() => {
    if (book?.id) {
      apiRequest(
        'POST', // method as first argument
        `/api/books/${book.id}/click-through`, // url as second argument
        { // data as third argument
          source: 'direct',
          referrer: document.referrer
        }
      );
    }
  }, [book?.id]);

  if (!book) return null;

  const averageRatings = ratings?.length ? {
    overall: ratings.reduce((acc, r) => acc + calculateWeightedRating(r), 0) / ratings.length,
    enjoyment: ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length,
    writing: ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
    themes: ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
    characters: ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length,
    worldbuilding: ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length,
  } : null;

  const filteredRatings = ratings?.filter(rating => {
    const overallRating = calculateWeightedRating(rating);
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
  }).sort((a, b) => calculateWeightedRating(b) - calculateWeightedRating(a));

  return (
    <div>
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full rounded-lg shadow-lg"
            />
            <div className="mt-4 space-y-2">
              <WishlistButton bookId={book.id} className="w-full" />
              {user && (
                <RatingDialog
                  bookId={book.id}
                  trigger={<Button variant="outline" className="w-full">Rate this book</Button>}
                />
              )}
              {Array.isArray(book.referralLinks) && book.referralLinks.length > 0 && (
                <>
                  {book.referralLinks.map((link: ReferralLink, index: number) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                      onClick={async (e) => {
                        e.preventDefault();
                        // Record click-through before navigation
                        await apiRequest(
                          "POST",
                          `/api/books/${book.id}/click-through`,
                          {
                            source: `referral_${link.retailer.toLowerCase()}`,
                            referrer: window.location.pathname
                          }
                        );
                        window.open(link.url, '_blank');
                      }}
                    >
                      <Button variant="outline" className="w-full">
                        {link.customName || link.retailer}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  ))}
                </>
              )}
            </div>
          </div>

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
                  <h3 className="text-lg font-semibold mb-2">Available Formats</h3>
                  <div className="flex gap-4">
                    {book.formats.map((format, index) => (
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
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                        <span className="sr-only">Toggle details</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="space-y-4 mt-4">
                    {book.originalTitle && (
                      <div>
                        <span className="font-medium">Original Title:</span> {book.originalTitle}
                      </div>
                    )}
                    {book.series && (
                      <div>
                        <span className="font-medium">Series:</span> {book.series}
                      </div>
                    )}
                    {book.setting && (
                      <div>
                        <span className="font-medium">Setting:</span> {book.setting}
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
                        <span className="font-medium">Pages:</span> {book.pageCount}
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
                      <span className="font-medium">Language:</span> {book.language}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Ratings & Reviews</h2>
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
                  {averageRatings ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <StarRating rating={Math.round(averageRatings.overall)} readOnly />
                        <span className="text-sm text-muted-foreground">
                          ({ratings?.length} {ratings?.length === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                      <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Enjoyment (30%)</span>
                          <StarRating rating={Math.round(averageRatings.enjoyment)} readOnly size="sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Writing Style (30%)</span>
                          <StarRating rating={Math.round(averageRatings.writing)} readOnly size="sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Themes (20%)</span>
                          <StarRating rating={Math.round(averageRatings.themes)} readOnly size="sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Characters (10%)</span>
                          <StarRating rating={Math.round(averageRatings.characters)} readOnly size="sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">World Building (10%)</span>
                          <StarRating rating={Math.round(averageRatings.worldbuilding)} readOnly size="sm" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No ratings yet</p>
                  )}

                  <div className="space-y-4 mt-8">
                    <h3 className="text-xl font-semibold">Reviews</h3>
                    <div className="max-w-3xl space-y-4">
                      {filteredRatings?.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  </div>
                  {user && (
                    <div className="mt-4">
                      <RatingDialog
                        bookId={book.id}
                        trigger={<Button>Rate this book</Button>}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}