import { Book } from "../../types";
// Constants for book spine dimensions and animation
export const SPINE_WIDTH = 56;
export const SPINE_HEIGHT = 256;

export interface BookSpineProps {
  book: Book;
  angle: number;
  index?: number;
  className?: string;
  onClick?: (book: Book) => void;
  onHover?: (isHovered: boolean) => void;
}

// Possible lean angles in degrees
export const LEAN_OPTIONS = [
  { angle: 0, probability: 0.88 },    // Straight - 92% chance
  { angle: -5, probability: 0.04 },   // Slight lean left - 2% chance
  { angle: -10, probability: 0.04 },  // Moderate lean left - 2% chance
  { angle: 5, probability: 0.04 },    // Slight lean right - 2% chance
  { angle: 10, probability: 0.04 },   // Moderate lean right - 2% chance
];

// Calculate the geometric properties for a leaning book
export function calculateLeaningGeometry(angle: number) {
  if (angle === 0) {
    return {
      width: SPINE_WIDTH,
      offset: 0,
    };
  }
  
  // Convert angle to radians for trigonometry calculations
  const radians = Math.abs(angle) * (Math.PI / 180);
  
  // Calculate additional width needed when book is leaning
  // sin(angle) * height gives the additional horizontal space needed
  const additionalWidth = Math.sin(radians) * SPINE_HEIGHT;
  const totalWidth = Math.ceil(SPINE_WIDTH + additionalWidth);
  
  // Calculate the offset needed to center the book
  // If leaning left (negative angle), we need positive offset (to the right)
  // If leaning right (positive angle), we need negative offset (to the left)
  const offset = angle < 0 
    ? additionalWidth / 2  // Move right for left lean
    : -additionalWidth / 2; // Move left for right lean
  
  return {
    width: totalWidth,
    offset,
  };
}