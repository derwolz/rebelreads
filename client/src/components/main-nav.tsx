import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_GENRES } from "@shared/schema";

interface MainNavProps {
  onSearch?: (query: string, type: string) => void;
}

export function MainNav({ onSearch }: MainNavProps) {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/">
            <h1 className="text-2xl font-bold text-primary">BookNook</h1>
          </Link>

          <div className="hidden md:flex items-center gap-2 relative w-96">
            <Select
              defaultValue="title"
              onValueChange={(value) => onSearch?.("", value)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="genre">Genre</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                className="pl-9"
                onChange={(e) => onSearch?.(e.target.value, "title")}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">
                👤 <Link href="/dashboard"><span className="hover:underline">{user.username}</span></Link>
              </span>
              <Button
                variant="ghost"
                onClick={() => logoutMutation.mutate()}
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}