import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  User,
  Settings,
  Monitor,
  Star,
  BookOpen,
  LayoutGrid,
  ChevronRight,
  Filter,
  BookOpenCheck,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItemProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
  collapsed?: boolean;
}

function NavItem({ href, active, children, icon, collapsed }: NavItemProps) {
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href}>
              <Button
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-center h-10",
                  active && "bg-secondary"
                )}
                size="icon"
              >
                {icon}
                <span className="sr-only">{children}</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{children}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link href={href}>
      <Button
        variant={active ? "secondary" : "ghost"}
        className={cn("w-full justify-start gap-2", active && "bg-secondary")}
      >
        {icon}
        {children}
      </Button>
    </Link>
  );
}

interface SettingsSidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

export function SettingsSidebar({
  isMobile,
  isOpen,
  onClose,
  collapsed = false,
}: SettingsSidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  // Handle drag end event for mobile (not used with Sheet component)
  const handleDragEnd = (_: any, info: PanInfo) => {
    // If dragged to the left (negative x value), close the sidebar
    if (info.offset.x < -50) {
      onClose?.();
    }
  };

  return (
    <nav className={cn("space-y-3", collapsed ? "w-full" : "w-full")}>
      <NavItem
        href="/settings"
        active={location === "/settings"}
        icon={<User className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Profile
      </NavItem>
      <NavItem
        href="/settings/account"
        active={location === "/settings/account"}
        icon={<Settings className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Account
      </NavItem>
      <NavItem
        href="/settings/appearance"
        active={location === "/settings/appearance"}
        icon={<Monitor className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Appearance
      </NavItem>
      <NavItem
        href="/settings/rating-preferences"
        active={location === "/settings/rating-preferences"}
        icon={<Star className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Rating Preferences
      </NavItem>
      <NavItem
        href="/settings/genre-preferences"
        active={location === "/settings/genre-preferences"}
        icon={<BookOpen className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Genre Preferences
      </NavItem>
      <NavItem
        href="/settings/homepage"
        active={location === "/settings/homepage"}
        icon={<LayoutGrid className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Homepage Layout
      </NavItem>
      <NavItem
        href="/settings/filters"
        active={location === "/settings/filters"}
        icon={<Filter className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Content Filters
      </NavItem>
      <NavItem
        href="/settings/book-shelf"
        active={location === "/settings/book-shelf"}
        icon={<BookOpenCheck className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Book Shelves
      </NavItem>
    </nav>
  );
}
