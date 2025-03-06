import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Heart, HeartOff } from "lucide-react";

interface FollowButtonProps {
  authorId: number;
  authorName?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function FollowButton({ 
  authorId, 
  authorName = "", 
  className = "",
  size = "default",
  variant = "default"
}: FollowButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: followStatus } = useQuery({
    queryKey: [`/api/authors/${authorId}/following`],
    enabled: !!user && authorId !== user.id,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/authors/${authorId}/follow`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to follow author");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${authorId}/following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${authorId}`] });
      toast.success(`Author ${authorName} followed successfully`);
    },
    onError: () => {
      toast.error("Failed to follow author");
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/authors/${authorId}/unfollow`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to unfollow author");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${authorId}/following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${authorId}`] });
      toast.success(`Author ${authorName} unfollowed successfully`);
    },
    onError: () => {
      toast.error("Failed to unfollow author");
    },
  });

  if (!user || authorId === user.id) return null;

  return (
    <Button
      variant={followStatus?.isFollowing ? "outline" : variant}
      size={size}
      onClick={() => {
        if (followStatus?.isFollowing) {
          unfollowMutation.mutate();
        } else {
          followMutation.mutate();
        }
      }}
      disabled={followMutation.isPending || unfollowMutation.isPending}
      className={className}
    >
      {followStatus?.isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}