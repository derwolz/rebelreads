import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LineChart, Flag, MessageSquare, User } from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export function ProDashboardSidebar() {
  const [location] = useLocation();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={location === "/pro"}
          tooltip="Analytics"
        >
          <Link href="/pro">
            <LineChart className="h-4 w-4" />
            <span>Analytics</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={location === "/pro/reviews"}
          tooltip="Review Management"
        >
          <Link href="/pro/reviews">
            <MessageSquare className="h-4 w-4" />
            <span>Review Management</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={location === "/pro/action"}
          tooltip="Take Action"
        >
          <Link href="/pro/action">
            <Flag className="h-4 w-4" />
            <span>Take Action</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={location === "/pro/author-settings"}
          tooltip="Author Settings"
        >
          <Link href="/pro/author-settings">
            <User className="h-4 w-4" />
            <span>Author Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}