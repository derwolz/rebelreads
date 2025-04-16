import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LineChart, Flag, MessageSquare, User, Settings } from "lucide-react";
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
                  "w-full justify-center", 
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
        className={cn(
          "w-full justify-start gap-2", 
          active && "bg-secondary"
        )}
      >
        {icon}
        {children}
      </Button>
    </Link>
  );
}

interface ProDashboardSidebarProps {
  collapsed?: boolean;
}

export function ProDashboardSidebar({ collapsed = false }: ProDashboardSidebarProps) {
  const [location] = useLocation();

  return (
    <nav className={cn("space-y-2", collapsed ? "w-12" : "w-60")}>
      <NavItem
        href="/pro"
        active={location === "/pro"}
        icon={<LineChart className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Analytics
      </NavItem>
      <NavItem
        href="/pro/reviews"
        active={location === "/pro/reviews"}
        icon={<MessageSquare className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Review Management
      </NavItem>
      <NavItem
        href="/pro/action"
        active={location === "/pro/action"}
        icon={<Flag className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Take Action
      </NavItem>
      <NavItem
        href="/pro/book-management"
        active={location === "/pro/book-management"}
        icon={<User className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Book Management
      </NavItem>
      <NavItem
        href="/pro/author"
        active={location === "/pro/author"}
        icon={<Settings className="h-4 w-4" />}
        collapsed={collapsed}
      >
        Author Profile
      </NavItem>
    </nav>
  );
}
