import { Book } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function HeroSkeleton() {
  return (
    <div className=" h-[33vh] w-[95vw] bg-muted/50 relative overflow-hidden flex flex-col justify-between">
      <Skeleton className="absolute inset-0" />
      <div className="relative z-10 p-6 space-y-3 max-w-lg">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="relative z-10 p-6">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

// Pagination dots component
function PaginationDots({
  total,
  current,
  onClick,
}: {
  total: number;
  current: number;
  onClick: (index: number) => void;
}) {
  return (
    <div className="flex justify-center gap-1 mt-3">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onClick(i)}
          className={`w-2 h-2 rounded-full transition-colors ${
            i === current ? "bg-primary" : "bg-muted-foreground/30"
          }`}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

export function HeroCarousel() {
  const [, navigate] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
    select: (data) => data.filter((book) => book.promoted).slice(0, 5),
  });

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
    // You would also need to control the carousel to go to that slide
    // This would depend on how the Carousel component is implemented
  };

  return (
    <section className="mb-8">
      <h2 className="sr-only">Featured Books</h2>
      <Carousel
        className="w-[95vw]"
        setApi={(api) => {
          // If the carousel component exposes an API, you can use it to control slides
          // For example: api.scrollTo(currentSlide)
        }}
      >
        <CarouselContent>
          {isLoading ? (
            <CarouselItem>
              <HeroSkeleton />
            </CarouselItem>
          ) : books && books.length > 0 ? (
            books.map((book) => (
              <CarouselItem key={book.id}>
                <div className="relative w-[95vw] overflow-hidden">
                  {/* Background Image - 33vh height and full-width */}
                  <div
                    className="w-[95vw] h-[33vh] bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${book.images?.find((img) => img.imageType === "background" || img.imageType === "hero")?.imageUrl || "/images/placeholder-book.png"})`,
                    }}
                  >
                    {/* Horizontal black to alpha gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
                  </div>

                  {/* Content positioned absolutely over the image */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                    <div className="space-y-2 w-1/2">
                      <h3 className="text-3xl font-bold">{book.title} X</h3>
                      <div className="flex space-x-2">
                        {/* Rating indicators - small squares */}
                        <div className="flex space-x-0.5">
                          {[1, 2, 3, 4].map((_, i) => (
                            <div key={i} className="w-4 h-4 bg-white/20"></div>
                          ))}
                        </div>
                        {/* Small book badge */}
                        <div className="bg-white/20 px-1 text-xs flex items-center">
                          <span>★</span>
                        </div>
                      </div>
                    </div>

                    {/* Play button */}
                    <div>
                      <Button
                        variant="default"
                        className="bg-purple-700 hover:bg-purple-800 gap-2 px-4 py-2"
                        onClick={() => navigate(`/book-details?authorName=${encodeURIComponent(book.authorName)}&bookTitle=${encodeURIComponent(book.title)}`)}
                      >
                        <span className="text-lg">▶</span> PLAY NOW
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))
          ) : (
            <CarouselItem>
              <div className="w-[95vw] h-[50vh] bg-muted flex items-center justify-center">
                <p className="text-lg text-muted-foreground">
                  No promoted books available
                </p>
              </div>
            </CarouselItem>
          )}
        </CarouselContent>

        {/* Small pagination dots */}
        {books && books.length > 1 && (
          <div className="mt-2">
            <PaginationDots
              total={books.length}
              current={currentSlide}
              onClick={handleDotClick}
            />
          </div>
        )}
      </Carousel>
    </section>
  );
}
