/**
 * Utilities for fetching and handling website favicons
 */
import fetch from 'node-fetch';
import { URL } from 'url';
import type { ReferralLink } from '../../shared/schema';

/**
 * Extract the domain name from a URL
 * @param url The URL to extract the domain from
 * @returns The domain name (e.g., 'amazon.com' from 'https://www.amazon.com/books')
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Remove 'www.' prefix if it exists
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    return hostname;
  } catch (error) {
    console.error('Error extracting domain:', error);
    return '';
  }
}

/**
 * Attempt to find the favicon URL for a given website URL
 * @param url The website URL to find the favicon for
 * @returns The URL to the favicon or null if not found
 */
export async function getFaviconUrl(url: string): Promise<string | null> {
  try {
    const domain = extractDomain(url);
    if (!domain) return null;

    // Try common favicon locations
    const faviconOptions = [
      // Google's favicon service
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      
      // Common favicon paths
      `https://${domain}/favicon.ico`,
      `https://www.${domain}/favicon.ico`,
      `https://${domain}/favicon.png`,
      `https://www.${domain}/favicon.png`,
    ];
    
    // Check the google favicon service first (usually works most reliably)
    const googleFaviconUrl = faviconOptions[0];
    return googleFaviconUrl;
    
    // Note: The code below does more thorough checks but might be unnecessary
    // as Google's favicon service is usually reliable. Uncomment if needed.
    
    /*
    // First try Google's favicon service as it's most reliable
    try {
      const response = await fetch(googleFaviconUrl, { method: 'HEAD' });
      if (response.ok) {
        return googleFaviconUrl;
      }
    } catch (error) {
      console.log('Google favicon service not available, trying direct paths');
    }
    
    // Then try common favicon locations
    for (let i = 1; i < faviconOptions.length; i++) {
      try {
        const response = await fetch(faviconOptions[i], { method: 'HEAD' });
        if (response.ok) {
          return faviconOptions[i];
        }
      } catch (error) {
        // Continue to the next option
      }
    }
    */
    
    // If all fails, return null
    return null;
  } catch (error) {
    console.error('Error getting favicon URL:', error);
    return null;
  }
}

/**
 * Enhance a referral link with domain and favicon information
 * @param referralLink The referral link to enhance
 * @returns The enhanced referral link
 */
export async function enhanceReferralLink(referralLink: ReferralLink): Promise<ReferralLink> {
  if (!referralLink.url) {
    return referralLink;
  }

  try {
    // Extract the domain from the URL
    const domain = extractDomain(referralLink.url);
    
    // Fetch the favicon URL
    const faviconUrl = await getFaviconUrl(referralLink.url);
    
    // Return the enhanced referral link
    return {
      ...referralLink,
      domain,
      faviconUrl: faviconUrl || undefined,
    };
  } catch (error) {
    console.error('Error enhancing referral link:', error);
    return referralLink;
  }
}

/**
 * Enhance multiple referral links with domain and favicon information
 * @param referralLinks Array of referral links to enhance
 * @returns Array of enhanced referral links
 */
export async function enhanceReferralLinks(referralLinks: ReferralLink[]): Promise<ReferralLink[]> {
  if (!referralLinks || referralLinks.length === 0) {
    return [];
  }

  try {
    const enhancedLinks = await Promise.all(
      referralLinks.map(link => enhanceReferralLink(link))
    );
    return enhancedLinks;
  } catch (error) {
    console.error('Error enhancing referral links:', error);
    return referralLinks;
  }
}