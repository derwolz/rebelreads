import * as React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function ImageGuidePage() {
  // Using static example paths instead of dynamic fetching
  const examplePaths = {
    hero: "/uploads/covers/1744986075777-791144649.webp",
    bookDetail: "/uploads/covers/1744986075767-678392506.webp", 
    bookCard: "/uploads/covers/1744986075776-105852716.webp",
    mini: "/uploads/covers/1744986075777-521444502.webp",
    gridItem: "/uploads/covers/1744986075777-106552634.webp",
    background: "/uploads/covers/1744986075767-276536910.webp"
  };

  return (
    <div className="container max-w-7xl py-10">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Book Image Guide</h1>
          <p className="text-muted-foreground mt-2">
            A guide to the different types of book images used in the platform
          </p>
        </div>

        <Separator />

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
                  <img
                    src={examplePaths.hero}
                    alt="Hero image example"
                    className="object-cover w-full h-full"
                  />
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
                    <img
                      src={examplePaths.bookDetail}
                      alt="Book Cover example"
                      className="object-cover w-full h-full"
                    />
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
                    <img
                      src={examplePaths.bookCard}
                      alt="Book Card example"
                      className="object-cover w-full h-full"
                    />
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
                    <img
                      src={examplePaths.mini}
                      alt="Mini image example"
                      className="object-cover w-full h-full"
                    />
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
                    <img
                      src={examplePaths.gridItem}
                      alt="Spine example"
                      className="object-cover w-full h-full"
                    />
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
                    <img
                      src={examplePaths.background}
                      alt="Background example"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="flex justify-center mt-8">
            <Link href="/pro/book-management">
              <Button className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Book Management
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}