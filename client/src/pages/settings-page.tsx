import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { useLocation } from "wouter";
import { ReaderSettings } from "@/components/reader-settings";
import { RatingPreferencesSettings } from "@/components/rating-preferences-settings";
import { GenrePreferencesSettings } from "@/components/genre-preferences-settings";
import { HomepageSettings } from "@/components/homepage-settings";
import { AppearanceSettings } from "@/components/appearance-settings";
import { ContentFiltersSettings } from "@/components/content-filters-settings";
import { BookShelfSettings } from "@/components/book-shelf-settings";
import { AccountSettings } from "@/components/account-settings";
import { AuthorSettings } from "@/components/author-settings";
import { SettingsSidebarWrapper } from "@/components/settings-sidebar-wrapper";

export default function SettingsPage() {
  const { isAuthor } = useAuth();
  const [location] = useLocation();

  const { data: userBooks } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: isAuthor,
  });

  let content;
  if (location === "/settings/account") {
    content = <AccountSettings />;
  } else if (location === "/settings/appearance") {
    content = <AppearanceSettings />;
  } else if (location === "/settings/rating-preferences") {
    content = <RatingPreferencesSettings isWizard={false} />;
  } else if (location === "/settings/genre-preferences") {
    content = <GenrePreferencesSettings />;
  } else if (location === "/settings/homepage") {
    content = <HomepageSettings />;
  } else if (location === "/settings/filters") {
    content = <ContentFiltersSettings />;
  } else if (location === "/settings/book-shelf") {
    content = <BookShelfSettings />;
  } else if (location === "/settings/author" && isAuthor) {
    content = <AuthorSettings userBooks={userBooks} />;
  } else {
    content = <ReaderSettings />;
  }

  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
      </div>
      
      <div className="flex gap-4 md:gap-6 min-h-[calc(100vh-8rem)]">
        {/* Settings sidebar component */}
        <SettingsSidebarWrapper location={location} />
        
        <div className="flex-1 min-w-0">
          {content}
        </div>
      </div>
    </main>
  );
}