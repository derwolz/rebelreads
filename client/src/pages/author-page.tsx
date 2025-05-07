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
import { Search } from "lucide-react";

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
                        ? "Your Books Ratings" 
                        : isLoggedIn 
                          ? "Reading Compatibility" 
                          : "Overall Ratings"}
                    </CardTitle>
                    <CardDescription>
                      {isAuthorViewing 
                        ? "Average ratings across all your books"
                        : isLoggedIn
                          ? "How compatible this author's writing is with your preferences"
                          : "Average across all books"}
                    </CardDescription>
                  </CardHeader>

                  {/* View 1: Author viewing their own page - show traditional average ratings with sentiment icons */}
                  {isAuthorViewing && (
                    <CardContent>
                      <div className="flex items-center gap-2 mb-4">
                        <StarRating
                          rating={Math.round(author.aggregateRatings.overall)}
                          readOnly
                          size="lg"
                        />
                        <span className="text-lg font-medium">
                          {author.aggregateRatings.overall.toFixed(1)}
                        </span>
                      </div>
                      
                      <div className="grid gap-5">
                        {/* Enjoyment row */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <RatingSimilarityIcon
                              criterion="enjoyment"
                              similarity={0}
                              label="Enjoyment"
                              size="sm"
                            />
                            <span className="text-sm">Enjoyment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={author.aggregateRatings.enjoyment}
                              readOnly
                              size="sm"
                            />
                            <span className="text-sm">
                              {author.aggregateRatings.enjoyment.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Writing Style row */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <RatingSimilarityIcon
                              criterion="writing"
                              similarity={0}
                              label="Writing Style"
                              size="sm"
                            />
                            <span className="text-sm">Writing Style</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={author.aggregateRatings.writing}
                              readOnly
                              size="sm"
                            />
                            <span className="text-sm">
                              {author.aggregateRatings.writing.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Themes row */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <RatingSimilarityIcon
                              criterion="themes"
                              similarity={0}
                              label="Themes"
                              size="sm"
                            />
                            <span className="text-sm">Themes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={author.aggregateRatings.themes}
                              readOnly
                              size="sm"
                            />
                            <span className="text-sm">
                              {author.aggregateRatings.themes.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Characters row */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <RatingSimilarityIcon
                              criterion="characters"
                              similarity={0}
                              label="Characters"
                              size="sm"
                            />
                            <span className="text-sm">Characters</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={author.aggregateRatings.characters}
                              readOnly
                              size="sm"
                            />
                            <span className="text-sm">
                              {author.aggregateRatings.characters.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        
                        {/* World Building row */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <RatingSimilarityIcon
                              criterion="worldbuilding"
                              similarity={0}
                              label="World Building"
                              size="sm"
                            />
                            <span className="text-sm">World Building</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={author.aggregateRatings.worldbuilding}
                              readOnly
                              size="sm"
                            />
                            <span className="text-sm">
                              {author.aggregateRatings.worldbuilding.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {/* View 2: Logged-in user (not author) viewing the page - show compatibility */}
                  {isLoggedIn && !isAuthorViewing && (
                    <CardContent>
                      {isCompatibilityLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-full" />
                        </div>
                      ) : compatibilityData ? (
                        <>
                          {/* If not enough ratings, show the "needs more ratings" message */}
                          {!compatibilityData.hasEnoughRatings && compatibilityData.ratingsNeeded !== undefined && (
                            <div className="flex flex-col items-center space-y-6 mb-4">
                              <div className="text-center">
                                <h3 className="text-lg font-medium mb-2">Not Enough Ratings Yet</h3>
                                <p className="text-muted-foreground mb-4">
                                  This author needs {compatibilityData.ratingsNeeded} more {compatibilityData.ratingsNeeded === 1 ? 'review' : 'reviews'} before we can calculate compatibility with your preferences.
                                </p>
                                <div className="inline-flex items-center gap-2 py-1 px-3 bg-muted rounded-full text-sm">
                                  <span className="font-medium">{compatibilityData.totalRatings}</span>
                                  <span className="text-muted-foreground">of</span>
                                  <span className="font-medium">10</span>
                                  <span className="text-muted-foreground">reviews collected</span>
                                </div>
                              </div>

                              <div className="w-full max-w-xs">
                                <Progress value={(compatibilityData.totalRatings / 10) * 100} className="h-2" />
                              </div>
                              
                              {/* Show author's current average ratings */}
                              <div className="w-full mt-6">
                                <Separator className="mb-4" />
                                <h3 className="text-sm font-medium mb-2">Author's Current Average Ratings</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  {Object.entries(compatibilityData.authorRatings).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2">
                                      <span className="text-xs capitalize">{key}:</span>
                                      <span className="text-xs font-medium">
                                        {value.toFixed(1)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* If enough ratings, show the compatibility data */}
                          {compatibilityData.hasEnoughRatings && compatibilityData.compatibility && (
                            <>
                              {/* Overall compatibility section */}
                              <div className="flex flex-col items-center space-y-2 mb-4">
                                <h3 className="text-sm font-medium">Overall Compatibility</h3>
                                <SeashellRating 
                                  compatibilityScore={compatibilityData.compatibility.score} 
                                  compatibilityLabel={compatibilityData.compatibility.overall}
                                  isLoggedIn={true} 
                                />
                              </div>
                              
                              <Separator />
                              
                              {/* Individual rating criteria */}
                              <div className="space-y-3 mt-4">
                                <h3 className="text-sm font-medium text-center">Reading Preferences Comparison</h3>
                                <div className="flex flex-wrap justify-center gap-4 mt-2">
                                  {['enjoyment', 'writing', 'themes', 'characters', 'worldbuilding'].map(criterion => {
                                    // Calculate difference/similarity from the compatibility data
                                    const criteriaData = compatibilityData.compatibility.criteria[criterion];
                                    const similarity = criteriaData ? criteriaData.normalized : 0;
                                    
                                    return (
                                      <RatingSimilarityIcon
                                        key={criterion}
                                        criterion={criterion}
                                        similarity={similarity}
                                        label={`${criterion}: ${Math.round((1 - similarity) * 100)}% similar`}
                                        size="md"
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                              
                              {/* Display the author's average ratings */}
                              <div className="mt-6">
                                <Separator className="mb-4" />
                                <h3 className="text-sm font-medium mb-2">Author's Average Ratings</h3>
                                <div className="grid grid-cols-2 gap-2">
                                  {['enjoyment', 'writing', 'themes', 'characters', 'worldbuilding'].map(criterion => (
                                    <div key={criterion} className="flex items-center gap-2">
                                      <span className="text-xs capitalize">{criterion}:</span>
                                      <span className="text-xs font-medium">
                                        {compatibilityData.authorRatings[criterion as keyof typeof compatibilityData.authorRatings].toFixed(1)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <p>Error loading compatibility data</p>
                        </div>
                      )}
                    </CardContent>
                  )}

                  {/* View 3: Not logged in - show default view with login prompt */}
                  {!isLoggedIn && (
                    <>
                      <CardContent className="relative">
                        <div className="blur-sm pointer-events-none">
                          <div className="mb-4">
                            <p className="font-semibold text-center mb-2">Overall Compatibility</p>
                            <div className="flex justify-center mb-2">
                              <SeashellRating 
                                compatibilityScore={2} 
                                compatibilityLabel="Sample compatibility" 
                                isLoggedIn={false}
                              />
                            </div>
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <div className="space-y-3">
                            <p className="font-medium text-sm text-center">Reading Preferences Comparison</p>
                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                              {['enjoyment', 'writing', 'themes', 'characters', 'worldbuilding'].map(criterion => (
                                <div key={criterion} className="flex flex-col items-center opacity-50">
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-xs">{criterion.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <span className="text-xs capitalize mt-1">{criterion}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Overlay with login button */}
                        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 space-y-4">
                          <p className="text-center font-medium">
                            Login to see how compatible this author is with your reading preferences
                          </p>
                          <Link to="/login">
                            <Button>Login Now</Button>
                          </Link>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="flex flex-col space-y-3 border-t pt-4">
                        <h3 className="text-sm font-medium w-full">Traditional Ratings</h3>
                        <div className="flex items-center gap-2 w-full">
                          <StarRating
                            rating={Math.round(author.aggregateRatings.overall)}
                            readOnly
                            size="md"
                          />
                          <span className="text-sm font-medium">
                            {author.aggregateRatings.overall.toFixed(1)} / 5 average
                          </span>
                        </div>
                      </CardFooter>
                    </>
                  )}
                </Card>
              )}
            </div>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookshelves.map((shelf) => (
                <Card key={shelf.shelf.id} className="bg-card/80 shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{shelf.shelf.title}</CardTitle>
                    <CardDescription>
                      {shelf.books.length} {shelf.books.length === 1 ? 'book' : 'books'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      {shelf.books.slice(0, 6).map((book) => (
                        <div
                          key={book.id}
                          className="w-16 h-24 bg-muted rounded-md overflow-hidden shadow-sm"
                        >
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <span className="text-xs text-center px-1">{book.title}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {shelf.books.length > 6 && (
                        <div className="w-16 h-24 bg-muted/50 rounded-md flex items-center justify-center">
                          <span className="text-sm font-medium">+{shelf.books.length - 6}</span>
                        </div>
                      )}
                    </div>
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