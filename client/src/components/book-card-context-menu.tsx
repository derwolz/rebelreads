import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, 
  Bookmark, 
  Plus, 
  ExternalLink, 
  UserRound, 
  Ban, 
  Flag
} from "lucide-react";
import { BookShelf } from "@shared/schema";
import { Book } from "../types";

interface BookCardContextMenuProps {
  book: Book;
  children: React.ReactNode;
  onContextMenuOpen?: () => void;
  onContextMenuClose?: () => void;
}

export function BookCardContextMenu({ book, children, onContextMenuOpen, onContextMenuClose }: BookCardContextMenuProps) {
  const { user } = useAuth();
  const { setIsOpen: setAuthModalOpen } = useAuthModal();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  
  // State for shelve dialog
  const [isShelveDialogOpen, setIsShelveDialogOpen] = useState(false);
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  
  // State for referral dialog
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);

  // Fetch reading status (for wishlist)
  const { data: readingStatus = {isWishlisted: false, isCurrentlyReading: false, isCompleted: false} } = useQuery<{isWishlisted: boolean; isCurrentlyReading: boolean; isCompleted: boolean}>({
    queryKey: [`/api/books/${book.id}/reading-status`],
    enabled: !!user,
  });

  // Fetch bookshelves
  const { data: bookshelves = [], isLoading: isLoadingShelves } = useQuery<BookShelf[]>({
    queryKey: ["/api/bookshelves"],
    enabled: !!user,
  });

  // Fetch follow status
  const { data: followStatus = {isFollowing: false} } = useQuery<{isFollowing: boolean}>({
    queryKey: [`/api/authors/${book.authorId}/following`],
    enabled: !!user && book.authorId !== user.id,
  });

  // Toggle wishlist mutation
  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      const method = readingStatus?.isWishlisted ? "DELETE" : "POST";
      return apiRequest(method, `/api/books/${book.id}/wishlist`, { bookId: book.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/books/${book.id}/reading-status`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: readingStatus?.isWishlisted ? "Removed from wishlist" : "Added to wishlist",
        description: readingStatus?.isWishlisted 
          ? `Removed "${book.title}" from your wishlist` 
          : `Added "${book.title}" to your wishlist`,
      });
    },
    onError: (error) => {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Failed to update wishlist",
        variant: "destructive",
      });
    },
  });

  // Follow/unfollow author mutation
  const followAuthorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/authors/${book.authorId}/${followStatus?.isFollowing ? 'unfollow' : 'follow'}`
      );
      if (!res.ok) throw new Error("Failed to update follow status");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${book.authorId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${book.authorId}/following`] });
      toast({
        title: followStatus?.isFollowing ? "Unfollowed" : "Following",
        description: `You are ${followStatus?.isFollowing ? 'no longer' : 'now'} following ${book.authorName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  // Add to shelf mutation
  const addToShelfMutation = useMutation({
    mutationFn: async ({ shelfId, note }: { shelfId: number; note?: string }) => {
      // First add the book to the shelf
      const res = await fetch(`/api/bookshelves/${shelfId}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to add book to shelf (${res.status})`
        );
      }

      // If there's a note, add it
      if (note && note.trim()) {
        const noteRes = await fetch(`/api/bookshelves/${shelfId}/books/${book.id}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: note }),
        });

        if (!noteRes.ok) {
          // Note failed but book was added
          console.error("Failed to add note, but book was added to shelf");
        }
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookshelves"] });
      setIsShelveDialogOpen(false);
      setSelectedShelfId(null);
      setNoteText("");
      setShowNoteInput(false);
      toast({
        title: "Book shelved",
        description: `"${book.title}" has been added to your shelf`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add book to shelf",
        variant: "destructive",
      });
    },
  });

  // Create new shelf mutation
  const createShelfMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/bookshelves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create shelf (${res.status})`);
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookshelves"] });
      setSelectedShelfId(data.id);
      setShowNoteInput(true);
      toast({
        title: "Shelf created",
        description: `Created new shelf "${data.title}"`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create shelf",
        variant: "destructive",
      });
    },
  });

  const handleShelfSelect = (shelfId: number) => {
    setSelectedShelfId(shelfId);
    setShowNoteInput(true);
    setIsShelveDialogOpen(true);
  };

  const handleCreateShelf = () => {
    const title = prompt("Enter a name for your new shelf:");
    if (title && title.trim()) {
      createShelfMutation.mutate(title.trim());
      setIsShelveDialogOpen(true);
    }
  };

  const handleAddToShelf = () => {
    if (selectedShelfId) {
      addToShelfMutation.mutate({
        shelfId: selectedShelfId,
        note: noteText,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddToShelf();
    }
  };

  const handleReferralLinkSelect = (link: {url: string; retailer?: string; customName?: string; domain?: string}) => {
    // Simple tracking of referral clicks
    const trackReferralClick = async () => {
      try {
        await apiRequest("POST", `/api/books/${book.id}/referral-click`, {
          referralUrl: link.url,
          source: "context-menu",
          context: window.location.pathname,
        });
      } catch (error) {
        console.error("Failed to track referral click:", error);
      }
    };

    // Track the click and open the link
    trackReferralClick();
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const handleAuthCheck = (callback: () => void) => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      callback();
    }
  };

  const navigateToAuthorPage = () => {
    navigate(`/authors/${book.authorId}`);
  };

  // Function to handle context menu open event
  const handleContextMenuOpen = () => {
    if (onContextMenuOpen) onContextMenuOpen();
  };

  // Function to handle context menu close event
  const handleContextMenuClose = () => {
    if (onContextMenuClose) onContextMenuClose();
  };

  return (
    <>
      <ContextMenu onOpenChange={(open) => {
        if (open) {
          handleContextMenuOpen();
        } else {
          handleContextMenuClose();
        }
      }}>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem
            inset
            onClick={() => handleAuthCheck(() => toggleWishlistMutation.mutate())}
          >
            <Heart className="mr-2 h-4 w-4" />
            {readingStatus?.isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          </ContextMenuItem>
          
          {/* Add to Bookshelf with submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Bookmark className="mr-2 h-4 w-4" />
              Add to Bookshelf
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {bookshelves && bookshelves.length > 0 ? (
                <>
                  {bookshelves.map((shelf) => (
                    <ContextMenuItem 
                      key={shelf.id}
                      onClick={() => handleAuthCheck(() => handleShelfSelect(shelf.id))}
                    >
                      {shelf.title}
                    </ContextMenuItem>
                  ))}
                  <ContextMenuSeparator />
                </>
              ) : null}
              <ContextMenuItem onClick={() => handleAuthCheck(handleCreateShelf)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Shelf
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          
          {/* Follow Author */}
          {book.authorId && book.authorName && (
            <ContextMenuItem
              inset
              onClick={() => handleAuthCheck(() => followAuthorMutation.mutate())}
            >
              <UserRound className="mr-2 h-4 w-4" />
              {followStatus?.isFollowing ? `Unfollow ${book.authorName}` : `Follow ${book.authorName}`}
            </ContextMenuItem>
          )}
          
          {/* Visit Link with submenu */}
          {book.referralLinks && book.referralLinks.length > 0 && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Link
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                {book.referralLinks.map((link: {url: string; retailer?: string; customName?: string; domain?: string}, index: number) => (
                  <ContextMenuItem 
                    key={index}
                    onClick={() => handleReferralLinkSelect(link)}
                  >
                    {link.customName || link.retailer || (link.domain ? `${link.domain}` : 'Link')}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          
          <ContextMenuSeparator />
          
          {/* Bottom section - Block content */}
          <ContextMenuLabel>Block Content</ContextMenuLabel>
          
          {/* Block Author */}
          {book.authorId && book.authorName && (
            <ContextMenuItem
              inset
              onClick={() => handleAuthCheck(() => {
                // Implement blocking author functionality
                toast({
                  title: "Block Author",
                  description: `Author blocking feature coming soon`,
                });
              })}
            >
              <Ban className="mr-2 h-4 w-4" />
              Block {book.authorName}
            </ContextMenuItem>
          )}
          
          {/* Block Publisher */}
          <ContextMenuItem
            inset
            onClick={() => handleAuthCheck(() => {
              // Implement blocking publisher functionality
              toast({
                title: "Block Publisher",
                description: `Publisher blocking feature coming soon`,
              });
            })}
          >
            <Ban className="mr-2 h-4 w-4" />
            Block Publisher
          </ContextMenuItem>
          
          {/* Report Book */}
          <ContextMenuItem
            inset
            onClick={() => handleAuthCheck(() => {
              // Implement report book functionality
              toast({
                title: "Report Book",
                description: `Book reporting feature coming soon`,
              });
            })}
          >
            <Flag className="mr-2 h-4 w-4" />
            Report This Book
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Shelve Dialog */}
      <Dialog open={isShelveDialogOpen} onOpenChange={setIsShelveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add to Shelf</DialogTitle>
            <DialogDescription>
              {selectedShelfId ? 
                "Add a note about this book (optional)" : 
                "Select a shelf to add this book to"}
            </DialogDescription>
          </DialogHeader>
          
          {showNoteInput && selectedShelfId ? (
            <div className="space-y-4 py-4">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add your thoughts about this book..."
                className="h-24"
                onKeyDown={handleKeyDown}
              />
            </div>
          ) : null}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShelveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToShelf} disabled={!selectedShelfId}>
              Add to Shelf
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}