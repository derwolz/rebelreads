import React from 'react';
import { TrackedBannerAdComponent } from './tracking/tracked-book-components';
import { HeroBannerAd, VerticalBannerAd, HorizontalBannerAd } from './banner-ads';

// Common prop interface for all banner ad types
interface TrackedBannerAdProps {
  campaignId: number;
  bookId: number;
  imageSrc: string;
  title: string;
  description: string;
  source: string;
  position: string;
  ctaText?: string;
  ctaUrl?: string;
  className?: string;
}

// Hero banner ad with tracking
export function TrackedHeroBannerAd({
  campaignId,
  bookId,
  imageSrc,
  title,
  description,
  source,
  position,
  ctaText,
  ctaUrl,
  className
}: TrackedBannerAdProps) {
  return (
    <TrackedBannerAdComponent
      bookId={bookId}
      campaignId={campaignId}
      adType="hero"
      containerType="page"
      metadata={{ source, position }}
      className={className}
    >
      <HeroBannerAd
        campaignId={campaignId}
        bookId={bookId}
        imageSrc={imageSrc}
        title={title}
        description={description}
        source={source}
        position={position}
        ctaText={ctaText}
        ctaUrl={ctaUrl}
      />
    </TrackedBannerAdComponent>
  );
}

// Vertical banner ad with tracking
export function TrackedVerticalBannerAd({
  campaignId,
  bookId,
  imageSrc,
  title,
  description,
  source,
  position,
  ctaText,
  ctaUrl,
  className
}: TrackedBannerAdProps) {
  return (
    <TrackedBannerAdComponent
      bookId={bookId}
      campaignId={campaignId}
      adType="vertical"
      containerType="sidebar"
      metadata={{ source, position }}
      className={className}
    >
      <VerticalBannerAd
        campaignId={campaignId}
        bookId={bookId}
        imageSrc={imageSrc}
        title={title}
        description={description}
        source={source}
        position={position}
        ctaText={ctaText}
        ctaUrl={ctaUrl}
      />
    </TrackedBannerAdComponent>
  );
}

// Horizontal banner ad with tracking
export function TrackedHorizontalBannerAd({
  campaignId,
  bookId,
  imageSrc,
  title,
  description,
  source,
  position,
  ctaText,
  ctaUrl,
  className
}: TrackedBannerAdProps) {
  return (
    <TrackedBannerAdComponent
      bookId={bookId}
      campaignId={campaignId}
      adType="horizontal"
      containerType="content"
      metadata={{ source, position }}
      className={className}
    >
      <HorizontalBannerAd
        campaignId={campaignId}
        bookId={bookId}
        imageSrc={imageSrc}
        title={title}
        description={description}
        source={source}
        position={position}
        ctaText={ctaText}
        ctaUrl={ctaUrl}
      />
    </TrackedBannerAdComponent>
  );
}