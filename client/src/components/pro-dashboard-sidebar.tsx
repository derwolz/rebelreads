import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LineChart, Flag, MessageSquare, Settings } from "lucide-react";

interface NavItemProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
}

function NavItem({ href, active, children, icon }: NavItemProps) {
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

export function ProDashboardSidebar() {
  const [location] = useLocation();

  return (
    <nav className="space-y-2 w-60">
      <NavItem
        href="/pro"
        active={location === "/pro"}
        icon={<LineChart className="h-4 w-4" />}
      >
        Analytics
      </NavItem>
      <NavItem
        href="/pro/reviews"
        active={location === "/pro/reviews"}
        icon={<MessageSquare className="h-4 w-4" />}
      >
        Review Management
      </NavItem>
      <NavItem
        href="/pro/reports"
        active={location === "/pro/reports"}
        icon={<Flag className="h-4 w-4" />}
      >
        Take Action
      </NavItem>
      <NavItem
        href="/pro/settings"
        active={location === "/pro/settings"}
        icon={<Settings className="h-4 w-4" />}
      >
        Settings
      </NavItem>
    </nav>
  );
}
