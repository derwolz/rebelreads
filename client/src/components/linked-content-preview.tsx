import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Book, BookShelf } from "@shared/schema";

// Define types for the content that can be linked
type LinkedContentType = "book" | "bookshelf";

// Define interfaces for API responses
interface BookResponse {
  id: number;
  title: string;
  authorId: number;
  authorName?: string;
  description: string;
  promoted: boolean;
  pageCount: number | null;
  formats: string[];
  publishedDate: string | null;
  awards: string[] | null;
  originalTitle: string | null;
  series: string | null;
  setting: string | null;
  characters: string[] | null;
  isbn: string | null;
  asin: string | null;
  language: string;
  images?: Array<{
    id: number;
    bookId: number;
    imageUrl: string;
    imageType: string;
    width: number;
    height: number;
  }>;
}

interface ShelfResponse {
  shelf: {
    id: number;
    title: string;
    coverImageUrl: string;
    userId: number;
    rank: number;
    isShared: boolean;
    createdAt: string;
    updatedAt: string;
  };
  owner?: {
    id: number;
    username: string;
    displayName: string;
    profileImageUrl?: string;
  };
  books: Array<any>;
}

interface LinkedContentPreviewProps {
  type: LinkedContentType;
  id: number | string;
  username?: string; // Required for bookshelf
  shelfName?: string; // Required for bookshelf
  className?: string;
}

export function LinkedContentPreview({
  type,
  id,
  username,
  shelfName,
  className,
}: LinkedContentPreviewProps) {
  // For books, fetch book details using the book ID from our public API
  const {
    data: bookData,
    isLoading: isBookLoading,
    error: bookError,
  } = useQuery<BookResponse>({
    queryKey: [`/api/link-preview/books/${id}`],
    enabled: type === "book" && !!id,
  });

  // For bookshelves, fetch the shelf details using username and shelf name from our public API
  // If shelfName is already encoded (contains %20), don't encode it again
  const isShelfNameEncoded = shelfName?.includes('%20');
  const formattedShelfName = isShelfNameEncoded
    ? shelfName
    : shelfName && encodeURIComponent(shelfName);
    
  const {
    data: shelfData,
    isLoading: isShelfLoading,
    error: shelfError,
  } = useQuery<ShelfResponse & {
    owner?: {
      displayName?: string;
      username?: string;
    }
  }>({
    queryKey: [
      `/api/link-preview/book-shelf?username=${encodeURIComponent(
        username || ""
      )}&shelfname=${formattedShelfName || ""}`,
    ],
    enabled: type === "bookshelf" && !!username && !!shelfName,
  });
  
  // We don't need to separately fetch user data anymore as our link preview API provides it
  // This is just a placeholder to keep the existing variable references working
  const isUserLoading = false;
  const userError = null;
  const userData = null;

  // Create the URL based on the content type
  const getContentUrl = () => {
    if (type === "book") {
      return `/books/${id}`;
    } else if (type === "bookshelf") {
      return `/book-shelf/share?username=${encodeURIComponent(
        username || ""
      )}&shelfname=${encodeURIComponent(shelfName || "")}`;
    }
    return "#";
  };

  // Add some console logging to debug what's happening
  console.log(`Rendering LinkedContentPreview for type: ${type}`, { 
    id, username, shelfName,
    bookLoading: isBookLoading,
    bookError,
    bookData,
    shelfLoading: isShelfLoading,
    shelfError,
    shelfData,
    userLoading: isUserLoading,
    userError,
    userData
  });

  // Loading state
  if ((type === "book" && isBookLoading) || (type === "bookshelf" && (isShelfLoading || isUserLoading))) {
    return (
      <div className={cn("flex items-center h-16 bg-gray-900 rounded border border-gray-800 p-2 animate-pulse", className)}>
        <div className="h-12 w-12 bg-gray-800 rounded mr-3"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Error state with detailed information
  if ((type === "book" && bookError) || (type === "bookshelf" && (shelfError || userError))) {
    const apiUrl = type === 'book' 
      ? `/api/link-preview/books/${id}` 
      : `/api/link-preview/book-shelf?username=${encodeURIComponent(username || "")}&shelfname=${formattedShelfName || ""}`;
      
    console.error('LinkedContentPreview error:', { 
      type, bookError, shelfError, userError, 
      url: apiUrl,
      shelfName,
      formattedShelfName
    });
    
    return (
      <div className={cn("flex items-center h-16 bg-gray-900 rounded border border-gray-800 p-2", className)}>
        <div className="w-full text-center text-gray-400 text-sm">
          Error loading content preview
        </div>
      </div>
    );
  }

  // Render book preview
  if (type === "book" && bookData) {
    const book = bookData;
    const coverImage = book.images?.find((img: { imageType: string }) => img.imageType === "mini")?.imageUrl || "/images/placeholder-book.png";

    return (
      <Link href={getContentUrl()}>
        <div className={cn("flex items-center bg-gray-900 rounded border border-gray-800 p-2 hover:bg-gray-800 transition-colors duration-200 cursor-pointer", className)}>
          <img 
            src={coverImage} 
            alt={book.title} 
            className="h-12 w-9 object-cover mr-3 rounded"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-white truncate">{book.title}</div>
            <div className="text-xs text-gray-400 truncate">{book.authorName || "Unknown Author"}</div>
            <div className="text-xs text-emerald-500 mt-1">Sirened.com</div>
          </div>
        </div>
      </Link>
    );
  }

  // Render bookshelf preview
  if (type === "bookshelf" && shelfData && shelfData.shelf) {
    const shelf = shelfData.shelf;
    // Use user data first, then fall back to shelf owner data, then username
    const ownerDisplayName = 
      shelfData.owner?.displayName || 
      username || 
      "Anonymous";
    const coverImage = shelf.coverImageUrl || "/images/default-bookshelf-cover.svg";

    return (
      <Link href={getContentUrl()}>
        <div className={cn("flex items-center bg-gray-900 rounded border border-gray-800 p-2 hover:bg-gray-800 transition-colors duration-200 cursor-pointer", className)}>
          <img 
            src={coverImage} 
            alt={shelf.title} 
            className="h-14 w-14 object-cover mr-3 rounded"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-white truncate">{shelf.title}</div>
            <div className="text-xs text-gray-400 truncate">{ownerDisplayName}</div>
            <div className="text-xs text-emerald-500 mt-1">Sirened.com</div>
          </div>
        </div>
      </Link>
    );
  }

  // If nothing to display
  return null;
}