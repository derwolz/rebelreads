// Example integration for tracked components
import React from 'react';
import { BookCard } from '../book-card';
import { BookGridCard } from '../book-grid-card';
import { 
  TrackedBookCardComponent, 
  TrackedGridItemComponent,
  TrackedMiniCardComponent,
  TrackedSpineComponent,
  TrackedBannerAdComponent
} from './tracked-book-components';
import { HeroBannerAd, VerticalBannerAd, HorizontalBannerAd } from '../banner-ads';

// Use a more general book type that just requires the properties we need
interface BookWithId {
  id: number;
  title: string;
  authorName?: string;
  description?: string;
  images?: Array<{imageType: string, imageUrl: string}>;
  [key: string]: any; // Allow any other properties
}

// Book card example
export function TrackedBookCard({ 
  book, 
  containerType, 
  containerId, 
  position,
  taxonomicScore,
  matchingTaxonomies
}: { 
  book: BookWithId, 
  containerType: string, 
  containerId?: string, 
  position?: number,
  taxonomicScore?: number,
  matchingTaxonomies?: number
}) {
  return (
    <TrackedBookCardComponent
      book={book}
      containerType={containerType}
      containerId={containerId}
      position={position}
    >
      <BookCard 
        book={book} 
        taxonomicScore={taxonomicScore}
        matchingTaxonomies={matchingTaxonomies}
      />
    </TrackedBookCardComponent>
  );
}

// Grid item example
export function TrackedGridItem({
  book,
  containerType,
  containerId,
  position
}: {
  book: BookWithId,
  containerType: string,
  containerId?: string,
  position?: number
}) {
  return (
    <TrackedGridItemComponent
      book={book}
      containerType={containerType}
      containerId={containerId}
      position={position}
    >
      <BookGridCard book={book} />
    </TrackedGridItemComponent>
  );
}

// Mini book card example (typically used in sidebars or top lists)
export function TrackedMiniBook({
  book,
  rank,
  containerType,
  containerId,
  position,
  onClick
}: {
  book: BookWithId,
  rank: number,
  containerType: string,
  containerId?: string,
  position?: number,
  onClick?: () => void
}) {
  return (
    <TrackedMiniCardComponent
      book={book}
      containerType={containerType}
      containerId={containerId}
      position={position}
      className="flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors group hover:bg-muted/30 border-b border-border/40 pb-3 last:border-0"
    >
      <div className="font-bold text-sm w-5 h-5 bg-muted-foreground/10 rounded-full flex items-center justify-center text-muted-foreground">
        {rank}
      </div>
      <img 
        src={book.images?.find(img => img.imageType === "mini")?.imageUrl || "/images/placeholder-book.png"} 
        alt={book.title} 
        className="w-11 h-16 object-cover rounded flex-shrink-0 group-hover:scale-105 transition-transform duration-300" 
      />
      <div className="overflow-hidden pt-0.5">
        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{book.title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{book.authorName}</p>
      </div>
    </TrackedMiniCardComponent>
  );
}

// Banner ad examples
export function TrackedHeroBannerAd({
  campaignId,
  bookId,
  imageSrc,
  title,
  description,
  source,
  position
}: {
  campaignId: number,
  bookId: number,
  imageSrc: string,
  title: string,
  description: string,
  source: string,
  position: string
}) {
  return (
    <TrackedBannerAdComponent
      bookId={bookId}
      campaignId={campaignId}
      adType="hero"
      containerType="page"
      metadata={{ source, position }}
    >
      <HeroBannerAd
        campaignId={campaignId}
        bookId={bookId}
        imageSrc={imageSrc}
        title={title}
        description={description}
        source={source}
        position={position}
      />
    </TrackedBannerAdComponent>
  );
}

export function TrackedVerticalBannerAd({
  campaignId,
  bookId,
  imageSrc,
  title,
  description,
  source,
  position
}: {
  campaignId: number,
  bookId: number,
  imageSrc: string,
  title: string,
  description: string,
  source: string,
  position: string
}) {
  return (
    <TrackedBannerAdComponent
      bookId={bookId}
      campaignId={campaignId}
      adType="vertical"
      containerType="sidebar"
      metadata={{ source, position }}
    >
      <VerticalBannerAd
        campaignId={campaignId}
        bookId={bookId}
        imageSrc={imageSrc}
        title={title}
        description={description}
        source={source}
        position={position}
      />
    </TrackedBannerAdComponent>
  );
}

export function TrackedHorizontalBannerAd({
  campaignId,
  bookId,
  imageSrc,
  title,
  description,
  source,
  position
}: {
  campaignId: number,
  bookId: number,
  imageSrc: string,
  title: string,
  description: string,
  source: string,
  position: string
}) {
  return (
    <TrackedBannerAdComponent
      bookId={bookId}
      campaignId={campaignId}
      adType="horizontal"
      containerType="content"
      metadata={{ source, position }}
    >
      <HorizontalBannerAd
        campaignId={campaignId}
        bookId={bookId}
        imageSrc={imageSrc}
        title={title}
        description={description}
        source={source}
        position={position}
      />
    </TrackedBannerAdComponent>
  );
}