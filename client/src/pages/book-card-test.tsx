import React from "react";
import { BookCardA } from "@/components/book-card-a";
import { BookCardB } from "@/components/book-card-b";
import { Book, BookImage } from "../types";

// Create a sample book for ValkyrieXTruck by King Stanky
const valkyrieXTruckBook: Book = {
  id: 999,
  title: "ValkyrieXTruck",
  authorId: 1,
  authorName: "King Stanky",
  description: "A thrilling adventure that follows the epic journey of the ValkyrieXTruck as it battles through a post-apocalyptic wasteland. With a powerful V8 engine and otherworldly abilities, the Valkyrie transforms the transportation landscape forever.",
  promoted: true,
  pageCount: 320,
  formats: ["hardcover", "ebook", "audiobook"],
  publishedDate: new Date().toISOString(), // Set to current date to show "New" badge
  awards: ["Best Fiction 2025"],
  originalTitle: "ValkyrieXTruck: Origins",
  series: "Valkyrie Chronicles",
  setting: "Post-Apocalyptic",
  characters: ["Valkyrie", "King Stanky", "The Mechanic"],
  isbn: "1234567890123",
  asin: "B123456789",
  language: "English",
  referralLinks: [],
  impressionCount: 500,
  clickThroughCount: 120,
  lastImpressionAt: new Date().toISOString(),
  lastClickThroughAt: new Date().toISOString(),
  internal_details: null,
  images: [
    {
      id: 1,
      bookId: 999,
      imageUrl: "/images/placeholder-book.png",
      imageType: "book-card",
      width: 500,
      height: 750,
      sizeKb: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  genres: ["Post-Apocalyptic", "Adventure", "Science Fiction", "Automotive", "Thriller"]
};

// BookCardTest component
export default function BookCardTest() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <h1 className="text-3xl font-bold mb-8">Book Card Test Page</h1>
      
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 p-8">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6">Card A</h2>
          <div className="flex justify-center">
            <BookCardA book={valkyrieXTruckBook} />
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6">Card B</h2>
          <div className="flex justify-center">
            <BookCardB book={valkyrieXTruckBook} />
          </div>
        </div>
      </div>
    </div>
  );
}