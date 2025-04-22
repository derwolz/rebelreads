import { useTracking } from '../hooks/use-tracking';

export interface TrackedReferralLinkProps {
  bookId: number;
  url: string;
  containerType: string;
  containerId?: string;
  position?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * A tracked external referral link that captures the destination domain
 * 
 * This component wraps any external link and ensures that:
 * 1. Click is tracked with proper container context
 * 2. Destination domain is captured and stored
 * 3. Standard tracking metadata is attached
 * 
 * @param bookId - ID of the book being referred
 * @param url - The external URL to link to
 * @param containerType - Type of container ('carousel', 'grid', etc)
 * @param containerId - Optional ID of the container instance
 * @param position - Optional position within container
 * @param className - Optional CSS class name for styling
 * @param children - Child elements (link content)
 */
export const TrackedReferralLink: React.FC<TrackedReferralLinkProps> = ({
  bookId,
  url,
  containerType,
  containerId,
  position,
  className,
  children
}) => {
  const { trackReferralWithDomain } = useTracking(containerType, containerId);
  
  const handleClick = (e: React.MouseEvent) => {
    // Track the referral click with domain extraction
    trackReferralWithDomain(bookId, 'referral-link', url, position);
    
    // For non-production environments, prevent navigation to make testing easier
    if (import.meta.env.DEV) {
      e.preventDefault();
      console.log(`[DEV] Referral tracked for ${url}`);
    }
  };
  
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

/**
 * A buy button component that tracks referrals with domain data
 */
export const TrackedBuyButton: React.FC<Omit<TrackedReferralLinkProps, 'children'>> = (props) => {
  return (
    <TrackedReferralLink {...props}>
      <button className="buy-button">Buy Now</button>
    </TrackedReferralLink>
  );
};