import { useState, useEffect } from "react";
import { HomepageSettings } from "@/components/homepage-settings";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { cn } from "@/lib/utils";

export function HomepageSettingsPage() {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle touch events for the mobile sidebar
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].clientX;
      if (touchEndX - touchStartX > 100) { // Right swipe
        setIsSidebarOpen(true);
      } else if (touchStartX - touchEndX > 100) { // Left swipe
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to access your homepage settings.",
      });
      navigate("/");
    }
  }, [user, isLoading, navigate, toast]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Settings</h1>
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <SettingsSidebar />
        </div>

        {/* Mobile Swipeable Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 right-0 w-64 bg-background border-l transform transition-transform duration-200 ease-in-out z-50 md:hidden",
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="h-full overflow-y-auto pt-20 px-4">
            <SettingsSidebar />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <HomepageSettings />
        </div>

        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </main>
  );
}