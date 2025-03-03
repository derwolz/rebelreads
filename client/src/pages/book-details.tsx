import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Book, Rating, calculateWeightedRating } from "@shared/schema";
import { MainNav } from "@/components/main-nav";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { RatingDialog } from "@/components/rating-dialog";
import { format } from "date-fns";

export default function BookDetails() {
  const [, params] = useRoute("/books/:id");
  const { user } = useAuth();

  const { data: book } = useQuery<Book>({
    queryKey: [`/api/books/${params?.id}`],
  });

  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/books/${params?.id}/ratings`],
  });

  const averageRatings = ratings?.length ? {
    overall: ratings.reduce((acc, r) => acc + calculateWeightedRating(r), 0) / ratings.length,
    enjoyment: ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length,
    writing: ratings.reduce((acc, r) => acc + r.writing, 0) / ratings.length,
    themes: ratings.reduce((acc, r) => acc + r.themes, 0) / ratings.length,
    characters: ratings.reduce((acc, r) => acc + r.characters, 0) / ratings.length,
    worldbuilding: ratings.reduce((acc, r) => acc + r.worldbuilding, 0) / ratings.length,
  } : null;

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

          <div className="md:col-span-2 space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {book.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="text-lg">{book.description}</p>

            <div className="grid gap-8">
              {/* More Details Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">More Details</h2>
                <div className="grid gap-4">
                  {book.originalTitle && (
                    <div>
                      <span className="font-medium">Original Title:</span> {book.originalTitle}
                    </div>
                  )}
                  {book.series && (
                    <div>
                      <span className="font-medium">Series:</span> {book.series}
                    </div>
                  )}
                  {book.setting && (
                    <div>
                      <span className="font-medium">Setting:</span> {book.setting}
                    </div>
                  )}
                  {book.characters && book.characters.length > 0 && (
                    <div>
                      <span className="font-medium">Characters:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {book.characters.map((character, index) => (
                          <Badge key={index} variant="outline">
                            {character}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {book.awards && book.awards.length > 0 && (
                    <div>
                      <span className="font-medium">Awards:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {book.awards.map((award, index) => (
                          <Badge key={index} variant="outline">
                            {award}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Edition Details Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Edition Details</h2>
                <div className="grid gap-4">
                  <div>
                    <span className="font-medium">Format:</span>{" "}
                    {book.format.charAt(0).toUpperCase() + book.format.slice(1)}
                  </div>
                  {book.pageCount && (
                    <div>
                      <span className="font-medium">Pages:</span> {book.pageCount}
                    </div>
                  )}
                  {book.publishedDate && (
                    <div>
                      <span className="font-medium">Published:</span>{" "}
                      {format(new Date(book.publishedDate), "MMMM d, yyyy")}
                    </div>
                  )}
                  {book.isbn && (
                    <div>
                      <span className="font-medium">ISBN:</span> {book.isbn}
                    </div>
                  )}
                  {book.asin && (
                    <div>
                      <span className="font-medium">ASIN:</span> {book.asin}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Language:</span> {book.language}
                  </div>
                </div>
              </div>

              {/* Ratings Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Ratings & Reviews</h2>
                {averageRatings ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <StarRating rating={Math.round(averageRatings.overall)} readOnly />
                      <span className="text-sm text-muted-foreground">
                        ({ratings?.length} {ratings?.length === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Enjoyment (30%)</span>
                        <StarRating rating={Math.round(averageRatings.enjoyment)} readOnly size="sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Writing Style (30%)</span>
                        <StarRating rating={Math.round(averageRatings.writing)} readOnly size="sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Themes (20%)</span>
                        <StarRating rating={Math.round(averageRatings.themes)} readOnly size="sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Characters (10%)</span>
                        <StarRating rating={Math.round(averageRatings.characters)} readOnly size="sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">World Building (10%)</span>
                        <StarRating rating={Math.round(averageRatings.worldbuilding)} readOnly size="sm" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No ratings yet</p>
                )}

                {user && (
                  <div className="mt-4">
                    <RatingDialog
                      bookId={book.id}
                      trigger={<Button>Rate this book</Button>}
                    />
                  </div>
                )}

                <div className="space-y-4 mt-8">
                  <h3 className="text-xl font-semibold">Reviews</h3>
                  {ratings?.map((rating) => (
                    <div key={rating.id} className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <StarRating rating={Math.round(calculateWeightedRating(rating))} readOnly size="sm" />
                        <span className="text-sm text-muted-foreground">Overall Rating</span>
                      </div>
                      {rating.review && <p className="text-sm mt-2">{rating.review}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}