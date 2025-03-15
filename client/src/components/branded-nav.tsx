import { Link } from "wouter";

export function BrandedNav() {
  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">Sirened</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/how-it-works" className="text-foreground/80 hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="/partner" className="text-foreground/80 hover:text-foreground transition-colors">
              Partner With Us
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
