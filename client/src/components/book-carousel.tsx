import { Book } from "@shared/schema";
import { BookCard } from "@/components/book-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function BookCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

interface BookCarouselProps {
  title: string;
  books?: Book[];
  isLoading: boolean;
  onDiscoverMore?: () => void;
}

export function BookCarousel({ title, books, isLoading, onDiscoverMore }: BookCarouselProps) {
  // Define custom options for Embla Carousel that allow flexibility
  const carouselOptions = {
    align: "start" as const,
    dragFree: true,
    containScroll: "trimSnaps" as const,
    slidesToScroll: 2,
  };

  return (
    <section className="mb-12 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{title}</h2>
        {onDiscoverMore && (
          <button 
            onClick={onDiscoverMore}
            className="text-primary hover:underline font-medium flex items-center" 
          >
            Discover More
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="ml-1"
            >
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        )}
      </div>
      <div className="max-w-[95vw] mx-auto">
        <Carousel className="w-full" opts={carouselOptions}>
          <CarouselContent>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <CarouselItem key={i} className="">
                    <BookCardSkeleton />
                  </CarouselItem>
                ))
              : books?.map((book) => (
                  <CarouselItem key={book.id} className="">
                    <div className="flex justify-center relative px-1">
                      <BookCard book={book} />
                    </div>
                  </CarouselItem>
                ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
