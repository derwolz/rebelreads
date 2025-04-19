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
  onToggleCollapse?: () => void;
}

export function SettingsSidebar({
  isMobile,
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SettingsSidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  // Handle drag end event
  const handleDragEnd = (_: any, info: PanInfo) => {
    // If dragged to the left (negative x value), close the sidebar
    if (info.offset.x < -50) {
      onClose?.();
    }
  };

  const renderNavItems = (isCollapsed: boolean) => (
    <>
      <NavItem
        href="/settings"
        active={location === "/settings"}
        icon={<User className="h-4 w-4" />}
        collapsed={isCollapsed}
      >
        Profile
      </NavItem>
      <NavItem
        href="/settings/account"
        active={location === "/settings/account"}
        icon={<Settings className="h-4 w-4" />}
        collapsed={isCollapsed}
      >
        Account
      </NavItem>
      <NavItem
        href="/settings/appearance"
        active={location === "/settings/appearance"}
        icon={<Monitor className="h-4 w-4" />}
        collapsed={isCollapsed}
      >
        Appearance
      </NavItem>
      <NavItem
        href="/settings/rating-preferences"
        active={location === "/settings/rating-preferences"}
        icon={<Star className="h-4 w-4" />}
        collapsed={isCollapsed}
      >
        Rating Preferences
      </NavItem>
      <NavItem
        href="/settings/genre-preferences"
        active={location === "/settings/genre-preferences"}
        icon={<BookOpen className="h-4 w-4" />}
        collapsed={isCollapsed}
      >
        Genre Preferences
      </NavItem>
      <NavItem
        href="/settings/homepage"
        active={location === "/settings/homepage"}
        icon={<LayoutGrid className="h-4 w-4" />}
        collapsed={isCollapsed}
      >
        Homepage Layout
      </NavItem>
      <NavItem
        href="/settings/filters"
        active={location === "/settings/filters"}
        icon={<Filter className="h-4 w-4" />}
        collapsed={isCollapsed}
      >
        Content Filters
      </NavItem>
      <NavItem
        href="/settings/book-shelf"
        active={location === "/settings/book-shelf"}
        icon={<BookOpenCheck className="h-4 w-4" />}
        collapsed={isCollapsed}
      >
        Book Shelves
      </NavItem>
    </>
  );

  // For desktop, render a collapsible nav
  if (!isMobile) {
    return (
      <div className={cn(
        "border-r border-border h-full flex flex-col", 
        collapsed ? "w-12" : "w-60"
      )}>
        <div className="p-2 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="space-y-2 flex-1 px-1">
          {renderNavItems(collapsed)}
        </nav>
      </div>
    );
  }

  // For mobile, render a sidebar with animations and drag-to-close functionality
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar container with drag functionality */}
          <motion.div
            className="fixed inset-y-0 left-0 w-64 bg-background border-r z-50 md:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            <div className="h-full  overflow-y-auto pt-16 px-4">
              <div className="mb-4 flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="mb-2"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              <nav className="space-y-2">{renderNavItems(false)}</nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
