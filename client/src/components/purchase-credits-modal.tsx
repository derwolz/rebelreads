import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const CREDIT_PACKAGES = [
  { amount: "50", price: 50, label: "Starter" },
  { amount: "100", price: 95, label: "Popular", featured: true },
  { amount: "200", price: 180, label: "Professional" },
  { amount: "500", price: 425, label: "Enterprise" },
];

export function PurchaseCreditsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (amount: string, price: number) => {
    try {
      setLoading(amount);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call API to add credits (simulated payment for now)
      await apiRequest("POST", "/api/credits/add", {
        amount,
        description: `Purchased ${amount} credits`,
      });

      // Invalidate credits query to refresh the balance
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });

      toast({
        title: "Purchase Successful",
        description: `Added ${amount} credits to your account`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Choose a credit package to power your marketing campaigns
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {CREDIT_PACKAGES.map(({ amount, price, label, featured }) => (
            <Card
              key={amount}
              className={`relative ${
                featured
                  ? "border-primary shadow-lg"
                  : "border-border"
              }`}
            >
              {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                  Best Value
                </div>
              )}
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <h3 className="font-semibold">{label}</h3>
                  <div className="text-3xl font-bold">${amount}</div>
                  <div className="text-sm text-muted-foreground">
                    ${price.toFixed(2)}
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant={featured ? "default" : "outline"}
                  disabled={loading !== null}
                  onClick={() => handlePurchase(amount, price)}
                >
                  {loading === amount ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Purchase"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
