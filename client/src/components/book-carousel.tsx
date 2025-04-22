import { Book } from "../types";
import { BookCard } from "@/components/book-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
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
  showPublishedDate?: boolean;
}

export function BookCarousel({ title, books, isLoading, showPublishedDate = false }: BookCarouselProps) {
  // Define custom options for Embla Carousel that allow flexibility
  
  const carouselOptions = {
    align: "start" as const,
    dragFree: true,
    containScroll: "trimSnaps" as const,
    slidesToScroll: 2,
  };
  function getQuarterYear(date: Date): string {
    const month = date.getMonth(); // getMonth() returns month index starting from 0
    const year = date.getFullYear();

    const quarter = Math.floor(month / 3) + 1; // Divide by 3 and add 1 to get the quarter

    return `Q${quarter} ${year}`;
  }
  return (
    <section className="mb-12 relative">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>
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
                    <div className="flex flex-col justify-center relative px-1">
                      <BookCard book={book} />
                      {showPublishedDate && book.publishedDate && (
                        <div className="mt-2 text-center">
                          <Badge variant="outline" className="mx-auto py-1">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {getQuarterYear(new Date(book.publishedDate))}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
