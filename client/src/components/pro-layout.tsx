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
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="h-full pt-8">
            <ProDashboardSidebar />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex gap-4 md:gap-6">
        {/* Desktop Sidebar */}
        <div 
          className={`hidden md:block ${collapsed ? 'w-[70px]' : 'w-60'} transition-all duration-300 ease-in-out relative`}
        >
          <div className="absolute right-0 top-0 z-10 transform translate-x-1/2 mt-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-6 w-6 bg-background border shadow-sm"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>
          </div>
          <ProDashboardSidebar collapsed={collapsed} />
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