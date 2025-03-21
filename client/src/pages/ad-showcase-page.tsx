import React from "react";
import { AdShowcase } from "@/components/banner-ads";

export default function AdShowcasePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Ad Banner Showcase</h1>
      <p className="text-lg mb-8">
        This page demonstrates the different types of banner ads available in our application.
        All ads track impressions when they come into view and track clicks when users interact with them.
      </p>
      
      <AdShowcase />
    </div>
  );
}