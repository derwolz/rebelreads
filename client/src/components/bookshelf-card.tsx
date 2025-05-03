import React from 'react';
import { cn } from '@/lib/utils';
import { BookOpenIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BookshelfCardProps {
  title: string;
  coverImageUrl?: string;
  className?: string;
}

export const BookshelfCard: React.FC<BookshelfCardProps> = ({
  title,
  coverImageUrl,
  className,
}) => {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer h-[160px]",
        className
      )}
    >
      <div className="relative h-full">
        {/* Bookshelf background/cover */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/40">
          {coverImageUrl && (
            <img 
              src={coverImageUrl} 
              alt={title}
              className="w-full h-full object-cover opacity-60"
            />
          )}
        </div>
        
        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-background/30" />
        
        {/* Content */}
        <CardContent className="relative h-full flex flex-col items-center justify-center p-4 text-center">
          <BookOpenIcon className="h-8 w-8 mb-2" />
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
        </CardContent>
      </div>
    </Card>
  );
};

export default BookshelfCard;