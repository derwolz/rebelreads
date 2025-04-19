import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Trash, 
  MoreHorizontal, 
  SortAsc, 
  SortDesc, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink 
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Inline utility function for date formatting
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

interface BookSearchResponse {
  books: (Book & { authorName?: string; authorImageUrl?: string })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AdminBookManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const limit = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      // Set new field with default ascending direction
      setSortBy(field);
      setSortDir("asc");
    }
  };

  // Fetch books with search and pagination
  const { data, isLoading, isError } = useQuery<BookSearchResponse>({
    queryKey: ["/api/admin/books/search", searchQuery, page, sortBy, sortDir],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/books/search?query=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}&sortBy=${sortBy}&sortDir=${sortDir}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }
      return response.json();
    },
  });

  // Mutation for deleting a book
  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete book");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/books/search"] 
      });
      toast({
        title: "Book deleted",
        description: "The book has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete book: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    if (!data?.pagination) return null;
    
    const { page: currentPage, totalPages } = data.pagination;
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          onClick={() => setPage(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if there are more than 5 pages and we're not at the beginning
    if (totalPages > 5 && currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <span className="px-4">...</span>
        </PaginationItem>
      );
    }
    
    // Show current page and neighbors
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= 1 || i >= totalPages) continue; // Skip first and last as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => setPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show ellipsis if there are more than 5 pages and we're not at the end
    if (totalPages > 5 && currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <span className="px-4">...</span>
        </PaginationItem>
      );
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            onClick={() => setPage(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Book Management</CardTitle>
          <CardDescription>
            Search and manage books in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Search by title or author..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit">Search</Button>
          </form>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive">
              Error loading books. Please try again.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Cover</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                        <div className="flex items-center">
                          Title
                          {sortBy === "title" && (
                            sortDir === "asc" ? 
                              <SortAsc className="ml-1 h-4 w-4" /> : 
                              <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("publishedDate")}>
                        <div className="flex items-center">
                          Published
                          {sortBy === "publishedDate" && (
                            sortDir === "asc" ? 
                              <SortAsc className="ml-1 h-4 w-4" /> : 
                              <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("impressions")}>
                        <div className="flex items-center">
                          Views
                          {sortBy === "impressions" && (
                            sortDir === "asc" ? 
                              <SortAsc className="ml-1 h-4 w-4" /> : 
                              <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.books && data.books.length > 0 ? (
                      data.books.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell>
                            {book.images && book.images[0] ? (
                              <img 
                                src={book.images[0].imageUrl} 
                                alt={book.title} 
                                className="w-16 h-auto object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-20 bg-muted flex items-center justify-center rounded">
                                <span className="text-xs text-muted-foreground">No cover</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{book.title}</TableCell>
                          <TableCell>{book.authorName || 'Unknown'}</TableCell>
                          <TableCell>
                            {book.publishedDate ? formatDate(new Date(book.publishedDate)) : 'Unknown'}
                          </TableCell>
                          <TableCell>{book.impressionCount}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => window.open(`/books/${book.id}`, '_blank')}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Book</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{book.title}"?
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteBookMutation.mutate(book.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          No books found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {data.books.length} of {data.pagination.total} results
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationPrevious 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        isActive={page > 1}
                      />
                      {generatePaginationItems()}
                      <PaginationNext 
                        onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                        isActive={page < data.pagination.totalPages}
                      />
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}