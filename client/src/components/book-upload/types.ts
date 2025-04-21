import { Book, ReferralLink } from "@shared/schema";
import { TaxonomyItem } from "@/components/genre-selector";

/**
 * Interface for storing book image files with their metadata
 */
export interface BookImageFile {
  type: string;
  file: File | null;
  width: number;
  height: number;
  previewUrl?: string; // URL for existing images when editing
  error?: string; // Track validation errors
}

/**
 * Form data structure for the book upload wizard
 */
export interface BookFormData {
  title: string;
  description: string;
  series: string;
  setting: string;
  characters: string[];
  hasAwards: boolean;
  awards: string[];
  formats: string[]; // We just track which formats are available, not the files themselves
  pageCount: number;
  publishedDate: string;
  isbn: string;
  asin: string;
  language: string;
  originalTitle: string;
  referralLinks: ReferralLink[];
  internal_details: string;
  genreTaxonomies: TaxonomyItem[];
  // Book images
  bookImages: Record<string, BookImageFile>;
}

/**
 * Props for each step component
 */
export interface StepComponentProps {
  formData: BookFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookFormData>>;
}

/**
 * Props for the wizard controller
 */
export interface WizardControllerProps {
  onSuccess?: () => void;
  book?: Book;
}

/**
 * Step definition for wizard
 */
export interface WizardStep {
  title: string;
  component: React.ComponentType<StepComponentProps>;
  icon: React.ReactNode;
}