import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Book } from "../types";
import { BookRack } from "@/components/book-spine";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Simple book spine test page
export default function BookSpineTest() {
  // Fetch books for testing
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ['/api/genres/view/2'],
  });

  if (isLoading || !books) {
    return (
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Book Spine Test</h1>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Book Spine Test</h1>
      <p className="mb-6 text-muted-foreground">
        This page tests the BookRack component with different spine variants.
      </p>
      
      <Tabs defaultValue="a" className="mb-8">
        <TabsList>
          <TabsTrigger value="a">BookRack with Spine A</TabsTrigger>
          <TabsTrigger value="b">BookRack with Spine B</TabsTrigger>
        </TabsList>
        
        <TabsContent value="a" className="p-4">
          <h2 className="text-2xl font-bold mb-4">Variant A</h2>
          <p className="mb-4 text-muted-foreground">
            Using BookRack with Spine A variant (128px spacing)
          </p>
          
          <BookRack 
            title="Books You Might Like" 
            books={books} 
            variant="a"
          />
        </TabsContent>
        
        <TabsContent value="b" className="p-4">
          <h2 className="text-2xl font-bold mb-4">Variant B</h2>
          <p className="mb-4 text-muted-foreground">
            Using BookRack with Spine B variant (266px spacing)
          </p>
          
          <BookRack 
            title="Books You Might Like" 
            books={books} 
            variant="b"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}