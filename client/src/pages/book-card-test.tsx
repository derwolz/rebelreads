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
      id: 1,
      bookId: 51,
      imageUrl: "/api/storage/author-profiles/profile-CHWrejjN.jpg", // Using author profile image since we don't have the book image
      imageType: "book-card",
      width: 500,
      height: 750,
      sizeKb: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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