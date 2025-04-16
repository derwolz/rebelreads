// Block types for content filtering
export const BLOCK_TYPE_OPTIONS = ["author", "publisher", "book", "taxonomy"] as const;

// Book formats
export const FORMAT_OPTIONS = ["softback", "hardback", "digital", "audiobook"] as const;

// Rating criteria
export const RATING_CRITERIA = [
  "enjoyment",
  "writing", 
  "themes",
  "characters",
  "worldbuilding"
] as const;

// Image types for books
export const IMAGE_TYPES = [
  "book-detail",    // 480x600 - Used on book details page
  "background",     // 1300x1500 - Used as background on book details page
  "book-card",      // 256x440 - Used in recommendations
  "grid-item",      // 56x212 - Used in grid layouts
  "mini",           // 48x64 - Used in reviews and what's hot sections
  "hero"            // 1500x600 - Used in hero sections
] as const;