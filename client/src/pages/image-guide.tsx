import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Book } from "@shared/schema";

export function ImageGuidePage() {
  // Fetch a sample book to display its images
  const { data: book, isLoading } = useQuery<Book>({
    queryKey: ["/api/books", "sample"],
    queryFn: async () => {
      // Fetch a random book to use as an example
      const response = await fetch(`/api/books/random?limit=1`);
      if (!response.ok) throw new Error("Failed to fetch sample book");
      const books = await response.json();
      return books[0];
    },
  });

  return (
    <div className="container max-w-7xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Book Image Guide</h1>
          <p className="text-muted-foreground mt-2">
            A guide to the different types of book images used in the platform
          </p>
        </div>

        <Separator />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        ) : book ? (
          <div className="space-y-12">
            {/* Hero section */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Hero Image (1500×600)</CardTitle>
                  <CardDescription>
                    The hero image is used for featured sections and promotional banners. It's a wide, landscape
                    format image that appears at the top of book detail pages and in featured sections.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full aspect-[5/2] bg-muted rounded-md overflow-hidden">
                    {book.images?.find(img => img.imageType === "hero")?.imageUrl ? (
                      <img
                        src={book.images.find(img => img.imageType === "hero")?.imageUrl}
                        alt="Hero image example"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No hero image available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Book cover images section */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Book Cover Images</h2>
              <p className="text-muted-foreground mb-6">
                These images are variations of the book cover used in different contexts
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Book Cover (480×600)</CardTitle>
                    <CardDescription>
                      Used on the book details page. This is the primary image for your book.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full aspect-[4/5] bg-muted rounded-md overflow-hidden max-w-[240px] mx-auto">
                      {book.images?.find(img => img.imageType === "book-detail")?.imageUrl ? (
                        <img
                          src={book.images.find(img => img.imageType === "book-detail")?.imageUrl}
                          alt="Book Cover example"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No book cover available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Book Card (256×440)</CardTitle>
                    <CardDescription>
                      Used in carousels and recommendation sections. This is automatically generated from your Book Cover.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-[58/100] bg-muted rounded-md overflow-hidden max-w-[128px] mx-auto">
                      {book.images?.find(img => img.imageType === "book-card")?.imageUrl ? (
                        <img
                          src={book.images.find(img => img.imageType === "book-card")?.imageUrl}
                          alt="Book Card example"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No book card available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mini Image (48×64)</CardTitle>
                    <CardDescription>
                      Used in management interfaces and small thumbnails. This is automatically generated from your Book Cover.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="relative aspect-[3/4] bg-muted rounded-md overflow-hidden w-12 h-16">
                      {book.images?.find(img => img.imageType === "mini")?.imageUrl ? (
                        <img
                          src={book.images.find(img => img.imageType === "mini")?.imageUrl}
                          alt="Mini image example"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground text-[8px]">No mini image</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Spine and Background section */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Additional Book Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spine (56×212)</CardTitle>
                    <CardDescription>
                      Used in grid layouts for compact recommendations. It's more narrow and resembles a book spine on a shelf.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mx-auto w-14 h-[212px] bg-muted rounded-md overflow-hidden">
                      {book.images?.find(img => img.imageType === "grid-item")?.imageUrl ? (
                        <img
                          src={book.images.find(img => img.imageType === "grid-item")?.imageUrl}
                          alt="Spine example"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground text-xs rotate-90">No spine image</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Background (1300×1500)</CardTitle>
                    <CardDescription>
                      Used as a blurred background on book detail pages to create an immersive experience.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full aspect-[13/15] bg-muted rounded-md overflow-hidden max-w-[260px] mx-auto">
                      {book.images?.find(img => img.imageType === "background")?.imageUrl ? (
                        <img
                          src={book.images.find(img => img.imageType === "background")?.imageUrl}
                          alt="Background example"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No background available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <div className="flex justify-center mt-8">
              <Link href="/upload">
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
                  Back to Book Upload
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p>Failed to load example book. Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
}