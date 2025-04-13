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

  // Handle drag end for closing the sidebar
  const handleDragEnd = (event: any) => {
    // If dragged to the left (negative delta x), close the sidebar
    if (event.delta.x < -50) {
      setIsSidebarOpen(false);
    }
  };

  // Initialize sensors for drag detection
  const {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
  } = require('@dnd-kit/core');

  const dragSensors = useSensors(
    useSensor(PointerSensor, {
      // Customize sensor activation constraints if needed
      activationConstraint: {
        distance: 10, // Minimum distance required to start dragging
      },
    })
  );

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
      <DndContext sensors={dragSensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <SettingsSidebar isMobile={false} />
          </div>

          {/* Mobile Sidebar with custom drag wrapper */}
          <SettingsSidebar 
            isMobile={true} 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <HomepageSettings />
          </div>
        </div>
      </DndContext>
    </main>
  );
}