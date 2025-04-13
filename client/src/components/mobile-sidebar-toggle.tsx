import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { PanelLeft } from "lucide-react";

export function MobileSidebarToggle() {
  const { setOpenMobile } = useSidebar();

  return (
    <div className="lg:hidden fixed right-4 top-20 z-30">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full shadow-md bg-background"
        onClick={() => setOpenMobile(true)}
        aria-label="Toggle Sidebar"
      >
        <PanelLeft className="h-5 w-5" />
      </Button>
    </div>
  );
}