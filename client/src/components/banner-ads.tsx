import React from "react";
import { BannerAd, BannerAdType } from "./banner-ad";

// Common interface for all ad types
interface CommonAdProps {
  campaignId: number;
  bookId: number;
  imageSrc?: string;
  title: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  className?: string;
  source?: string;
}

// Hero Banner Ad (Full width, prominent placement)
interface HeroBannerAdProps extends CommonAdProps {
  position?: string;
}

export function HeroBannerAd({
  position = "hero-section",
  ...props
}: HeroBannerAdProps) {
  return (
    <BannerAd
      type="hero"
      position={position}
      {...props}
    />
  );
}

// Vertical Banner Ad (Sidebar style)
interface VerticalBannerAdProps extends CommonAdProps {
  position?: string;
}

export function VerticalBannerAd({
  position = "sidebar",
  ...props
}: VerticalBannerAdProps) {
  return (
    <BannerAd
      type="vertical"
      position={position}
      {...props}
    />
  );
}

// Horizontal Banner Ad (In-content placement)
interface HorizontalBannerAdProps extends CommonAdProps {
  position?: string;
}

export function HorizontalBannerAd({
  position = "in-content",
  ...props
}: HorizontalBannerAdProps) {
  return (
    <BannerAd
      type="horizontal"
      position={position}
      {...props}
    />
  );
}

// Example Ad Showcase (for demonstration purposes)
export function AdShowcase() {
  // Sample ad data
  const adData = {
    campaignId: 1,
    bookId: 1,
    imageSrc: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000",
    title: "Discover New Worlds",
    description: "Expand your horizons with our latest collection of bestselling fantasy titles.",
    ctaText: "Explore Now",
    ctaUrl: "/books/1",
    source: "showcase",
  };

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-xl font-bold mb-2">Hero Banner Ad</h2>
        <HeroBannerAd {...adData} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-2">Vertical Banner Ad</h2>
          <div className="flex justify-center">
            <VerticalBannerAd {...adData} />
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-2">Horizontal Banner Ad</h2>
          <HorizontalBannerAd {...adData} />
        </div>
      </div>
    </div>
  );
}