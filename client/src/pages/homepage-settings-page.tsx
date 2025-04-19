import { useState, useEffect } from "react";
import { HomepageSettings } from "@/components/homepage-settings";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function HomepageSettingsPage() {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize with localStorage value or default to false
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Get value from localStorage if available
    const savedState = localStorage.getItem('settings-sidebar-collapsed');
    return savedState ? savedState === 'true' : false;
  });
  
  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('settings-sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);
  
  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [_]);

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
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="h-full pt-8">
            <SettingsSidebar />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
      </div>
      
      <div className="flex gap-4 md:gap-6 min-h-[calc(100vh-8rem)]">
        {/* Desktop Sidebar */}
        <div 
          className={`hidden md:block ${isSidebarCollapsed ? 'w-[90px]' : 'w-64'} transition-all duration-300 ease-in-out relative`}
        >
          <div className="absolute right-0 top-0 z-10 transform translate-x-1/2 mt-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-7 w-7 bg-background border-r shadow-sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="border-r bg-background/60 h-full px-4 py-6 border-border">
            <SettingsSidebar collapsed={isSidebarCollapsed} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Mobile menu button - only visible on mobile */}
          <div className="md:hidden mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </Button>
          </div>
          
          <HomepageSettings />
        </div>
      </div>
    </main>
  );
}