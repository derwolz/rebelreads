import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Book } from "../types";
import { useAuth } from "@/hooks/use-auth";
import { BookCard } from "@/components/book-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Filter, Search, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

// Type for page parameters
type DiscoverPageParams = {
  type?: string;
  id?: string;
};

// Type for taxonomy data
type Taxonomy = {
  id: number;
  name: string;
  category: 'genre' | 'subgenre' | 'trope' | 'theme';
  importance: number;
  enabled: boolean;
};

// Type for genre view taxonomy data
type GenreViewTaxonomy = {
  id: number;
  name: string;
  category: string;
  taxonomyId: number;
};

export default function DiscoverPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const params = useParams<DiscoverPageParams>();
  const [page, setPage] = useState(1);
  const [loadedBooks, setLoadedBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearRange, setYearRange] = useState<[number, number]>([1900, new Date().getFullYear()]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Extract the type from URL path
  const type = params.type || "general";
  const id = params.id;
  
  // Construct the endpoint based on the URL path
  const getEndpoint = () => {
    // Path segments: /discover/{type}/{id?}
    switch (type) {
      case "followed-authors":
        return "/api/recommendations/followed-authors?limit=150";
      case "wishlist":
        return "/api/recommendations/wishlist?limit=150";
      case "reviewed":
        return "/api/recommendations/reviewed?limit=150";
      case "completed":
        return "/api/recommendations/completed?limit=150";
      case "popular":
        return "/api/books?sort=popularity&limit=150";
      case "recommendations":
        return "/api/recommendations?limit=150";
      case "to-review":
        return "/api/books/to-review?limit=150";
      case "genre":
        return id ? `/api/discover/genre/${id}` : "/api/books?limit=150";
      default:
        return "/api/books?limit=150";
    }
  };

  // Get a user-friendly title based on the URL path
  const getTitle = () => {
    switch (type) {
      case "followed-authors":
        return "Books from Authors You Follow";
      case "wishlist":
        return "Your Wishlist";
      case "reviewed":
        return "Your Reviewed Books";
      case "completed":
        return "Your Completed Books";
      case "popular":
        return "Popular Books";
      case "recommendations":
        return "Recommended for You";
      case "to-review":
        return "Books to Review";
      case "genre":
        return genreViewName || "Genre Books";
      default:
        return "Discover Books";
    }
  };

  // Get the genre view name and details if applicable
  const { data: genreView } = useQuery({
    queryKey: ["/api/genres/view-info", id],
    queryFn: async () => {
      if (type === "genre" && id) {
        const response = await fetch(`/api/genres/view-info/${id}`);
        if (!response.ok) throw new Error("Failed to load genre view");
        return response.json();
      }
      return null;
    },
    enabled: type === "genre" && !!id,
  });

  const genreViewName = genreView?.name;
  
  // Get taxonomies for the view
  const { data: viewTaxonomies } = useQuery({
    queryKey: ["/api/genres/view-taxonomies", id],
    queryFn: async () => {
      if (type === "genre" && id) {
        try {
          const response = await fetch(`/api/genres/view-taxonomies/${id}`);
          if (!response.ok) throw new Error("Failed to load view taxonomies");
          return response.json();
        } catch (error) {
          console.error("Error fetching taxonomies:", error);
          return [];
        }
      }
      return [];
    },
    enabled: type === "genre" && !!id,
  });
  
  // Initialize the taxonomies for filtering
  useEffect(() => {
    if (viewTaxonomies && viewTaxonomies.length > 0) {
      const formattedTaxonomies = viewTaxonomies.map((tax: any) => ({
        id: tax.taxonomyId,
        name: tax.name,
        category: tax.category as 'genre' | 'subgenre' | 'trope' | 'theme',
        importance: 1.0, // Default importance
        enabled: true, // All enabled by default
      }));
      
      setTaxonomies(formattedTaxonomies);
    }
  }, [viewTaxonomies]);
  
  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Fetch books data
  const {
    data: fetchedBooks,
    isLoading,
    isError,
  } = useQuery<Book[]>({
    queryKey: [getEndpoint()],
    enabled: true,
  });
  
  // Apply filters whenever they change
  useEffect(() => {
    if (!fetchedBooks) return;
    
    let filtered = [...fetchedBooks];
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(term) || 
        book.description?.toLowerCase().includes(term) ||
        book.authorName?.toLowerCase().includes(term)
      );
    }
    
    // Apply year range filter
    filtered = filtered.filter(book => {
      if (!book.publishedDate) return true;
      
      const year = new Date(book.publishedDate).getFullYear();
      return year >= yearRange[0] && year <= yearRange[1];
    });
    
    // Apply taxonomy filters (in a real implementation)
    // This would filter based on enabled taxonomies
    if (taxonomies.length > 0) {
      const enabledTaxonomyIds = taxonomies
        .filter(tax => tax.enabled)
        .map(tax => tax.id);
        
      if (enabledTaxonomyIds.length < taxonomies.length) {
        // In a real implementation, this would filter books by taxonomy
        // This is a simplified version without actual taxonomy filtering
        console.log('Filtering by taxonomies:', enabledTaxonomyIds);
      }
    }
    
    setFilteredBooks(filtered);
    
    // Update loaded books for immediate display
    setLoadedBooks(filtered.slice(0, Math.min(20, filtered.length)));
    setHasMore(filtered.length > 20);
    setPage(1);
    
  }, [fetchedBooks, searchTerm, yearRange, taxonomies]);

  /* The initialization is now handled in the filter effect above */

  // Function to load more books
  const loadMoreBooks = () => {
    if (!filteredBooks || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Calculate next page of books
    const nextPage = page + 1;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const nextBooks = filteredBooks.slice(startIndex, endIndex);
    
    // Add new books to loaded books
    if (nextBooks.length > 0) {
      setTimeout(() => {
        setLoadedBooks(prev => [...prev, ...nextBooks]);
        setPage(nextPage);
        setIsLoadingMore(false);
        
        // Check if we have more books to load
        setHasMore(endIndex < filteredBooks.length);
      }, 500); // Small delay for a smoother experience
    } else {
      setIsLoadingMore(false);
      setHasMore(false);
    }
  };
  
  // Toggle taxonomy enabled state
  const toggleTaxonomy = (id: number) => {
    setTaxonomies(prev => 
      prev.map(tax => 
        tax.id === id 
          ? { ...tax, enabled: !tax.enabled } 
          : tax
      )
    );
  };
  
  // Toggle filter drawer/sheet
  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setYearRange([1900, new Date().getFullYear()]);
    setTaxonomies(prev => prev.map(tax => ({ ...tax, enabled: true })));
    setActiveFilters([]);
  };
  
  // Add or remove active filter
  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(prev => prev.filter(f => f !== filter));
    } else {
      setActiveFilters(prev => [...prev, filter]);
    }
  };

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreBooks();
        }
      },
      { threshold: 0.1 }
    );
    
    const loadMoreElement = document.getElementById("load-more-trigger");
    if (loadMoreElement) {
      observer.observe(loadMoreElement);
    }
    
    return () => {
      if (loadMoreElement) {
        observer.unobserve(loadMoreElement);
      }
    };
  }, [hasMore, isLoadingMore, loadedBooks]);

  // Redirect to login if user is not authenticated for user-specific sections
  useEffect(() => {
    if (!user && ["followed-authors", "wishlist", "reviewed", "completed", "to-review"].includes(type)) {
      window.location.href = "/login";
    }
  }, [user, type]);

  // Render filter panel content based on device type
  const renderFilterContent = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Search</h3>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search titles, descriptions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Publication Year</h3>
          <div className="px-2">
            <Slider
              defaultValue={yearRange}
              min={1900}
              max={new Date().getFullYear()}
              step={1}
              value={yearRange}
              onValueChange={(value) => setYearRange(value as [number, number])}
              className="my-6"
            />
            <div className="flex items-center justify-between text-sm">
              <span>{yearRange[0]}</span>
              <span>{yearRange[1]}</span>
            </div>
          </div>
        </div>
        
        {taxonomies.length > 0 && (
          <Accordion type="single" collapsible defaultValue="taxonomy-filters">
            <AccordionItem value="taxonomy-filters">
              <AccordionTrigger>
                Taxonomies
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {taxonomies.map((tax) => (
                    <div key={tax.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`tax-${tax.id}`} 
                        checked={tax.enabled}
                        onCheckedChange={() => toggleTaxonomy(tax.id)}
                      />
                      <Label 
                        htmlFor={`tax-${tax.id}`}
                        className="flex items-center gap-2"
                      >
                        {tax.name}
                        <Badge variant="outline" className="text-xs">
                          {tax.category}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        <div className="pt-4 flex justify-end">
          <Button variant="outline" onClick={clearFilters} className="w-full">
            Clear All Filters
          </Button>
        </div>
      </div>
    );
  };
  
  // Show the filters in a sheet (side-opening) on desktop
  const DesktopFilters = () => (
    <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="group flex items-center gap-1 hover:bg-transparent p-0"
          onClick={toggleFilters}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : 'rotate-0'}`} />
          <span className="text-lg font-semibold group-hover:underline">Filters</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter Books</SheetTitle>
          <SheetDescription>
            Narrow down your search using these filters.
          </SheetDescription>
        </SheetHeader>
        {renderFilterContent()}
      </SheetContent>
    </Sheet>
  );
  
  // Show the filters in a drawer (bottom-opening) on mobile
  const MobileFilters = () => (
    <Drawer open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="group flex items-center gap-1 hover:bg-transparent p-0"
          onClick={toggleFilters}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : 'rotate-0'}`} />
          <span className="text-lg font-semibold group-hover:underline">Filters</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter Books</DrawerTitle>
          <DrawerDescription>
            Narrow down your search using these filters.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8">
          {renderFilterContent()}
        </div>
      </DrawerContent>
    </Drawer>
  );

  return (
    <div className="container mx-auto pt-8 pb-16">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-4xl font-bold">{getTitle()}</h1>
        <div className="flex items-center gap-4">
          {isMobile ? <MobileFilters /> : <DesktopFilters />}
          
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {activeFilters.map(filter => (
                <Badge key={filter} variant="secondary" className="flex items-center gap-1">
                  {filter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => toggleFilter(filter)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <Skeleton className="h-[300px] w-full rounded-md" />
              <Skeleton className="h-6 w-3/4 mt-2" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold text-red-500">Error loading books</h2>
          <p className="text-muted-foreground mt-2">There was an error loading the books. Please try again.</p>
        </div>
      ) : loadedBooks.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold">No books found</h2>
          <p className="text-muted-foreground mt-2">
            There are no books in this category yet.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {loadedBooks.map((book) => (
              <div key={book.id} className="relative">
                <BookCard 
                  book={book} 
                  taxonomicScore={book.taxonomicScore} 
                  matchingTaxonomies={book.matchingTaxonomies}
                />
              </div>
            ))}
          </div>

          {/* Load more trigger */}
          <div
            id="load-more-trigger"
            className="w-full h-20 flex items-center justify-center mt-8"
          >
            {isLoadingMore && (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="mt-2 text-muted-foreground">Loading more books...</span>
              </div>
            )}
            {!isLoadingMore && hasMore && (
              <Button onClick={loadMoreBooks} variant="outline">
                Load More Books
              </Button>
            )}
            {!hasMore && loadedBooks.length > 10 && (
              <p className="text-muted-foreground">You've reached the end of the list.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}