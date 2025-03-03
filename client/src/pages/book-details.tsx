import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Book, Rating } from "@shared/schema";
import { MainNav } from "@/components/main-nav";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BookDetails() {
  const [, params] = useRoute("/books/:id");
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const { data: book } = useQuery<Book>({
    queryKey: [`/api/books/${params?.id}`],
  });

  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${params?.id}/ratings`],
  });

  const ratingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/books/${params?.id}/ratings`, {
        rating,
        review,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/books/${params?.id}/ratings`] });
      setRating(0);
      setReview("");
    },
  });

  const bookshelfMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("POST", `/api/bookshelf/${params?.id}`, { status });
      return res.json();
    },
  });

  if (!book) return null;

  return (
    <div>
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full rounded-lg shadow-lg"
            />
          </div>
          
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
              <p className="text-xl text-muted-foreground">by {book.author}</p>
            </div>

            <p className="text-lg">{book.description}</p>

            {user && (
              <div className="space-y-4">
                <Select
                  onValueChange={(value) => bookshelfMutation.mutate(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add to shelf" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reading">Currently Reading</SelectItem>
                    <SelectItem value="want-to-read">Want to Read</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Rate this book</h3>
                  <StarRating rating={rating} onChange={setRating} />
                </div>

                <div>
                  <Textarea
                    placeholder="Write a review..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="mb-2"
                  />
                  <Button
                    onClick={() => ratingMutation.mutate()}
                    disabled={!rating}
                  >
                    Submit Review
                  </Button>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4">Reviews</h3>
              {ratings?.map((rating) => (
                <div key={rating.id} className="mb-4 p-4 bg-muted rounded-lg">
                  <StarRating rating={rating.rating} readOnly />
                  <p className="mt-2">{rating.review}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
