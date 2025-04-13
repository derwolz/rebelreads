import { WhatsHotSidebar } from "@/components/whats-hot-sidebar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { X } from "lucide-react";

export function MobileSidebarContent() {
  const { setOpenMobile } = useSidebar();

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-bold text-lg">What's Hot</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setOpenMobile(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <WhatsHotSidebar />
      </div>
    </div>
  );
}