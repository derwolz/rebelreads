import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenIcon, ArrowRightIcon } from 'lucide-react';

interface Book {
  id: number;
  title: string;
  coverImageUrl?: string;
}

interface BookshelfCardProps {
  id: number;
  title: string;
  bookCount: number;
  coverImageUrl?: string;
  username: string;
  featuredBooks?: Book[];
}

/**
 * BookshelfCard Component
 * 
 * Displays a user's bookshelf as a card with a preview of books contained within.
 * Used on the user profile page to showcase pinned/featured bookshelves.
 */
export const BookshelfCard: React.FC<BookshelfCardProps> = ({
  id,
  title,
  bookCount,
  coverImageUrl,
  username,
  featuredBooks = [],
}) => {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium line-clamp-1">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-3 mb-3">
          <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {bookCount} {bookCount === 1 ? 'book' : 'books'}
          </span>
        </div>
        
        {featuredBooks && featuredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {featuredBooks.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="relative aspect-[2/3] rounded-md overflow-hidden bg-muted"
              >
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <BookOpenIcon className="h-6 w-6 text-secondary-foreground opacity-70" />
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="w-full h-24 flex items-center justify-center bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">No books yet</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex justify-between"
          asChild
        >
          <Link href={`/${username}/shelves/${id}`}>
            <span>View shelf</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};