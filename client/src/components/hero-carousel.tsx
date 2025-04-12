
import { Book } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function HeroSkeleton() {
  return (
    <div className="w-full h-[400px] bg-muted/50 rounded-xl relative overflow-hidden flex items-center">
      <Skeleton className="absolute inset-0" />
      <div className="relative z-10 p-10 space-y-4 max-w-lg">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export function HeroCarousel() {
  const [, navigate] = useLocation();
  
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
    select: (data) => data.filter(book => book.promoted).slice(0, 5)
  });

  return (
    <section className="mb-12">
      <h2 className="sr-only">Featured Books</h2>
      <Carousel className="w-full">
        <CarouselContent>
          {isLoading ? (
            <CarouselItem>
              <HeroSkeleton />
            </CarouselItem>
          ) : books && books.length > 0 ? (
            books.map((book) => (
              <CarouselItem key={book.id}>
                <div 
                  className="w-full h-[400px]  relative overflow-hidden flex items-center"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.3)), url(${book.images?.find(img => img.imageType === "hero")?.imageUrl || "/images/placeholder-book.png"})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="relative z-10 p-10 space-y-4 max-w-lg text-white">
                    <h3 className="text-4xl font-bold">{book.title}</h3>
                    <p className="text-xl">by {book.author}</p>
                    <p className="line-clamp-3">{book.description}</p>
                    <Button 
                      size="lg" 
                      onClick={() => navigate(`/books/${book.id}`)}
                    >
                      Read More
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))
          ) : (
            <CarouselItem>
              <div className="w-full h-[400px] bg-muted rounded-xl flex items-center justify-center">
                <p className="text-lg text-muted-foreground">No promoted books available</p>
              </div>
            </CarouselItem>
          )}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </section>
  );
}
