import { useState, useEffect } from "react";
import { ProDashboardSidebar } from "@/components/pro-dashboard-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

interface ProLayoutProps {
  children: React.ReactNode;
}

export function ProLayout({ children }: ProLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Initialize with localStorage value or default to false
  const [collapsed, setCollapsed] = useState(() => {
    // Get value from localStorage if available
    const savedState = localStorage.getItem('pro-sidebar-collapsed');
    return savedState ? savedState === 'true' : false;
  });
  const [location] = useLocation();

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pro-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      {/* Mobile Sidebar is removed as we're now using the main navigation menu for mobile */}

      <div className="flex gap-4 md:gap-6 min-h-[calc(100vh-8rem)]">
        {/* Desktop Sidebar */}
        <div 
          className={`hidden md:block ${collapsed ? 'w-[90px]' : 'w-64'} transition-all duration-300 ease-in-out relative`}
        >
          <div className="absolute right-0 top-0 z-10 transform translate-x-1/2 mt-4">
            <Button 
              variant="outline" 
              size="icon" 
              className=" rounded-full h-7 w-7 bg-background border-r shadow-sm"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="border-r  bg-background/60 h-full px-4 py-6 border-border">
            <ProDashboardSidebar collapsed={collapsed} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Mobile menu button removed, now using main navigation menu for mobile */}
          
          {children}
        </div>
      </div>
    </main>
  );
}