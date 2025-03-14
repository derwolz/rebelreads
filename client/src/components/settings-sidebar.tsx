import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { User, Settings, Monitor } from "lucide-react";

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

export function SettingsSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <nav className="space-y-2 w-60">
      <NavItem
        href="/settings"
        active={location === "/settings"}
        icon={<User className="h-4 w-4" />}
      >
        Profile
      </NavItem>
      <NavItem
        href="/settings/account"
        active={location === "/settings/account"}
        icon={<Settings className="h-4 w-4" />}
      >
        Account
      </NavItem>
      <NavItem
        href="/settings/appearance"
        active={location === "/settings/appearance"}
        icon={<Monitor className="h-4 w-4" />}
      >
        Appearance
      </NavItem>
    </nav>
  );
}