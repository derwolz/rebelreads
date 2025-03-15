import { Link } from "wouter";
import { useState } from "react";
export function BrandedNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <nav className="bg-background border-b block fixed w-screen h-16 z-10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">Sirened</span>
            </Link>
          </div>

          <div className="md:hidden">
            <button
              className="text-foreground/80 hover:text-foreground transition-colors focus:outline-none"
              aria-label="Toggle menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              ☰
            </button>
          </div>
          <div
            className={`hidden md:flex items-center space-x-8 ${isMenuOpen ? "block" : "hidden"}`}
          >
            <Link
              href="/how-it-works"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/partner"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Partner With Us
            </Link>
            <Link
              href="/landing"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Landing Page
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
