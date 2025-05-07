import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { BookCard } from "@/components/book-card";
import { BookGridCard } from "@/components/book-grid-card";
import { BookRack } from "@/components/book-rack";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { FollowButton } from "@/components/follow-button";
import { StarRating } from "@/components/star-rating";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Skeleton } from "@/components/ui/skeleton";

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
                    <CardTitle>Overall Ratings</CardTitle>
                    <CardDescription>Average across all books</CardDescription>
                  </CardHeader>
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
                    
                    <div className="grid gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Enjoyment</span>
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
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Writing Style</span>
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
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Themes</span>
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
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Characters</span>
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
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">World Building</span>
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
              <div className="animate-pulse">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : bookshelves && bookshelves.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Shared Bookshelves</h2>
            {bookshelves.map((shelfWithBooks) => (
              <div key={shelfWithBooks.shelf.id} className="">
              
                {shelfWithBooks.books && shelfWithBooks.books.length > 0 ? (
                  <div className="flex flex-col md:flex-row mb-12 justify-center items-center gap-6">
                    {/* Bookshelf cover on the left */}
                    <div className="w-full md:w-48 flex-shrink-0">
                      <div className="aspect-[2/3] relative rounded-lg   border shadow">
                        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/60">
                          <img 
                            src={shelfWithBooks.shelf.coverImageUrl?.toString() || "/images/default-bookshelf-cover.svg"} 
                            alt={`${shelfWithBooks.shelf.title} cover`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/images/default-bookshelf-cover.svg";
                            }}
                          />
                        </div>
                        
                      </div>
                      
                    </div>
                    {/* Book rack display on the right */}
                    <div className="flex-1 w-full">
                      <BookRack 
                        title="" 
                        books={convertBooksToClientFormat(shelfWithBooks.books)} 
                        isLoading={false}
                        className="m-0 mb-0"
                      />
                      <h3 className="text-xl font-semibold">{shelfWithBooks.shelf.title}</h3>
                    </div>
                    
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-32 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">No books in this bookshelf</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center py-12 border rounded-lg bg-muted/10">
            <h2 className="text-2xl font-semibold mb-2">No Shared Bookshelves</h2>
            <p className="text-muted-foreground">
              This author hasn't shared any bookshelves yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
