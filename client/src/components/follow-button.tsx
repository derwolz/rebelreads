import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  authorId: number;
  authorName: string;
  className?: string;
}

interface FollowStatus {
  isFollowing?: boolean;
  following?: boolean;
}

export function FollowButton({ authorId, authorName, className }: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: followStatus } = useQuery<FollowStatus>({
    queryKey: [`/api/authors/${authorId}/following`],
    enabled: !!user && authorId !== user.id,
  });

  // Determine if the user is following the author, handling both response formats
  // The API can return either {isFollowing: boolean} or {following: boolean}
  const isFollowing = followStatus?.isFollowing || followStatus?.following || false;

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/authors/${authorId}/${isFollowing ? 'unfollow' : 'follow'}`
      );
      if (!res.ok) throw new Error("Failed to update follow status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${authorId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${authorId}/following`] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: `You are ${isFollowing ? 'no longer' : 'now'} following ${authorName}`,
      });
    },
  });

  if (!user || authorId === user.id) return null;

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={() => followMutation.mutate()}
      className={className}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
