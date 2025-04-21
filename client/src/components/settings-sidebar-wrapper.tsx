import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SettingsSidebarWrapperProps {
  location: string;
}

export function SettingsSidebarWrapper({ location }: SettingsSidebarWrapperProps) {
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
  }, [location]);

  return (
    <>
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
      
      {/* Mobile sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[250px]">
          <div className="p-6">
            <SettingsSidebar collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}