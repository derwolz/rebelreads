import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Search, Settings, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { useDebounce } from "@/hooks/use-debounce";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthModal } from "@/hooks/use-auth-modal";

export function MainNav({ onSearch }: { onSearch?: (query: string) => void }) {
  const { user, logoutMutation } = useAuth();
  const { setIsOpen } = useAuthModal();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: searchResults } = useQuery<{ books: Book[], metadata: { total: number, query: string } }>({
    queryKey: ["/api/search", debouncedSearch],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`)
        .then((response) => response.json()),
    enabled: debouncedSearch.length > 1,
  });

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setOpen(false);
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
console.log(searchResults, "searchResults");
  const renderSearchResults = () => {
    if (!searchResults?.books) return null;

    return (
      <CommandGroup heading="Search Results">
        {searchResults.books.slice(0, 5).map((book) => (
          <CommandItem key={book.id} value={book.title}>
            <Link
              href={`/books/${book.id}`}
              className="flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <img
                src={book.images?.find(img => img.imageType === "mini")?.imageUrl || "/images/placeholder-book.png"}
                alt={book.title}
                className="w-8 h-12 object-cover rounded"
              />
              <div>
                <div className="font-medium">{book.title}</div>
                <div className="text-sm text-muted-foreground">
                  by {book.author}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {book.description}
                </div>
              </div>
            </Link>
          </CommandItem>
        ))}
        {searchResults.books.length > 0 && (
          <CommandItem onSelect={handleSearchSubmit}>
            <div className="w-full text-center text-sm text-muted-foreground">
              View all results →
            </div>
          </CommandItem>
        )}
      </CommandGroup>
    );
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/">
            <h1 className="text-2xl font-bold text-primary">Sirened</h1>
          </Link>

          <div className="hidden md:flex items-center gap-2 relative">
            <Button
              variant="outline"
              className="relative w-96 justify-start text-sm text-muted-foreground"
              onClick={() => setOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Search books...
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
                  <AvatarImage
                    src={user.profileImageUrl || undefined}
                    alt={user.username}
                  />
                  <AvatarFallback>👤</AvatarFallback>
                </Avatar>
                <Link href="/dashboard">
                  <span className="text-sm text-muted-foreground hover:underline">
                    {user.username}
                  </span>
                </Link>
              </div>
              <Button variant="ghost" onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSuccess: () => navigate("/")
                });
              }}>
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsOpen(true)}>
              Login
            </Button>
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
                        <AvatarImage
                          src={user.profileImageUrl || undefined}
                          alt={user.username}
                        />
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
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            Author Dashboard
                          </Button>
                        </Link>
                      )}
                      <Link href="/settings">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          logoutMutation.mutate(undefined, {
                            onSuccess: () => navigate("/")
                          });
                        }}
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => setIsOpen(true)}
                  >
                    Login
                  </Button>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <form onSubmit={handleSearchSubmit}>
          <CommandInput
            placeholder="Search books..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {renderSearchResults()}
          </CommandList>
        </form>
      </CommandDialog>
    </nav>
  );
}