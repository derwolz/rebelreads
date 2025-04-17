// Core application types
export interface User {
  id: number;
  email: string;
  username: string;
  profileImageUrl: string | null;
  displayName: string | null;
  bio: string | null;
  isAuthor?: boolean;
  isPro?: boolean;
}

export interface Book {
  id: number;
  title: string;
  authorId: number;
  description: string;
  promoted: boolean | null;
  pageCount: number | null;
  formats: string[];
  publishedDate: string | null;
  awards: string[] | null;
  originalTitle: string | null;
  series: string | null;
  setting: string | null;
  characters: string[] | null;
  isbn: string | null;
  asin: string | null;
  language: string;
  referralLinks: any[]; // Simplify for now
  impressionCount: number;
  clickThroughCount: number;
  lastImpressionAt: string | null;
  lastClickThroughAt: string | null;
  internal_details: string | null;
  authorName?: string;
  authorImageUrl?: string | null;
  images?: BookImage[];
  // Taxonomy-based similarity score properties
  taxonomicScore?: number;
  matchingTaxonomies?: number;
  coverUrl?: string | null; // Used in discover page
}

export interface BookImage {
  id: number;
  bookId: number;
  imageUrl: string;
  imageType: string;
  width: number;
  height: number;
  sizeKb: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  id: number;
  userId: number;
  author_name: string;
  author_image_url: string | null;
  birth_date: string | null;
  death_date: string | null;
  website: string | null;
  bio: string | null;
}

export interface Publisher {
  id: number;
  userId: number;
  name: string;
  publisher_name: string;
  publisher_description: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  createdAt: string;
}

export interface GenreTaxonomy {
  id: number;
  name: string;
  type: string;
  parent_id: number | null;
  description: string | null;
}

// Content filter types
export interface UserBlock {
  id: number;
  userId: number;
  blockType: string;
  blockId: number;
  blockName: string;
  createdAt: string;
}