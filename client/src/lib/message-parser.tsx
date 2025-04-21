import React from "react";
import { LinkedContentPreview } from "@/components/linked-content-preview";

// Regex patterns to match book and bookshelf links (paths and full URLs)
// Match any of these formats:
// - /books/123
// - sirened.com/books/123
// - http://sirened.com/books/123
// - https://sirened.com/books/123
// - http://www.sirened.com/books/123
// - https://www.sirened.com/books/123
const BOOK_LINK_PATTERN = /(\s|^)(?:https?:\/\/(?:www\.)?sirened\.com|sirened\.com)?\/books\/([0-9]+)(\s|$)/g;

// Similar pattern for bookshelf links
const BOOKSHELF_LINK_PATTERN = /(\s|^)(?:https?:\/\/(?:www\.)?sirened\.com|sirened\.com)?\/book-shelf\/share\?username=([^&]+)&shelfname=([^&\s]+)(\s|$)/g;

// Leave bare domain alone pattern
const BARE_DOMAIN_PATTERN = /(\s|^)(sirened\.com)(\s|$)/g;

// General URL regex that will match all URLs (excluding bare sirened.com which we want to preserve)
const GENERAL_URL_PATTERN = /(\s|^)(https?:\/\/(?:www\.)?(?!sirened\.com$)([^\/\s]+)(?:\/[^\s]*)?)+(\s|$)/g;

/**
 * Parse message content to detect book and bookshelf links and replace them
 * with LinkedContentPreview components
 */
export function parseMessageContent(content: string): React.ReactNode[] {
  if (!content) return [];
  
  // Clone the content to work with
  let workingContent = content;
  const elements: React.ReactNode[] = [];
  const contentParts: string[] = [];
  
  // Temporary placeholders to save positions
  const replacements: { 
    index: number;
    type: "book" | "bookshelf";
    id?: string | number;
    username?: string;
    shelfName?: string;
  }[] = [];
  
  // Find and replace book links
  let match;
  let lastIndex = 0;
  let placeholderIndex = 0;
  
  // Process book links - these can be paths or full URLs with sirened.com domain
  while ((match = BOOK_LINK_PATTERN.exec(workingContent)) !== null) {
    const fullMatch = match[0];
    const leadingSpace = match[1] || "";
    const bookId = match[2]; // Book ID is now in position 2
    const trailingSpace = match[3] || "";
    
    // Add text before the match
    const beforeMatchText = workingContent.slice(lastIndex, match.index);
    if (beforeMatchText) {
      contentParts.push(beforeMatchText);
    }
    
    // Add leading space if present
    if (leadingSpace) {
      contentParts.push(leadingSpace);
    }
    
    // Create placeholder for the book preview
    const placeholder = `__PLACEHOLDER_${placeholderIndex}__`;
    contentParts.push(placeholder);
    replacements.push({ 
      index: placeholderIndex,
      type: "book", 
      id: bookId 
    });
    
    // Add trailing space if present
    if (trailingSpace) {
      contentParts.push(trailingSpace);
    }
    
    // Update index tracking
    lastIndex = match.index + fullMatch.length;
    placeholderIndex++;
  }
  
  // Add any remaining content after the last match
  if (lastIndex < workingContent.length) {
    const remainingText = workingContent.slice(lastIndex);
    contentParts.push(remainingText);
  }
  
  // Reset for bookshelf processing
  workingContent = contentParts.join('');
  contentParts.length = 0;
  lastIndex = 0;
  
  // Process bookshelf links
  while ((match = BOOKSHELF_LINK_PATTERN.exec(workingContent)) !== null) {
    const fullMatch = match[0];
    const leadingSpace = match[1] || "";
    const username = decodeURIComponent(match[2]);
    const shelfName = decodeURIComponent(match[3]);
    const trailingSpace = match[4] || "";
    
    // Add text before the match
    const beforeMatchText = workingContent.slice(lastIndex, match.index);
    if (beforeMatchText) {
      contentParts.push(beforeMatchText);
    }
    
    // Add leading space if present
    if (leadingSpace) {
      contentParts.push(leadingSpace);
    }
    
    // Create placeholder for the bookshelf preview
    const placeholder = `__PLACEHOLDER_${placeholderIndex}__`;
    contentParts.push(placeholder);
    replacements.push({ 
      index: placeholderIndex,
      type: "bookshelf", 
      username, 
      shelfName 
    });
    
    // Add trailing space if present
    if (trailingSpace) {
      contentParts.push(trailingSpace);
    }
    
    // Update index tracking
    lastIndex = match.index + fullMatch.length;
    placeholderIndex++;
  }
  
  // Add any remaining content after the last match
  if (lastIndex < workingContent.length) {
    contentParts.push(workingContent.slice(lastIndex));
  }
  
  // Final content with all specific Sirened.com links replaced with placeholders
  let filteredContent = contentParts.join('');
  contentParts.length = 0;
  lastIndex = 0;
  
  // Process bare sirened.com domain (preserve it)
  contentParts.length = 0;
  lastIndex = 0;
  const processedContent = filteredContent;
  
  // First handle bare sirened.com domain
  while ((match = BARE_DOMAIN_PATTERN.exec(processedContent)) !== null) {
    const fullMatch = match[0];
    const leadingSpace = match[1] || "";
    const domain = match[2]; // This will be "sirened.com"
    const trailingSpace = match[3] || "";
    
    // Add text before the match
    const beforeMatchText = processedContent.slice(lastIndex, match.index);
    if (beforeMatchText) {
      contentParts.push(beforeMatchText);
    }
    
    // Add leading space if present
    if (leadingSpace) {
      contentParts.push(leadingSpace);
    }
    
    // Add bare domain as-is
    contentParts.push(domain);
    
    // Add trailing space if present
    if (trailingSpace) {
      contentParts.push(trailingSpace);
    }
    
    // Update index tracking
    lastIndex = match.index + fullMatch.length;
  }
  
  // Add any remaining content after the last match
  if (lastIndex < processedContent.length) {
    contentParts.push(processedContent.slice(lastIndex));
  }
  
  // Reset for processing other URLs
  filteredContent = contentParts.join('');
  contentParts.length = 0;
  lastIndex = 0;
  
  // Process all other URLs and remove them if they're not sirened.com
  while ((match = GENERAL_URL_PATTERN.exec(filteredContent)) !== null) {
    const fullMatch = match[0];
    const leadingSpace = match[1] || "";
    const url = match[2] || "";
    const domain = match[3] || "";
    const trailingSpace = match[4] || "";
    
    // Only process if NOT sirened.com - sirened.com links were already processed above
    if (domain && !domain.includes("sirened.com")) {
      // Add text before the match
      const beforeMatchText = filteredContent.slice(lastIndex, match.index);
      if (beforeMatchText) {
        contentParts.push(beforeMatchText);
      }
      
      // Add leading space if present
      if (leadingSpace) {
        contentParts.push(leadingSpace);
      }
      
      // We strip non-sirened URLs, so we don't add anything for the URL itself
      
      // Add trailing space if present
      if (trailingSpace) {
        contentParts.push(trailingSpace);
      }
      
      // Update index tracking
      lastIndex = match.index + fullMatch.length;
    } else {
      // We already processed the known sirened.com patterns, so we should preserve any other text
      const beforeMatchText = filteredContent.slice(lastIndex, match.index + leadingSpace.length);
      if (beforeMatchText) {
        contentParts.push(beforeMatchText);
      }
      lastIndex = match.index + leadingSpace.length;
    }
  }
  
  // Add any remaining content after the last match
  if (lastIndex < filteredContent.length) {
    contentParts.push(filteredContent.slice(lastIndex));
  }
  
  // Final joined content with all placeholders
  const finalContent = contentParts.join('');
  
  // If no replacements needed, return the original content
  if (replacements.length === 0) {
    return [content];
  }
  
  // Replace placeholders with actual components
  const result: React.ReactNode[] = [];
  const parts = finalContent.split(/(__PLACEHOLDER_\d+__)/);
  
  parts.forEach(part => {
    const placeholderMatch = part.match(/__PLACEHOLDER_(\d+)__/);
    if (placeholderMatch) {
      const placeholderIndex = parseInt(placeholderMatch[1], 10);
      const replacement = replacements.find(r => r.index === placeholderIndex);
      
      if (replacement) {
        if (replacement.type === "book") {
          result.push(
            <LinkedContentPreview 
              key={`book-${replacement.id}`}
              type="book" 
              id={replacement.id || ''} 
              className="my-2"
            />
          );
        } else if (replacement.type === "bookshelf") {
          result.push(
            <LinkedContentPreview 
              key={`shelf-${replacement.username}-${replacement.shelfName}`}
              type="bookshelf" 
              id={`${replacement.username}-${replacement.shelfName}`}
              username={replacement.username} 
              shelfName={replacement.shelfName}
              className="my-2"
            />
          );
        }
      }
    } else if (part) {
      result.push(part);
    }
  });
  
  return result;
}