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
    name: string;
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
    // Additional fields that might be needed for author information
    authorName?: string;
    authorImageUrl?: string;
  };
}

const REVIEW_PREVIEW_LENGTH = 200;

export function ReviewCard({ review }: ReviewCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasLongReview = review.review && review.review.length > REVIEW_PREVIEW_LENGTH;
  const hasReplies = review.replies && review.replies.length > 0;

  // Use available user information in this priority order
  const userDisplayName = review.user?.displayName || review.user?.username || "Anonymous";
  const userInitial = userDisplayName.charAt(0).toUpperCase();
  
  // For consistent author display across components
  const authorName = review.authorName;
  const authorImageUrl = review.authorImageUrl;

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
                  {review.enjoyment !== 0 && (
                    <>
                      <span className={review.enjoyment === 1 ? "text-green-600" : "text-red-600"}>
                        {review.enjoyment === 1 ? "👍" : "👎"}
                      </span>
                      <span>•</span>
                    </>
                  )}
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
                {review.replies?.map((reply) => {
                  // Use the book author information from the review when available
                  // This ensures all author replies consistently use the author name and profile image
                  const replyAuthorName = authorName || reply.author.name;
                  const replyAuthorImageUrl = authorImageUrl || reply.author.profileImageUrl;
                  
                  return (
                    <div key={reply.id} className="flex items-start gap-2 mb-2 pl-3 border-l-2 border-primary/20">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={replyAuthorImageUrl || undefined} />
                        <AvatarFallback>{replyAuthorName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-medium">{replyAuthorName}</p>
                          <Badge variant="outline" className="text-xs ml-1 py-0 px-1 h-4">Author</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          )}

          <div className={`grid gap-2 text-sm border-t pt-2 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            {/* Only display metrics that have been rated */}
            {review.enjoyment !== 0 && (
              <div className="flex justify-between items-center">
                <span>Enjoyment</span>
                <span className={review.enjoyment === 1 ? "text-green-600" : "text-red-600"}>
                  {review.enjoyment === 1 ? "👍 Recommended" : "👎 Not Recommended"}
                </span>
              </div>
            )}
            {review.writing !== 0 && (
              <div className="flex justify-between items-center">
                <span>Writing Style</span>
                <span className={review.writing === 1 ? "text-green-600" : "text-red-600"}>
                  {review.writing === 1 ? "👍 Recommended" : "👎 Not Recommended"}
                </span>
              </div>
            )}
            {review.themes !== 0 && (
              <div className="flex justify-between items-center">
                <span>Themes</span>
                <span className={review.themes === 1 ? "text-green-600" : "text-red-600"}>
                  {review.themes === 1 ? "👍 Recommended" : "👎 Not Recommended"}
                </span>
              </div>
            )}
            {review.characters !== 0 && (
              <div className="flex justify-between items-center">
                <span>Characters</span>
                <span className={review.characters === 1 ? "text-green-600" : "text-red-600"}>
                  {review.characters === 1 ? "👍 Recommended" : "👎 Not Recommended"}
                </span>
              </div>
            )}
            {review.worldbuilding !== 0 && (
              <div className="flex justify-between items-center">
                <span>World Building</span>
                <span className={review.worldbuilding === 1 ? "text-green-600" : "text-red-600"}>
                  {review.worldbuilding === 1 ? "👍 Recommended" : "👎 Not Recommended"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}