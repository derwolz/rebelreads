# Enhanced Book Tracking System

This tracking system provides comprehensive analytics for user interactions with book components throughout the application. It captures detailed container metadata to better understand user engagement patterns.

## Tracking Types

The system tracks four types of interactions:

1. **Impressions** - When a book card is visible on screen (baseline tracking)
2. **Hovers** - When a user hovers on a book card for 0.3+ seconds (detail-expand)
3. **Click-throughs** - When a book card is clicked (leading to details page)
4. **Referrals** - When a referral link is clicked (leading to external site)

## Container Metadata

Each interaction captures the following metadata:

- **Container Type** - The type of container: 'carousel', 'book-rack', 'grid', 'book-shelf', 'wishlist'
- **Container ID** - An optional identifier for the specific container instance
- **Position** - The position/index of the item within the container
- **Page Route** - The current page path where the interaction occurred

## Referral Domain Tracking

For referral links, the system also captures the destination domain:

- **Referral Domain** - The hostname of the external site (e.g., 'amazon.com', 'bookshop.org')

This enables analysis of which referral partners perform best and how user behavior varies by external site.

## Tracked Components

We provide pre-built tracked versions of common book components:

- `TrackedBookCard` - Enhanced tracking for standard book cards
- `TrackedBookGridCard` - Enhanced tracking for grid-style book items

## Usage

### Using Tracked Components

These components handle all tracking automatically:

```jsx
import { 
  TrackedBookCard, 
  TrackedReferralLink 
} from '../components/tracking-components';

function BookCarousel({ books, carouselId }) {
  return (
    <div className="carousel">
      {books.map((book, index) => (
        <div key={book.id}>
          <TrackedBookCard
            book={book}
            containerType="carousel"
            containerId={carouselId}
            position={index}
          />
          
          {/* For buy links with domain tracking */}
          <TrackedReferralLink
            bookId={book.id}
            url={book.purchaseUrl}
            containerType="carousel"
            containerId={carouselId}
            position={index}
            className="buy-button"
          >
            Buy Now
          </TrackedReferralLink>
        </div>
      ))}
    </div>
  );
}
```

### Using the useTracking Hook

For custom components, use the `useTracking` hook:

```jsx
import { useTracking } from '../components/tracking-components';

function CustomBookComponent({ book, containerType, containerId, position }) {
  const { 
    trackImpression, 
    trackHover, 
    trackCardClick,
    trackReferralWithDomain 
  } = useTracking(containerType, containerId);

  // Track impression when component mounts
  useEffect(() => {
    trackImpression(book.id, 'custom-component', position);
  }, []);

  // Track referral click with domain capture
  const handleReferralClick = (e) => {
    // This will automatically extract the domain from the URL
    trackReferralWithDomain(book.id, 'custom-component', book.referralLink, position);
  };

  return (
    <div>
      {/* Component content */}
      <a onClick={handleReferralClick} href={book.referralLink}>
        Buy Now
      </a>
    </div>
  );
}
```

## Weight System

Different interaction types have assigned weights that affect their significance in recommendation algorithms:

- Hover/detail-expand: 0.25
- Card click: 0.5
- Referral link click: 1.0
- Regular view impressions: 0.0 (baseline)

These weights are used in the analytics dashboard and recommendation engine to prioritize more meaningful engagements.