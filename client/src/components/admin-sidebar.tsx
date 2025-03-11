import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  Settings, 
  BarChart3,
  FileSpreadsheet
} from "lucide-react";

export function AdminSidebar() {
  const [location] = useLocation();

  const links = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: BarChart3,
    },
    {
      href: "/admin/books",
      label: "Books",
      icon: BookOpen,
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Admin Panel</h2>
        <div className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Button
                key={link.href}
                variant={location === link.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={link.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
