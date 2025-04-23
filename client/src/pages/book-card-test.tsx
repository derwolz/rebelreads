import React from "react";
import { BookCard } from "@/components/book-card";
import { Book, BookImage } from "../types";

// Create a sample book for testing purposes
const sampleBook: Book = {
  id: 999,
  title: "Sample Book Title",
  authorId: 1,
  authorName: "Sample Author",
  description: "This is a sample book description for testing the BookCard component. It includes enough text to demonstrate how descriptions appear in the tooltip.",
  promoted: true,
  pageCount: 320,
  formats: ["hardcover", "ebook", "audiobook"],
  publishedDate: new Date().toISOString(), // Set to current date to show "New" badge
  awards: ["Best Fiction 2025"],
  originalTitle: "Original Sample Title",
  series: "Sample Series",
  setting: "Contemporary",
  characters: ["Character 1", "Character 2"],
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
  genres: ["Fantasy", "Adventure", "Mystery"]
};

// BookCardTest component
export default function BookCardTest() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <h1 className="text-3xl font-bold mb-8">Book Card Test Page</h1>
      <div className="w-full max-w-7xl mx-auto flex justify-center">
        <BookCard book={sampleBook} />
      </div>
    </div>
  );
}