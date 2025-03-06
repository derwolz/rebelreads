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

export function FollowButton({ authorId, authorName, className }: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: followStatus } = useQuery({
    queryKey: [`/api/authors/${authorId}/following`],
    enabled: !!user && authorId !== user.id,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/authors/${authorId}/${followStatus?.isFollowing ? 'unfollow' : 'follow'}`
      );
      if (!res.ok) throw new Error("Failed to update follow status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${authorId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${authorId}/following`] });
      toast({
        title: followStatus?.isFollowing ? "Unfollowed" : "Following",
        description: `You are ${followStatus?.isFollowing ? 'no longer' : 'now'} following ${authorName}`,
      });
    },
  });

  if (!user || authorId === user.id) return null;

  return (
    <Button
      variant={followStatus?.isFollowing ? "outline" : "default"}
      onClick={() => followMutation.mutate()}
      className={className}
    >
      {followStatus?.isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
