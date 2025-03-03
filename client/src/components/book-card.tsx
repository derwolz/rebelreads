import { Book } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import { Link } from "wouter";

export function BookCard({ book }: { book: Book }) {
  return (
    <Card className="overflow-hidden">
      <img 
        src={book.coverUrl} 
        alt={book.title}
        className="w-full h-64 object-cover"
      />
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{book.title}</h3>
        <p className="text-sm text-muted-foreground">{book.author}</p>
        <StarRating className="mt-2" />
      </CardContent>
      <CardFooter className="px-4 pb-4">
        <Link href={`/books/${book.id}`}>
          <Button variant="secondary" className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
