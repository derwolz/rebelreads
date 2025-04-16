import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ProDashboardSidebar } from "@/components/pro-dashboard-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProLayoutProps {
  children: React.ReactNode;
}

export function ProLayout({ children }: ProLayoutProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Toggle sidebar collapsed state
  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="h-full pt-8">
            <div className="px-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(false)}
                className="w-full justify-start"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Close Menu
              </Button>
            </div>
            <ProDashboardSidebar collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex gap-4">
        {/* Desktop Sidebar */}
        <div 
          className={cn(
            "hidden md:flex md:flex-col border-r transition-all duration-300 ease-in-out", 
            isCollapsed ? "w-16" : "w-60"
          )}
        >
          <div className="mb-4 mt-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="w-full justify-center"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          <ProDashboardSidebar collapsed={isCollapsed} />
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
          
          {children}
        </div>
      </div>
    </main>
  );
}