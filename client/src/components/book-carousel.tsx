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
}

export function BookCarousel({ title, books, isLoading }: BookCarouselProps) {
  // Define custom options for Embla Carousel that allow flexibility
  const carouselOptions = {
    align: "start" as const,
    dragFree: true,
    containScroll: "trimSnaps" as const,
    slidesToScroll: 2,
  };

  return (
    <section className="mb-12 relative">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>
      <div className="max-w-[95vw] mx-auto">
        <Carousel className="w-full" opts={carouselOptions}>
          <CarouselContent>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <CarouselItem
                    key={i}
                    className="sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 2xl:w-1/6"
                  >
                    <BookCardSkeleton />
                  </CarouselItem>
                ))
              : books?.map((book) => (
                  <CarouselItem
                    key={book.id}
                    className="sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 2xl:w-1/6"
                  >
                    <div className="flex justify-center relative px-1">
                      <BookCard book={book} />
                    </div>
                  </CarouselItem>
                ))}
          </CarouselContent>
          <CarouselPrevious className="absolute flex left-0 z-10 w-8" />
          <CarouselNext className="absolute flex right-0 z-10 w-8" />
        </Carousel>
      </div>
    </section>
  );
}
