import React from "react";
import { LinkedContentPreview } from "@/components/linked-content-preview";

// Regex patterns to match book and bookshelf links
const BOOK_LINK_PATTERN = /(\s|^)\/books\/([0-9]+)(\s|$)/g;
const BOOKSHELF_LINK_PATTERN = /(\s|^)\/book-shelf\/share\?username=([^&]+)&shelfname=([^&\s]+)(\s|$)/g;

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
  
  // Process book links
  while ((match = BOOK_LINK_PATTERN.exec(workingContent)) !== null) {
    const fullMatch = match[0];
    const leadingSpace = match[1] || "";
    const bookId = match[2];
    const trailingSpace = match[3] || "";
    
    // Add text before the match
    const beforeMatchText = workingContent.slice(lastIndex, match.index);
    if (beforeMatchText) {
      contentParts.push(beforeMatchText);
      elements.push(beforeMatchText);
    }
    
    // Add leading space if present
    if (leadingSpace) {
      contentParts.push(leadingSpace);
      elements.push(leadingSpace);
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
      elements.push(trailingSpace);
    }
    
    // Update index tracking
    lastIndex = match.index + fullMatch.length;
    placeholderIndex++;
  }
  
  // Add any remaining content after the last match
  if (lastIndex < workingContent.length) {
    const remainingText = workingContent.slice(lastIndex);
    contentParts.push(remainingText);
    elements.push(remainingText);
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