import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface WishlistButtonProps {
  bookId: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function WishlistButton({
  bookId,

  size = "default",
  className,
}: WishlistButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: readingStatus } = useQuery({
    queryKey: [`/api/books/${bookId}/reading-status`],
    enabled: !!user,
  });

  const { mutate: toggleWishlist, isPending } = useMutation({
    mutationFn: async () => {
      const method = readingStatus?.isWishlisted ? "DELETE" : "POST";
      return apiRequest(method, `/api/books/${bookId}/wishlist`, { bookId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/books/${bookId}/reading-status`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  if (!user) return null;

  return (
    <Button
      
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        toggleWishlist();
      }}
      disabled={isPending}
      className={className}
      data-wishlisted={readingStatus?.isWishlisted}
      
    >
      {readingStatus?.isWishlisted ? (
        size === "icon" ? (
          <Heart className="" fill="#f00" stroke="#f00" />
        ) : (
          <>
            <Heart className="mr-2" fill="#f00" />
          </>
        )
      ) : size === "icon" ? (
        <Heart className="h-4 w-4" />
      ) : (
        <>
          <Heart className="h-4 w-4 mr-2" />
        </>
      )}
    </Button>
  );
}
