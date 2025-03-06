import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { useLocation } from "wouter";

export function MainNav() {
  const { user, isLoading, logout } = useAuth();
  const [_, navigate] = useLocation();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a href="/" className="font-bold text-xl flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M8 7h6" />
              <path d="M8 11h8" />
              <path d="M8 15h6" />
            </svg>
            Booktopia
          </a>
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Home
            </a>
            <a
              href="/books"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Books
            </a>
            <a
              href="/genres"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Genres
            </a>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-9 w-20 bg-muted rounded animate-pulse"></div>
          ) : user ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate({ to: "/dashboard" })}
              >
                Dashboard
              </Button>
              {user.isAuthor && (
                <Button
                  variant="ghost"
                  onClick={() => navigate({ to: "/pro" })}
                  className="text-primary"
                >
                  Pro Dashboard
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => navigate({ to: "/settings" })}
              >
                Settings
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate({ to: "/login" })}
              >
                Login
              </Button>
              <Button
                variant="default"
                onClick={() => navigate({ to: "/register" })}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}