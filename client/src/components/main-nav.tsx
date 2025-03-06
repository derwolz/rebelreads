import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Search, Settings, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_GENRES } from "@shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { useDebounce } from "@/hooks/use-debounce";

interface MainNavProps {
  onSearch?: (query: string, type: string) => void;
}

type SearchFilter = "books" | "authors" | "genres";

export function MainNav({ onSearch }: MainNavProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("books");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: searchResults, isLoading } = useQuery<{
    books: Book[];
    authors: { id: number; name: string }[];
    genres: string[];
  }>({
    queryKey: ["/api/search", debouncedSearch, activeFilter],
    enabled: debouncedSearch.length > 1,
  });

  const handleFilterChange = (filter: SearchFilter) => {
    setActiveFilter(filter);
    onSearch?.(searchQuery, filter);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      if (activeFilter === "books") {
        navigate(`/search/books?q=${encodeURIComponent(searchQuery)}`);
      } else if (activeFilter === "authors") {
        navigate(`/search/authors?q=${encodeURIComponent(searchQuery)}`);
      } else {
        navigate(`/genres/${encodeURIComponent(searchQuery)}`);
      }
      setOpen(false);
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filters: { value: SearchFilter; label: string }[] = [
    { value: "books", label: "Books" },
    { value: "authors", label: "Authors" },
    { value: "genres", label: "Genres" },
  ];

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/">
            <h1 className="text-2xl font-bold text-primary">BookNook</h1>
          </Link>

          <div className="hidden md:flex items-center gap-2 relative">
            <Button
              variant="outline"
              className="relative w-96 justify-start text-sm text-muted-foreground"
              onClick={() => setOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Search...
              <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {user.isAuthor && (
                <Link href="/pro">
                  <Button variant="outline">Author Dashboard</Button>
                </Link>
              )}
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImageUrl || undefined} alt={user.username} />
                  <AvatarFallback>👤</AvatarFallback>
                </Avatar>
                <Link href="/dashboard">
                  <span className="text-sm text-muted-foreground hover:underline">
                    {user.username}
                  </span>
                </Link>
              </div>
              <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button>Login</Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Menu</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 py-2 space-y-4">
                <Button
                  variant="outline"
                  className="relative w-full justify-start text-sm text-muted-foreground"
                  onClick={() => setOpen(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search...
                </Button>
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || undefined} alt={user.username} />
                        <AvatarFallback>👤</AvatarFallback>
                      </Avatar>
                      <Link href="/dashboard">
                        <span className="text-sm text-muted-foreground hover:underline">
                          {user.username}
                        </span>
                      </Link>
                    </div>
                    <div className="grid gap-2">
                      {user.isAuthor && (
                        <Link href="/pro">
                          <Button variant="outline" className="w-full justify-start">
                            Author Dashboard
                          </Button>
                        </Link>
                      )}
                      <Link href="/settings">
                        <Button variant="outline" className="w-full justify-start">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => logoutMutation.mutate()}
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Link href="/auth">
                    <Button className="w-full">Login</Button>
                  </Link>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <form onSubmit={handleSearchSubmit}>
          <div className="flex items-center gap-2 p-2 border-b">
            {filters.map((filter) => (
              <Badge
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleFilterChange(filter.value)}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
          <CommandInput
            placeholder="Search books, authors, or genres..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {searchResults?.books && activeFilter === "books" && (
              <CommandGroup heading="Books">
                {searchResults.books.slice(0, 5).map((book) => (
                  <CommandItem key={book.id} value={book.title}>
                    <Link href={`/books/${book.id}`} className="flex items-center gap-2">
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-8 h-12 object-cover rounded"
                      />
                      <div>
                        <div className="font-medium">{book.title}</div>
                        <div className="text-sm text-muted-foreground">by {book.author}</div>
                      </div>
                    </Link>
                  </CommandItem>
                ))}
                {searchResults.books.length > 0 && (
                  <CommandItem onSelect={() => handleSearchSubmit()}>
                    <div className="w-full text-center text-sm text-muted-foreground">
                      View all results →
                    </div>
                  </CommandItem>
                )}
              </CommandGroup>
            )}
            {searchResults?.authors && activeFilter === "authors" && (
              <CommandGroup heading="Authors">
                {searchResults.authors.slice(0, 5).map((author) => (
                  <CommandItem key={author.id} value={author.name}>
                    <Link href={`/authors/${author.id}`} className="flex items-center gap-2">
                      {author.name}
                    </Link>
                  </CommandItem>
                ))}
                {searchResults.authors.length > 0 && (
                  <CommandItem onSelect={() => handleSearchSubmit()}>
                    <div className="w-full text-center text-sm text-muted-foreground">
                      View all results →
                    </div>
                  </CommandItem>
                )}
              </CommandGroup>
            )}
            {searchResults?.genres && activeFilter === "genres" && (
              <CommandGroup heading="Genres">
                {searchResults.genres.slice(0, 5).map((genre) => (
                  <CommandItem key={genre} value={genre}>
                    <Link href={`/genres/${genre}`} className="flex items-center gap-2">
                      {genre}
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </form>
      </CommandDialog>
    </nav>
  );
}