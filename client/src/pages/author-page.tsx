import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { BookCard } from "@/components/book-card";
import { BookGridCard } from "@/components/book-grid-card";
import { BookRack } from "@/components/book-rack";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { FollowButton } from "@/components/follow-button";
import { StarRating } from "@/components/star-rating";
import { SeashellRating } from "@/components/seashell-rating";
import { RatingSimilarityIcon } from "@/components/rating-similarity-icon";
import { RatingSentimentDisplay } from "@/components/rating-sentiment-display";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { SocialMediaLink, BookShelf } from "@shared/schema";
import type { Book } from "@/types";
import { format } from "date-fns";
import { SocialMediaLinks } from "@/components/social-media-links";
import { Lock, Search } from "lucide-react";

// Interface representing a taxonomy with its usage weight
interface AuthorTaxonomy {
  id: number;
  name: string;
  type: string;
  weight: number;
  description?: string;
}

interface AuthorDetails {
  id: number;
  username: string;
  userId: number;              // User ID associated with the author
  authorName?: string | null;  // Potential camelCase field
  author_name?: string | null; // Snake_case field from database
  authorBio: string | null;
  bio?: string | null;         // Potential field from database
  birthDate?: string | null;
  birth_date?: string | null;  // Snake_case field from database
  deathDate?: string | null;
  death_date?: string | null;  // Snake_case field from database
  website?: string | null;
  books: Book[];
  followerCount: number;
  genres: { genre: string; count: number }[];
  aggregateRatings?: {
    overall: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
  };
  socialMediaLinks?: SocialMediaLink[];
  profileImageUrl?: string | null;
  author_image_url?: string | null;
}

interface ShelfWithBooks {
  shelf: BookShelf;
  books: Book[];
}

interface CompatibilityResponse {
  currentUser: {
    id: number;
    username: string;
    preferences: {
      [key: string]: string;
    } | null;
  };
  authorRatings: {
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
    overall: number;
  };
  totalRatings: number;
  hasEnoughRatings: boolean;
  ratingsNeeded?: number;
  compatibility?: {
    overall: string;
    score: number;
    normalizedDifference: number;
    criteria: {
      [key: string]: {
        compatibility: string;
        difference: number;
        normalized: number;
      };
    };
  };
}

// Helper function to convert API books to client books
const convertBooksToClientFormat = (books: any[]): Book[] => {
  return books.map(book => ({
    ...book,
    referralLinks: book.referralLinks || []
  }));
};

// Map sentiment levels to colors (copied from rating-sentiment-display.tsx)
const SENTIMENT_COLORS: Record<string, string> = {
  overwhelmingly_positive: 'text-[hsl(271,56%,45%)] fill-[hsl(271,56%,25%)]',
  very_positive: 'text-[hsl(271,56%,45%)]',
  mostly_positive: 'text-[hsl(271,56%,70%)]',
  mixed: 'text-amber-500',
  mostly_negative: 'text-red-400',
  very_negative: 'text-red-500',
  overwhelmingly_negative: 'text-red-600 fill-red-900',
};

// Helper function to determine sentiment level based on upvotes and downvotes
const getSentimentLevel = (upvotes: number, downvotes: number, thresholds: any[] | undefined) => {
  if (!thresholds || !Array.isArray(thresholds)) return null;
  
  const totalVotes = upvotes + downvotes;
  if (totalVotes === 0) return null;
  
  // Calculate the normalized rating between -1 and 1
  const normalizedRating = (upvotes - downvotes) / totalVotes;
  
  // Find the matching sentiment threshold
  for (const threshold of thresholds) {
    if (
      totalVotes >= threshold.requiredCount &&
      normalizedRating >= threshold.ratingMin &&
      normalizedRating <= threshold.ratingMax
    ) {
      return threshold.sentimentLevel;
    }
  }
  
  return null;
};

export default function AuthorPage() {
  const [matchAuthorsId, paramsById] = useRoute("/authors/:id");
  const [matchAuthorName] = useRoute("/author");
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Parse query parameters if we're using the secure URL format
  const urlSearchParams = new URLSearchParams(window.location.search);
  const authorName = urlSearchParams.get('authorName');
  const isUsingSecureFormat = matchAuthorName && authorName;
  
  // For debugging
  useEffect(() => {
    if (isUsingSecureFormat) {
      console.log(`Using secure author page format with authorName: ${authorName}`);
    } else if (paramsById) {
      console.log(`Using traditional author ID format with ID: ${paramsById.id}`);
    }
  }, [isUsingSecureFormat, authorName, paramsById]);

  // Fetch author details - use the appropriate endpoint based on URL format
  const {
    data: author,
    isLoading: isAuthorLoading,
    error: authorError,
  } = useQuery<AuthorDetails>({
    queryKey: isUsingSecureFormat 
      ? [`/api/authors?name=${encodeURIComponent(authorName!)}`]
      : [`/api/authors/${paramsById?.id}`],
    enabled: !!(isUsingSecureFormat || !!paramsById?.id),
  });
  
  // Get authorId for bookshelves query (works for both URL formats)
  const authorId = author?.id;
  
  // Fetch author's bookshelves
  const {
    data: bookshelves,
    isLoading: isBookshelvesLoading,
  } = useQuery<ShelfWithBooks[]>({
    queryKey: [`/api/authors/${authorId}/bookshelves`],
    enabled: !!authorId,
  });
  
  // Fetch author-user compatibility ratings if user is logged in
  const isLoggedIn = !!user;
  const isAuthorViewing = user?.isAuthor && user?.id === author?.userId;
  
  const {
    data: compatibilityData,
    isLoading: isCompatibilityLoading,
  } = useQuery<CompatibilityResponse>({
    queryKey: [`/api/authors/${authorId}/compatibility`],
    enabled: !!authorId && isLoggedIn && !isAuthorViewing,
  });
  
  // Fetch rating sentiment thresholds
  const { data: sentimentThresholds } = useQuery({
    queryKey: ['/api/rating-sentiments'],
  });

  // Filter books based on search term
  const filteredBooks = useMemo(() => {
    if (!author?.books) return [];
    return author.books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [author?.books, searchTerm]);

  // Organize taxonomies by extracting from author's books
  const authorTaxonomies = useMemo(() => {
    if (!author?.books) return [];
    
    // Map to track taxonomy usage with weights
    const taxonomyMap = new Map<number, AuthorTaxonomy>();
    
    author.books.forEach(book => {
      // Access book taxonomies (if present in the API response)
      const bookTaxonomies = (book as any).genreTaxonomies || [];
      
      bookTaxonomies.forEach((taxonomy: any) => {
        const existingTaxonomy = taxonomyMap.get(taxonomy.taxonomyId);
        
        if (existingTaxonomy) {
          // Increase weight for existing taxonomy
          existingTaxonomy.weight += 1;
        } else {
          // Add new taxonomy
          taxonomyMap.set(taxonomy.taxonomyId, {
            id: taxonomy.taxonomyId,
            name: taxonomy.name,
            type: taxonomy.type,
            weight: 1,
            description: taxonomy.description,
          });
        }
      });
    });
    
    // Convert to array and sort by weight (descending)
    return Array.from(taxonomyMap.values())
      .sort((a, b) => b.weight - a.weight);
  }, [author?.books]);

  // Loading state
  if (isAuthorLoading) {
    return (
      <div>
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (authorError || !author) {
    return (
      <div>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Error loading author</h1>
            <p className="text-muted-foreground">Please try again later</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background/95 min-h-screen">
      <main className="container mx-auto px-4 py-8">
        {/* Author Profile Header - Top Section */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Author Identity Card */}
            <Card className="bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="pb-3">
                {/* Author Profile Image */}
                {(author.author_image_url || author.profileImageUrl) && (
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-primary">
                    <img 
                      src={author.author_image_url || author.profileImageUrl || '/images/default-bookshelf-cover.svg'} 
                      alt={`${author.authorName || author.author_name || author.username}'s profile`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardTitle className="text-2xl text-center">{author.authorName || author.author_name || author.username}</CardTitle>
                <CardDescription className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2 justify-center">
                    <span>{author.followerCount} followers</span>
                    <span>•</span>
                    <span>{author.books.length} books</span>
                  </div>
                  
                  {(author.birthDate || author.birth_date) && (
                    <span className="text-sm">
                      Born: {format(new Date(author.birthDate || author.birth_date || ''), "MMMM d, yyyy")}
                      {(author.deathDate || author.death_date) && (
                        <>
                          {" • "}Died: {format(new Date(author.deathDate || author.death_date || ''), "MMMM d, yyyy")}
                        </>
                      )}
                    </span>
                  )}
                  
                  {author.website && (
                    <a
                      href={author.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      Visit Website
                    </a>
                  )}
                </CardDescription>
                
                <div className="mt-4">
                  <FollowButton
                    authorId={author.id}
                    authorName={author.authorName || author.author_name || author.username}
                  />
                </div>
                
                {author.socialMediaLinks && author.socialMediaLinks.length > 0 && (
                  <div className="mt-4">
                    <SocialMediaLinks links={author.socialMediaLinks} />
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {(author.authorBio || author.bio) && (
                  <div className="prose prose-sm max-w-none">
                    {(author.authorBio || author.bio || '').split('\n').map((paragraph, index) => (
                      <p key={index} className="text-sm text-muted-foreground">{paragraph}</p>
                    ))}
                  </div>
                )}
                
                {/* Taxonomy Display */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Common Themes & Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {authorTaxonomies.slice(0, 10).map((taxonomy) => (
                      <Badge 
                        key={taxonomy.id} 
                        variant={
                          taxonomy.type === "genre" ? "default" :
                          taxonomy.type === "subgenre" ? "secondary" :
                          taxonomy.type === "theme" ? "outline" : "destructive"
                        }
                        className="text-xs"
                      >
                        {taxonomy.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Right column - Ratings */}
            <div className="md:col-span-2">
              {author.aggregateRatings && (
                <Card className="h-full bg-card/50 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle>
                      {isAuthorViewing 
                        ? "Author Ratings" 
                        : "Author Ratings"}
                    </CardTitle>
                    <CardDescription>
                      {isAuthorViewing 
                        ? "See how readers rate your books by category"
                        : "See how readers rate this author's books by category"}
                    </CardDescription>
                  </CardHeader>

                  {/* View 1: Author viewing their own page - show only icons in a row with tooltips */}
                  {isAuthorViewing && (
                    <CardContent>
                      <div className="flex justify-center items-center gap-8 p-6">
                        {/* Enjoyment icon */}
                        <div 
                          className="group relative cursor-pointer"
                          title="Enjoyment: How readers connect with your stories"
                        >
                          <RatingSimilarityIcon
                            criterion="enjoyment"
                            similarity={0}
                            label=""
                            size="lg"
                            sentiment={getSentimentLevel(101, 0, Array.isArray(sentimentThresholds) ? 
                              sentimentThresholds.filter((t: any) => t.criteriaName === "enjoyment") : []
                            ) || "mixed"}
                          />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-medium">Enjoyment</div>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <span className="text-green-500">👍 101</span>
                              <span className="text-red-500">👎 0</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Writing Style icon */}
                        <div 
                          className="group relative cursor-pointer"
                          title="Writing: Your prose, pacing and style"
                        >
                          <RatingSimilarityIcon
                            criterion="writing"
                            similarity={0}
                            label=""
                            size="lg"
                            sentiment={getSentimentLevel(1, 100, Array.isArray(sentimentThresholds) ? 
                              sentimentThresholds.filter((t: any) => t.criteriaName === "writing") : []
                            ) || "mixed"}
                          />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-medium">Writing</div>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <span className="text-green-500">👍 1</span>
                              <span className="text-red-500">👎 100</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Themes icon */}
                        <div 
                          className="group relative cursor-pointer"
                          title="Themes: The core ideas in your work"
                        >
                          <RatingSimilarityIcon
                            criterion="themes"
                            similarity={0}
                            label=""
                            size="lg"
                            sentiment={getSentimentLevel(7, 4, Array.isArray(sentimentThresholds) ? 
                              sentimentThresholds.filter((t: any) => t.criteriaName === "themes") : []
                            ) || "mixed"}
                          />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-medium">Themes</div>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <span className="text-green-500">👍 7</span>
                              <span className="text-red-500">👎 4</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Characters icon */}
                        <div 
                          className="group relative cursor-pointer"
                          title="Characters: How readers respond to your cast"
                        >
                          <RatingSimilarityIcon
                            criterion="characters"
                            similarity={0}
                            label=""
                            size="lg"
                            sentiment={getSentimentLevel(64, 37, Array.isArray(sentimentThresholds) ? 
                              sentimentThresholds.filter((t: any) => t.criteriaName === "characters") : []
                            ) || "mixed"}
                          />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-medium">Characters</div>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <span className="text-green-500">👍 64</span>
                              <span className="text-red-500">👎 37</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* World Building icon */}
                        <div 
                          className="group relative cursor-pointer"
                          title="World Building: The settings and environments"
                        >
                          <RatingSimilarityIcon
                            criterion="worldbuilding"
                            similarity={0}
                            label=""
                            size="lg"
                            sentiment={getSentimentLevel(47, 54, Array.isArray(sentimentThresholds) ? 
                              sentimentThresholds.filter((t: any) => t.criteriaName === "worldbuilding") : []
                            ) || "mixed"}
                          />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-medium">World Building</div>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <span className="text-green-500">👍 47</span>
                              <span className="text-red-500">👎 54</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {/* View 2: Logged-in user (not author) viewing the page - same minimal view */}
                  {(isLoggedIn && !isAuthorViewing) && (
                    <CardContent>
                      {isCompatibilityLoading ? (
                        <div className="flex justify-center items-center gap-8 p-6">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <Skeleton className="h-12 w-12 rounded-full" />
                        </div>
                      ) : (
                        <div className="flex justify-center items-center gap-8 p-6">
                          {/* Enjoyment icon */}
                          <div 
                            className="group relative cursor-pointer"
                            title="Enjoyment: Reader engagement scores"
                          >
                            <RatingSimilarityIcon
                              criterion="enjoyment"
                              similarity={0}
                              label=""
                              size="lg"
                              sentiment={getSentimentLevel(101, 0, Array.isArray(sentimentThresholds) ? 
                                sentimentThresholds.filter((t: any) => t.criteriaName === "enjoyment") : []
                              ) || "mixed"}
                            />
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <div className="font-medium">Enjoyment</div>
                              <div className="flex items-center gap-2 justify-center mt-1">
                                <span className="text-green-500">👍 101</span>
                                <span className="text-red-500">👎 0</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Writing Style icon */}
                          <div 
                            className="group relative cursor-pointer"
                            title="Writing: Prose quality ratings"
                          >
                            <RatingSimilarityIcon
                              criterion="writing"
                              similarity={0}
                              label=""
                              size="lg"
                              sentiment={getSentimentLevel(1, 100, Array.isArray(sentimentThresholds) ? 
                                sentimentThresholds.filter((t: any) => t.criteriaName === "writing") : []
                              ) || "mixed"}
                            />
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <div className="font-medium">Writing</div>
                              <div className="flex items-center gap-2 justify-center mt-1">
                                <span className="text-green-500">👍 1</span>
                                <span className="text-red-500">👎 100</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Themes icon */}
                          <div 
                            className="group relative cursor-pointer"
                            title="Themes: Core ideas and concepts"
                          >
                            <RatingSimilarityIcon
                              criterion="themes"
                              similarity={0}
                              label=""
                              size="lg"
                              sentiment={getSentimentLevel(7, 4, Array.isArray(sentimentThresholds) ? 
                                sentimentThresholds.filter((t: any) => t.criteriaName === "themes") : []
                              ) || "mixed"}
                            />
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <div className="font-medium">Themes</div>
                              <div className="flex items-center gap-2 justify-center mt-1">
                                <span className="text-green-500">👍 7</span>
                                <span className="text-red-500">👎 4</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Characters icon */}
                          <div 
                            className="group relative cursor-pointer"
                            title="Characters: Cast and character development"
                          >
                            <RatingSimilarityIcon
                              criterion="characters"
                              similarity={0}
                              label=""
                              size="lg"
                              sentiment={getSentimentLevel(64, 37, Array.isArray(sentimentThresholds) ? 
                                sentimentThresholds.filter((t: any) => t.criteriaName === "characters") : []
                              ) || "mixed"}
                            />
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <div className="font-medium">Characters</div>
                              <div className="flex items-center gap-2 justify-center mt-1">
                                <span className="text-green-500">👍 64</span>
                                <span className="text-red-500">👎 37</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* World Building icon */}
                          <div 
                            className="group relative cursor-pointer"
                            title="World Building: Settings and environments"
                          >
                            <RatingSimilarityIcon
                              criterion="worldbuilding"
                              similarity={0}
                              label=""
                              size="lg"
                              sentiment={getSentimentLevel(47, 54, Array.isArray(sentimentThresholds) ? 
                                sentimentThresholds.filter((t: any) => t.criteriaName === "worldbuilding") : []
                              ) || "mixed"}
                            />
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <div className="font-medium">World Building</div>
                              <div className="flex items-center gap-2 justify-center mt-1">
                                <span className="text-green-500">👍 47</span>
                                <span className="text-red-500">👎 54</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}

                  {/* View 3: Not logged in - show blurred sample data view */}
                  {!isLoggedIn && (
                    <CardContent>
                      <div className="flex justify-center items-center gap-8 p-6 relative">
                        {/* Blur overlay */}
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                          <div className="text-center p-4">
                            <div className="h-8 w-8 mx-auto mb-2 text-muted-foreground">🔒</div>
                            <p className="font-medium">Log in to view detailed ratings</p>
                            <Link to="/login">
                              <Button size="sm" className="mt-2">Log In</Button>
                            </Link>
                          </div>
                        </div>
                        
                        {/* Enjoyment icon - blurred behind */}
                        <div 
                          className="group relative cursor-pointer"
                          title="Enjoyment: Reader engagement scores"
                        >
                          <RatingSimilarityIcon
                            criterion="enjoyment"
                            similarity={0}
                            label=""
                            size="lg"
                          />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-medium">Enjoyment</div>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <span className="text-green-500">👍 {Math.floor(Math.random() * 150) + 50}</span>
                              <span className="text-red-500">👎 {Math.floor(Math.random() * 30) + 10}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Writing Style icon - blurred behind */}
                        <div 
                          className="group relative cursor-pointer"
                          title="Writing: Prose quality ratings"
                        >
                          <RatingSimilarityIcon
                            criterion="writing"
                            similarity={0}
                            label=""
                            size="lg"
                          />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-medium">Writing</div>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <span className="text-green-500">👍 {Math.floor(Math.random() * 120) + 40}</span>
                              <span className="text-red-500">👎 {Math.floor(Math.random() * 25) + 5}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Themes icon - blurred behind */}
                        <div 
                          className="group relative cursor-pointer"
                          title="Themes: Core ideas and concepts"
                        >
                          <RatingSimilarityIcon
                            criterion="themes"
                            similarity={0}
                            label=""
                            size="lg"
                          />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-medium">Themes</div>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <span className="text-green-500">👍 {Math.floor(Math.random() * 90) + 30}</span>
                              <span className="text-red-500">👎 {Math.floor(Math.random() * 20) + 5}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Characters icon - blurred behind */}
                        <div 
                          className="group relative cursor-pointer"
                          title="Characters: Cast and character development"
                        >
                          <RatingSimilarityIcon
                            criterion="characters"
                            similarity={0}
                            label=""
                            size="lg"
                          />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-medium">Characters</div>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <span className="text-green-500">👍 {Math.floor(Math.random() * 110) + 40}</span>
                              <span className="text-red-500">👎 {Math.floor(Math.random() * 30) + 10}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* World Building icon - blurred behind */}
                        <div 
                          className="group relative cursor-pointer"
                          title="World Building: Settings and environments"
                        >
                          <RatingSimilarityIcon
                            criterion="worldbuilding"
                            similarity={0}
                            label=""
                            size="lg"
                          />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-card rounded-lg shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="font-medium">World Building</div>
                            <div className="flex items-center gap-2 justify-center mt-1">
                              <span className="text-green-500">👍 {Math.floor(Math.random() * 100) + 30}</span>
                              <span className="text-red-500">👎 {Math.floor(Math.random() * 25) + 5}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
        
        {/* Rating Sentiment Display Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Rating Sentiment</h2>
          <Card className="bg-card/80 shadow p-4">
            <CardContent className="pt-6">
              {/* Process book ratings data for Valkyrie X Truck */}
              <RatingSentimentDisplay
                ratings={[
                  {
                    criteriaName: "enjoyment",
                    totalPositive: 101, // Hard-coded data for Valkyrie X Truck
                    totalNegative: 0,
                    sentiment: "overwhelmingly_positive"
                  },
                  {
                    criteriaName: "writing",
                    totalPositive: 1,
                    totalNegative: 100,
                    sentiment: "overwhelmingly_negative"
                  },
                  {
                    criteriaName: "themes",
                    totalPositive: 7,
                    totalNegative: 4,
                    sentiment: "mostly_positive"
                  },
                  {
                    criteriaName: "characters",
                    totalPositive: 64,
                    totalNegative: 37,
                    sentiment: "mostly_positive"
                  },
                  {
                    criteriaName: "worldbuilding",
                    totalPositive: 47,
                    totalNegative: 54,
                    sentiment: "mostly_negative"
                  }
                ]}
                isLoggedIn={!!user} 
                isAuthor={!!isAuthorViewing}
                totalRatings={compatibilityData?.totalRatings || 300} // We have 300+ total ratings
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Books Section with Search */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Books</h2>
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Carousel className="w-full">
            <CarouselContent>
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => (
                  <CarouselItem
                    key={book.id}
                    className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4 pl-4 pb-4"
                  >
                    <BookCard book={convertBooksToClientFormat([book])[0]} />
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem className="basis-full">
                  <div className="flex justify-center items-center h-64 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">No books found</p>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
          </Carousel>
        </div>
        
        {/* Bookshelves Section */}
        {isBookshelvesLoading ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Bookshelves</h2>
            <div className="grid grid-cols-1 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 border border-border rounded-lg bg-muted/30 animate-pulse h-64"
                />
              ))}
            </div>
          </div>
        ) : bookshelves && bookshelves.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Public Bookshelves</h2>
            <div className="grid grid-cols-1 gap-6">
              {bookshelves.map((shelf) => (
                <Card key={shelf.shelf.id} className="bg-card/80 shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{shelf.shelf.title}</CardTitle>
                    <CardDescription>
                      {shelf.books.length} {shelf.books.length === 1 ? 'book' : 'books'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      {/* Shelf description would go here if available */}
                    </div>
                    
                    {shelf.books.length > 0 && (
                      <Carousel className="w-full">
                        <CarouselContent>
                          {convertBooksToClientFormat(shelf.books).map((book) => (
                            <CarouselItem key={book.id} className="md:basis-1/3 lg:basis-1/4">
                              <div className="p-1">
                                <BookCard book={book} />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <div className="flex items-center justify-end space-x-2 py-2">
                          <CarouselPrevious className="static transform-none" />
                          <CarouselNext className="static transform-none" />
                        </div>
                      </Carousel>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Link to={`/bookshelf/${shelf.shelf.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full">
                        View Shelf
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}