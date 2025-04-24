import React from "react";
import { BookCardA } from "@/components/book-card-a";
import { BookCardB } from "@/components/book-card-b";
import { Book, BookImage } from "../types";

// Use real ValkyrieXTruck by King Stanky from database
const valkyrieXTruckBook: Book = {
  id: 51,
  title: "Valkyrie X Truck",
  authorId: 14,
  authorName: "King Stanky",
  description: "Truck struck and gun shot, Max finds himself enraptured by a mysterious woman, pursued by even more mysterious assailants. Her goal: retrieve her missing gun. His goal: survive, as his mundane world descends into madness.",
  promoted: true,
  pageCount: 320,
  formats: ["digital"],
  publishedDate: new Date().toISOString(), // Set to current date to show "New" badge
  awards: [],
  originalTitle: null,
  series: null,
  setting: null,
  characters: [],
  isbn: null,
  asin: null,
  language: "English",
  referralLinks: [
    {
      url: "https://valkyriexTruck.com",
      domain: "valkyriextruck.com",
      retailer: "Custom",
      customName: "Read the first 5 chapters!",
      faviconUrl: "https://www.google.com/s2/favicons?domain=valkyriextruck.com&sz=64"
    }
  ],
  impressionCount: 0,
  clickThroughCount: 0,
  lastImpressionAt: null,
  lastClickThroughAt: null,
  internal_details: null,
  images: [
    {
      id: 180,
      bookId: 51,
      imageUrl: "/api/storage/covers/card/book_51/book-card-51-fLkWW5Q5.jpg", // Using the actual book-card image from database
      imageType: "book-card",
      width: 260,
      height: 435,
      sizeKb: 38,
      createdAt: new Date("2025-04-24T05:38:57.568Z").toISOString(),
      updatedAt: new Date("2025-04-24T05:38:57.568Z").toISOString()
    }
  ],
  genres: ["Post-Apocalyptic", "Adventure", "Science Fiction", "Action", "Thriller"]
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