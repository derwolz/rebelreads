import React from 'react';
import { TrackedComponent } from './tracked-component';
import { Book } from '../../types';
import { BannerAdType } from '../banner-ad';

// Book Card Component
export interface TrackedBookCardComponentProps {
  book: Book;
  containerType: string;
  containerId?: string;
  position?: number;
  className?: string;
  children: React.ReactNode;
}

export function TrackedBookCardComponent({
  book,
  containerType,
  containerId,
  position,
  className,
  children
}: TrackedBookCardComponentProps) {
  return (
    <TrackedComponent
      itemId={book.id}
      componentType="book-card"
      containerType={containerType}
      containerId={containerId}
      position={position}
      className={className}
    >
      {children}
    </TrackedComponent>
  );
}

// Book Grid Component
export interface TrackedGridItemComponentProps {
  book: Book;
  containerType: string;
  containerId?: string;
  position?: number;
  className?: string;
  children: React.ReactNode;
}

export function TrackedGridItemComponent({
  book,
  containerType,
  containerId,
  position,
  className,
  children
}: TrackedGridItemComponentProps) {
  return (
    <TrackedComponent
      itemId={book.id}
      componentType="grid-item"
      containerType={containerType}
      containerId={containerId}
      position={position}
      className={className}
    >
      {children}
    </TrackedComponent>
  );
}

// Book Spine Component
export interface TrackedSpineComponentProps {
  book: Book;
  containerType: string;
  containerId?: string;
  position?: number;
  className?: string;
  children: React.ReactNode;
}

export function TrackedSpineComponent({
  book,
  containerType,
  containerId,
  position,
  className,
  children
}: TrackedSpineComponentProps) {
  return (
    <TrackedComponent
      itemId={book.id}
      componentType="spine-book"
      containerType={containerType}
      containerId={containerId}
      position={position}
      className={className}
    >
      {children}
    </TrackedComponent>
  );
}

// Mini Card Component
export interface TrackedMiniCardComponentProps {
  book: Book;
  containerType: string;
  containerId?: string;
  position?: number;
  className?: string;
  children: React.ReactNode;
}

export function TrackedMiniCardComponent({
  book,
  containerType,
  containerId,
  position,
  className,
  children
}: TrackedMiniCardComponentProps) {
  return (
    <TrackedComponent
      itemId={book.id}
      componentType="mini-card"
      containerType={containerType}
      containerId={containerId}
      position={position}
      className={className}
    >
      {children}
    </TrackedComponent>
  );
}

// Banner Ad Component
export interface TrackedBannerAdComponentProps {
  bookId: number;
  campaignId: number;
  adType: BannerAdType;
  containerType: string;
  containerId?: string;
  position?: number;
  className?: string;
  children: React.ReactNode;
  metadata?: Record<string, any>;
}

export function TrackedBannerAdComponent({
  bookId,
  campaignId,
  adType,
  containerType,
  containerId,
  position,
  className,
  children,
  metadata = {}
}: TrackedBannerAdComponentProps) {
  // Add campaign ID and ad type to metadata
  const enhancedMetadata = {
    ...metadata,
    campaignId,
    adType
  };
  
  return (
    <TrackedComponent
      itemId={bookId}
      componentType={`${adType}-ad`} // "hero-ad", "vertical-ad", or "horizontal-ad"
      containerType={containerType}
      containerId={containerId}
      position={position}
      metadata={enhancedMetadata}
      className={className}
    >
      {children}
    </TrackedComponent>
  );
}