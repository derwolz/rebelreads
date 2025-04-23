import { useState, useEffect } from "react";
import { Book, Author } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info, Heart, Book as BookIcon, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Rating, SocialMediaLink } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
// Importing only the icons we need
import { FiTwitter, FiInstagram, FiFacebook, FiLinkedin, FiGithub } from "react-icons/fi";
import { ReferralButton } from "./referral-button";

interface BookDetailsCardProps {
  book: Book | null;
  className?: string;
}

export function BookDetailsCard({ book, className }: BookDetailsCardProps) {
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);

  // Fetch book ratings if we have a book
  const { data: ratings } = useQuery<Rating[]>({
    queryKey: book ? [`/api/books/${book.id}/ratings`] : ["null-ratings"],
    enabled: !!book,
  });

  // Fetch author details if we have a book
  const { data: author } = useQuery<Author>({
    queryKey: book ? [`/api/authors/${book.authorId}`] : ["null-author"],
    enabled: !!book?.authorId,
  });

  // Fetch top taxonomies (genres, themes, tropes) for the book
  const { data: taxonomies } = useQuery<any[]>({
    queryKey: book ? [`/api/books/${book.id}/taxonomies`] : ["null-taxonomies"],
    enabled: !!book,
  });

  // Record impression when book details are viewed
  useEffect(() => {
    if (book && !hasRecordedImpression) {
      const recordImpression = async () => {
        await apiRequest("POST", `/api/books/${book.id}/impression`, {
          source: "shelf-detail-card",
          context: window.location.pathname,
          type: "detail-expand",
          weight: 0.25
        });
        setHasRecordedImpression(true);
      };
      recordImpression();
    }

    // Reset the impression flag when book changes
    return () => {
      setHasRecordedImpression(false);
    };
  }, [book?.id]);

  // Calculate unweighted average rating
  const calculateUnweightedRating = () => {
    if (!ratings || ratings.length === 0) return 0;
    
    const totalRating = ratings.reduce((acc, rating) => {
      return acc + (
        rating.enjoyment + 
        rating.writing + 
        rating.themes + 
        rating.characters + 
        rating.worldbuilding
      ) / 5;
    }, 0);
    
    return totalRating / ratings.length;
  };

  const unweightedRating = ratings ? calculateUnweightedRating() : 0;

  // Get social media icon by platform
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "Twitter": return <FiTwitter className="h-4 w-4" />;
      case "Instagram": return <FiInstagram className="h-4 w-4" />;
      case "Facebook": return <FiFacebook className="h-4 w-4" />;
      case "LinkedIn": return <FiLinkedin className="h-4 w-4" />;
      case "GitHub": return <FiGithub className="h-4 w-4" />;
      case "Custom": return <Globe className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  // If no book is selected
  if (!book) {
    return (
      <Card className={`w-full h-[500px] flex items-center justify-center ${className}`}>
        <CardContent className="text-center text-muted-foreground p-6">
          <BookIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">No Book Selected</h3>
          <p>Select a book from the shelf below to view details</p>
        </CardContent>
      </Card>
    );
  }

  // Get book cover image
  const coverImage = book.images?.find(img => img.imageType === "book-detail")?.imageUrl || "/images/placeholder-book.png";

  // Get top 5 taxonomies with proper sorting
  const topTaxonomies = taxonomies 
    ? [...taxonomies]
        .sort((a, b) => {
          // First sort by type priority (genre > subgenre > theme > trope)
          const typePriority = { genre: 0, subgenre: 1, theme: 2, trope: 3 };
          const typeA = typePriority[a.type as keyof typeof typePriority] || 4;
          const typeB = typePriority[b.type as keyof typeof typePriority] || 4;
          
          if (typeA !== typeB) return typeA - typeB;
          
          // Then sort by rank/importance
          return a.rank - b.rank;
        })
        .slice(0, 5)
    : [];

  return (
    <Card className={`w-full overflow-hidden ${className}`}>
      <div className="flex flex-col md:flex-row">
        {/* Left column: Book cover and basic info */}
        <div className="w-full md:w-1/3 p-4 flex flex-col items-center">
          <img 
            src={coverImage} 
            alt={book.title} 
            className="w-48 h-auto object-cover shadow-lg rounded-md mb-4" 
          />
          
          <div className="text-center w-full">
            <div className="flex items-center justify-center mt-2 mb-2">
              <StarRating rating={unweightedRating} readOnly size="sm" />
              <span className="ml-2 text-sm">
                ({unweightedRating.toFixed(1)}) • {ratings?.length || 0} ratings
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {book.formats?.map((format, idx) => (
                <Badge key={idx} variant="outline" className="text-xs capitalize">
                  {format}
                </Badge>
              ))}
            </div>
            
            {book.pageCount && (
              <p className="text-sm text-muted-foreground mt-2">
                {book.pageCount} pages
              </p>
            )}
            
            {book.publishedDate && (
              <p className="text-sm text-muted-foreground mt-1">
                Published: {formatDate(book.publishedDate)}
              </p>
            )}
            
            <Link 
              href={`/books/${book.id}`}
              className="block mt-4"
              onClick={async (e) => {
                e.stopPropagation();
                // Record click-through before navigation
                await apiRequest("POST", `/api/books/${book.id}/click-through`, {
                  source: "shelf-detail-card",
                  referrer: window.location.pathname,
                });
              }}
            >
              <Button size="sm" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Details
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Right column: Title, author, description, metadata */}
        <div className="w-full md:w-2/3 p-4">
          <h2 className="text-2xl font-bold mb-1">{book.title}</h2>
          
          <Link
            href={`/authors/${book.authorId}`}
            className="text-lg text-primary hover:underline font-medium inline-flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            by {book.authorName || (author?.author_name || "Unknown Author")}
          </Link>
          
          {/* Description with scroll area */}
          <ScrollArea className="h-40 mt-4 pr-4">
            <p className="text-sm">{book.description}</p>
          </ScrollArea>
          
          {/* Taxonomies section */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Genres & Themes</h4>
            <div className="flex flex-wrap gap-1">
              {topTaxonomies.map((taxonomy, idx) => (
                <Badge 
                  key={idx} 
                  variant={taxonomy.type === 'genre' ? 'default' : 'outline'}
                  className={`
                    text-xs capitalize
                    ${taxonomy.type === 'genre' ? 'bg-primary/80' : ''}
                    ${taxonomy.type === 'subgenre' ? 'border-primary/60 text-primary-foreground' : ''}
                    ${taxonomy.type === 'theme' ? 'border-secondary/60 text-secondary-foreground' : ''}
                    ${taxonomy.type === 'trope' ? 'border-accent/60 text-accent-foreground' : ''}
                  `}
                >
                  {taxonomy.name}
                </Badge>
              ))}
              {topTaxonomies.length === 0 && (
                <span className="text-xs text-muted-foreground">No genres or themes available</span>
              )}
            </div>
          </div>
          
          {/* Author social links */}
          {author?.socialMediaLinks && author.socialMediaLinks.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Author Links</h4>
              <div className="flex flex-wrap gap-2">
                {(author.socialMediaLinks as unknown as SocialMediaLink[]).map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-accent/10 text-accent-foreground hover:bg-accent/20 rounded-full p-2 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Book purchase links */}
          {book.referralLinks && book.referralLinks.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Where to Buy</h4>
              <div className="flex flex-wrap gap-2">
                {book.referralLinks.map((link: any, idx: number) => (
                  <ReferralButton
                    key={idx}
                    bookId={book.id}
                    link={link}
                    sourceContext="book-details"
                    className="text-xs bg-muted hover:bg-muted/80 rounded-md px-3 py-1 transition-colors"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}