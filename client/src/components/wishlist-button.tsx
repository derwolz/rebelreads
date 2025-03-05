import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface WishlistButtonProps {
  bookId: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function WishlistButton({ bookId, variant = "outline", size = "default", className }: WishlistButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: readingStatus } = useQuery({
    queryKey: [`/api/books/${bookId}/reading-status`],
    enabled: !!user,
  });

  const { mutate: toggleWishlist, isPending } = useMutation({
    mutationFn: async () => {
      const method = readingStatus?.isWishlisted ? 'DELETE' : 'POST';
      return apiRequest(`/api/books/${bookId}/wishlist`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/reading-status`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  if (!user) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => toggleWishlist()}
      disabled={isPending}
      className={className}
    >
      {readingStatus?.isWishlisted ? (
        <>
          <HeartOff className="h-4 w-4 mr-2" />
          Remove from Wishlist
        </>
      ) : (
        <>
          <Heart className="h-4 w-4 mr-2" />
          Add to Wishlist
        </>
      )}
    </Button>
  );
}