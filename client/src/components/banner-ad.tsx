import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export type BannerAdType = "hero" | "vertical" | "horizontal";

interface BannerAdProps {
  campaignId: number;
  bookId: number;
  type: BannerAdType;
  imageSrc?: string;
  title: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  className?: string;
  source?: string; // e.g., 'home', 'search', 'author-page'
  position?: string; // position on the page
}

export function BannerAd({
  campaignId,
  bookId,
  type,
  imageSrc,
  title,
  description,
  ctaText = "Learn More",
  ctaUrl = `/books/${bookId}`,
  className,
  source = "unknown",
  position = "unknown",
}: BannerAdProps) {
  const [impressionId, setImpressionId] = useState<number | null>(null);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);

  // Record impression mutation
  const recordImpression = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ads/impressions", {
        campaignId,
        bookId,
        adType: "ad",
        position,
        source,
      });
      return response.json();
    },
  });

  // Record click mutation
  const recordClick = useMutation({
    mutationFn: async (impressionId: number) => {
      const response = await apiRequest("POST", `/api/ads/clicks/${impressionId}`, {});
      return response.json();
    },
  });

  // Use Intersection Observer to detect when ad is visible
  useEffect(() => {
    if (hasBeenViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasBeenViewed(true);
            recordImpression.mutate(undefined, {
              onSuccess: (data) => {
                setImpressionId(data.id);
              },
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 } // Ad is considered viewed when 50% visible
    );

    const adElement = document.getElementById(`ad-${campaignId}-${bookId}-${type}`);
    if (adElement) {
      observer.observe(adElement);
    }

    return () => {
      observer.disconnect();
    };
  }, [campaignId, bookId, type, hasBeenViewed, recordImpression]);

  const handleClick = () => {
    if (impressionId) {
      recordClick.mutate(impressionId);
    }
  };

  const containerStyles = {
    hero: "w-full h-64 md:h-80",
    vertical: "w-48 h-96",
    horizontal: "w-full h-32 md:h-40",
  };

  return (
    <Card
      id={`ad-${campaignId}-${bookId}-${type}`}
      className={cn(containerStyles[type], "overflow-hidden relative", className)}
    >
      <CardContent className="p-0 h-full flex flex-col">
        <div
          className={cn(
            "relative h-full w-full flex",
            type === "vertical" ? "flex-col" : "flex-row",
          )}
        >
          {imageSrc && (
            <div 
              className={cn(
                "bg-cover bg-center",
                type === "hero" ? "w-full h-1/2" : 
                type === "vertical" ? "w-full h-1/2" : "w-1/3 h-full"
              )}
              style={{ backgroundImage: `url(${imageSrc})` }}
            />
          )}
          
          <div className={cn(
            "p-4 flex flex-col justify-between",
            type === "hero" ? "w-full h-1/2" : 
            type === "vertical" ? "w-full h-1/2" : "w-2/3 h-full"
          )}>
            <div>
              <h3 className="font-bold text-lg line-clamp-2">{title}</h3>
              {description && (
                <p className={cn(
                  "text-sm text-muted-foreground mt-1",
                  type === "horizontal" ? "line-clamp-2" : "line-clamp-3"
                )}>
                  {description}
                </p>
              )}
            </div>
            
            <Button
              size={type === "horizontal" ? "sm" : "default"}
              className="mt-2 self-start"
              onClick={handleClick}
              asChild
            >
              <a href={ctaUrl}>{ctaText}</a>
            </Button>
          </div>
        </div>
        
        <div className="absolute top-1 right-1 text-xs px-1 bg-primary/10 rounded text-primary">
          Ad
        </div>
      </CardContent>
    </Card>
  );
}