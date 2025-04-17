/**
 * Utilities for fetching and handling website favicons
 */
import fetch from 'node-fetch';
import { ReferralLink } from '@shared/schema';

/**
 * Extract the domain name from a URL
 * @param url The URL to extract the domain from
 * @returns The domain name (e.g., 'amazon.com' from 'https://www.amazon.com/books')
 */
export function extractDomain(url: string): string {
  try {
    // Remove protocol and get hostname
    const hostname = new URL(url).hostname;
    
    // Remove 'www.' prefix if present
    return hostname.replace(/^www\./, '');
  } catch (error) {
    console.error('Error extracting domain from URL:', error);
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
    
    // First try Google's favicon service
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    
    // Verify if the favicon exists
    const response = await fetch(googleFaviconUrl, { method: 'HEAD' });
    if (response.ok) {
      return googleFaviconUrl;
    }
    
    // If Google's service fails, try a direct favicon.ico approach
    const directFaviconUrl = `https://${domain}/favicon.ico`;
    
    // We don't actually need to verify this one as we'll use it as a fallback
    return directFaviconUrl;
  } catch (error) {
    console.error('Error fetching favicon URL:', error);
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