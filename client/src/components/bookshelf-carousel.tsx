import { Link } from "wouter";
import { BookShelf } from "../../shared/schema";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, BookOpen } from "lucide-react";

interface BookshelfCarouselProps {
  title: string;
  bookshelves?: BookShelf[];
  isLoading: boolean;
}

export function BookshelfCarousel({ title, bookshelves, isLoading }: BookshelfCarouselProps) {
  // Define custom options for carousel
  const carouselOptions = {
    align: "start" as const,
    dragFree: true,
    containScroll: "trimSnaps" as const,
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="relative">
        <Carousel className="w-full" opts={carouselOptions}>
          <CarouselContent>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <CarouselItem key={i} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <BookshelfCardSkeleton />
                  </CarouselItem>
                ))
              : bookshelves && bookshelves.length > 0
              ? bookshelves.map((shelf) => (
                  <CarouselItem key={shelf.id} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <BookshelfCard shelf={shelf} />
                  </CarouselItem>
                ))
              : (
                <CarouselItem className="basis-full">
                  <div className="flex flex-col items-center justify-center h-40 bg-muted/20 rounded-lg p-4 text-center">
                    <Book className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No bookshelves yet. Create one in your profile settings.
                    </p>
                  </div>
                </CarouselItem>
              )}
          </CarouselContent>
          {bookshelves && bookshelves.length > 1 && (
            <>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
}

interface BookshelfCardProps {
  shelf: BookShelf;
}

function BookshelfCard({ shelf }: BookshelfCardProps) {
  return (
    <Link href={`/bookshelves/${shelf.id}`}>
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer">
        <div className="aspect-[3/4] relative">
          <img
            src={shelf.coverImageUrl || "/images/default-bookshelf-cover.svg"}
            alt={shelf.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-medium text-lg line-clamp-2">{shelf.title}</h3>
          </div>
        </div>
        <CardContent className="p-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">View Shelf</span>
        </CardContent>
      </Card>
    </Link>
  );
}

function BookshelfCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="aspect-[3/4] bg-muted animate-pulse" />
      <CardContent className="p-3">
        <Skeleton className="h-5 w-full" />
      </CardContent>
    </Card>
  );
}