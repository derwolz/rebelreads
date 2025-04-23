import React from 'react';
import { apiRequest } from '@/lib/queryClient';
import { ExternalLink } from 'lucide-react';

interface ReferralLink {
  retailer: string;
  url: string;
  customName?: string;
  faviconUrl?: string;
}

interface ReferralButtonProps {
  bookId: number;
  link: ReferralLink;
  sourceContext: string; // Where the click is coming from (e.g., "book-details", "book-shelf/share")
  className?: string;
  iconOnly?: boolean;
}

/**
 * ReferralButton - A component for tracking referral link clicks with domain information
 * 
 * This component renders a button or link that tracks clicks with detailed source and destination
 * information for accurate analytics. It replaces the old approach of using click-through and impression
 * endpoints with a dedicated referral-click endpoint that stores domain-specific data.
 */
export const ReferralButton: React.FC<ReferralButtonProps> = ({
  bookId,
  link,
  sourceContext,
  className = '',
  iconOnly = false,
}) => {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Extract domain and subdomain information from the URL
    let targetDomain = 'unknown';
    let targetSubdomain: string | null = null;

    try {
      const url = new URL(link.url);
      const hostnameParts = url.hostname.split('.');
      
      // Handle cases like "subdomain.domain.com"
      if (hostnameParts.length >= 2) {
        // Get the domain (last two parts, e.g., "domain.com")
        targetDomain = hostnameParts.slice(-2).join('.');
        
        // If there are more than 2 parts, the remaining parts are subdomains
        if (hostnameParts.length > 2) {
          targetSubdomain = hostnameParts.slice(0, -2).join('.');
        }
      } else {
        // Simple domain with no subdomains
        targetDomain = url.hostname;
      }
    } catch (error) {
      console.error("Error parsing URL:", link.url, error);
    }

    try {
      // Record the referral click with detailed domain information
      await apiRequest("POST", `/api/books/${bookId}/referral-click`, {
        sourceContext,
        retailerName: link.retailer,
        targetDomain,
        targetSubdomain,
        targetUrl: link.url,
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`
        },
        metadata: {
          customName: link.customName || null
        }
      });

      // Navigate to the destination URL
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Error tracking referral click:", error);
      // Still navigate even if tracking fails
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Choose appropriate styling based on whether an icon is provided
  const hasIcon = !!link.faviconUrl;

  if (iconOnly && hasIcon) {
    return (
      <a
        href={link.url}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center ${className}`}
      >
        <img 
          src={link.faviconUrl} 
          alt={link.retailer} 
          className="h-6 w-6" 
          title={link.customName || link.retailer}
        />
      </a>
    );
  }

  return (
    <a
      href={link.url}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center text-sm hover:underline ${className}`}
    >
      {hasIcon && (
        <img 
          src={link.faviconUrl} 
          alt="" 
          className="h-4 w-4 mr-1.5" 
        />
      )}
      <span className="mr-1">{link.customName || link.retailer}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
};