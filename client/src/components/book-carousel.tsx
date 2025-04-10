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
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>
      <Carousel className="w-full">
        <CarouselContent>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <CarouselItem key={i} className="md:basis-1/3 lg:basis-1/4">
                <BookCardSkeleton />
              </CarouselItem>
            ))
          ) : (
            books?.slice(0, 10).map((book) => (
              <CarouselItem key={book.id} className="md:basis-1/3 lg:basis-1/4 pb-1">
                <BookCard book={book} />
              </CarouselItem>
            ))
          )}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </section>
  );
}
