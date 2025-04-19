import { useState, useEffect } from "react";
import { HomepageSettings } from "@/components/homepage-settings";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomepageSettingsPage() {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={() => setIsSidebarOpen(true)}
        >
          <PanelLeft className="h-6 w-6" />
        </Button>
      </div>
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <SettingsSidebar 
            isMobile={false} 
            collapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar with framer motion drag */}
        <SettingsSidebar 
          isMobile={true} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        {/* Main Content */}
        <div className={cn(
          "flex-1 min-w-0",
          isSidebarCollapsed && "md:pl-4" // Add a bit more space when sidebar is collapsed
        )}>
          <HomepageSettings />
        </div>
      </div>
    </main>
  );
}