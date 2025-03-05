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
}

export function WishlistButton({ bookId, variant = "outline", size = "default" }: WishlistButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isWishlisted } = useQuery<boolean>({
    queryKey: [`/api/books/${bookId}/wishlist`],
    enabled: !!user,
  });

  const { mutate: toggleWishlist, isPending } = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/books/${bookId}/wishlist`, {
        method: isWishlisted ? "DELETE" : "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/wishlist`] });
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
    >
      {isWishlisted ? (
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
