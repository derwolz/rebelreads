import { useState } from "react";
import { Rating, calculateWeightedRating, User } from "@shared/schema";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Reply {
  id: number;
  reviewId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author: {
    username: string;
    profileImageUrl: string | null;
  };
}

interface ReviewCardProps {
  review: Rating & {
    user?: {
      username: string;
      displayName?: string;
      profileImageUrl?: string;
    };
    book?: {
      id: number;
      title: string;
      coverImageUrl?: string;
    };
    replies?: Reply[];
  };
}

const REVIEW_PREVIEW_LENGTH = 200;

export function ReviewCard({ review }: ReviewCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasLongReview = review.review && review.review.length > REVIEW_PREVIEW_LENGTH;
  const hasReplies = review.replies && review.replies.length > 0;

  const userDisplayName = review.user?.displayName || review.user?.username || "Anonymous";
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <div className="p-4 bg-muted rounded-lg space-y-2 cursor-pointer w-full" onClick={() => setIsOpen(!isOpen)}>
      <div className="flex gap-4">
        {/* Book Cover - Full Height Column */}
        {review.book && (
          <div className="flex-shrink-0 w-16">
            <div className="w-16 h-24 rounded overflow-hidden shadow-sm">
              {review.book.coverImageUrl ? (
                <img
                  src={review.book.coverImageUrl}
                  alt={`Cover of ${review.book.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted-foreground/10 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No cover</span>
                </div>
              )}
            </div>
            <p className="text-xs mt-1 w-16 truncate text-center" title={review.book.title}>
              {review.book.title}
            </p>
          </div>
        )}
        
        {/* Main Content Column */}
        <div className="flex-1">
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={review.user?.profileImageUrl} alt={userDisplayName} />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{userDisplayName}</p>
                  {review.featured && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                      Author Featured
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <StarRating rating={Math.round(calculateWeightedRating(review))} readOnly size="sm" />
                  <span>•</span>
                  <span>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          {review.review && (
            <div className="text-sm mt-3">
              <p className={`break-words ${!isOpen && hasLongReview ? "line-clamp-3" : undefined}`}>
                {review.review}
              </p>
              {hasLongReview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                  }}
                  className="mt-2"
                >
                  {isOpen ? "Show Less" : "Read More"}
                </Button>
              )}
            </div>
          )}

          {/* Author Replies Section */}
          {hasReplies && (
            <div className="mt-4 border-t pt-2">
              <p className="text-sm font-medium mb-2">Author Replies:</p>
              <ScrollArea className="max-h-48">
                {review.replies?.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-2 mb-2 pl-3 border-l-2 border-primary/20">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={reply.author.profileImageUrl || undefined} />
                      <AvatarFallback>{reply.author.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-medium">{reply.author.username}</p>
                        <Badge variant="outline" className="text-xs ml-1 py-0 px-1 h-4">Author</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          <div className={`grid gap-2 text-sm border-t pt-2 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex justify-between items-center">
              <span>Enjoyment (30%)</span>
              <StarRating rating={review.enjoyment} readOnly size="sm" />
            </div>
            <div className="flex justify-between items-center">
              <span>Writing Style (20%)</span>
              <StarRating rating={review.writing} readOnly size="sm" />
            </div>
            <div className="flex justify-between items-center">
              <span>Themes (20%)</span>
              <StarRating rating={review.themes} readOnly size="sm" />
            </div>
            <div className="flex justify-between items-center">
              <span>Characters (10%)</span>
              <StarRating rating={review.characters} readOnly size="sm" />
            </div>
            <div className="flex justify-between items-center">
              <span>World Building (10%)</span>
              <StarRating rating={review.worldbuilding} readOnly size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}