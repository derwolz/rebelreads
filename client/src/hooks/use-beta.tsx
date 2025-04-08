import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type BetaContextType = {
  isBetaActive: boolean;
  isLoading: boolean;
  error: Error | null;
};

const BetaContext = createContext<BetaContextType | null>(null);

export function BetaProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data,
    error,
    isLoading,
  } = useQuery<{ isBetaActive: boolean }, Error>({
    queryKey: ["/api/beta/status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Show toast on error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error checking beta status",
        description: "There was a problem checking the beta status. Some features may be unavailable.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <BetaContext.Provider
      value={{
        isBetaActive: data?.isBetaActive ?? false,
        isLoading,
        error: error ?? null,
      }}
    >
      {children}
    </BetaContext.Provider>
  );
}

export function useBeta() {
  const context = useContext(BetaContext);
  if (!context) {
    throw new Error("useBeta must be used within a BetaProvider");
  }
  return context;
}