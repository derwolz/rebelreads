# Tracking Component System

This directory contains a unified tracking system for monitoring user interactions with various book-related UI components. The system tracks:

- **Impressions**: When a component becomes visible in the viewport
- **Hover events**: When a user hovers over a component
- **Click events**: When a user clicks on a component
- **Referral clicks**: When a user clicks on a purchase/referral link

## Core Components

### `TrackedComponent`

The base component that handles all tracking functionality. It wraps any UI component and adds tracking capabilities.

```tsx
<TrackedComponent
  itemId={book.id}
  componentType="book-card"
  containerType="carousel"
  containerId="featured-books"
  position={2}
  trackHover={true}
  trackClick={true}
  trackImpression={true}
>
  {/* Your component here */}
</TrackedComponent>
```

### Specialized Tracking Components

We provide pre-built tracked wrappers for common book components:

- `TrackedBookCardComponent`: For standard book cards
- `TrackedGridItemComponent`: For grid-style book items
- `TrackedSpineComponent`: For book spines in rack/shelf displays
- `TrackedMiniCardComponent`: For mini book cards (used in sidebars, top lists)
- `TrackedBannerAdComponent`: For ad banners (hero, vertical, horizontal)

## Usage Examples

### Example 1: Tracking a Book Card in a Carousel

```tsx
import { TrackedBookCardComponent } from './tracking/tracked-book-components';
import { BookCard } from './book-card';

function BookCarousel({ books, carouselId }) {
  return (
    <div className="carousel">
      {books.map((book, index) => (
        <TrackedBookCardComponent
          key={book.id}
          book={book}
          containerType="carousel"
          containerId={carouselId}
          position={index}
        >
          <BookCard book={book} />
        </TrackedBookCardComponent>
      ))}
    </div>
  );
}
```

### Example 2: Tracking a Banner Ad

```tsx
import { TrackedBannerAdComponent } from './tracking/tracked-book-components';
import { HeroBannerAd } from './banner-ads';

function HomePage() {
  return (
    <TrackedBannerAdComponent
      bookId={123}
      campaignId={456}
      adType="hero"
      containerType="page"
      metadata={{ source: 'home', position: 'top' }}
    >
      <HeroBannerAd
        campaignId={456}
        bookId={123}
        imageSrc="/path/to/image.jpg"
        title="Featured Book"
        description="Check out this amazing book!"
        source="home"
        position="top"
      />
    </TrackedBannerAdComponent>
  );
}
```

### Example 3: Tracking Without Using Pre-built Components

You can also use the base `TrackedComponent` directly for custom UI elements:

```tsx
import { TrackedComponent } from './tracking/tracked-component';

function CustomElement({ book }) {
  return (
    <TrackedComponent
      itemId={book.id}
      componentType="custom-element"
      containerType="profile-page"
      className="custom-class"
    >
      {/* Your custom UI */}
      <div>
        <h3>{book.title}</h3>
        <p>{book.description}</p>
      </div>
    </TrackedComponent>
  );
}
```

## Pre-Built Examples

See the `examples.tsx` file for ready-to-use implementations of tracked components, including:

- `TrackedBookCard`
- `TrackedGridItem`
- `TrackedMiniBook`
- `TrackedHeroBannerAd`
- `TrackedVerticalBannerAd`
- `TrackedHorizontalBannerAd`

These can be imported and used directly in your components.

## Data Flow

1. The tracking component detects user interactions (view, hover, click)
2. The interaction is passed to the appropriate tracking function
3. The data is stored temporarily in localStorage
4. Data is periodically synced with the server via API calls
5. The server stores the data in the database for analytics

## Integration with Analytics

The tracked data can be used for:
- Book popularity calculation
- User recommendation engine
- Author dashboards
- Publisher analytics
- A/B testing different UI components