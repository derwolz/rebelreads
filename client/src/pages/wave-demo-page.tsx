import { BrandedNav } from "@/components/branded-nav";
import { WaveBackground } from "@/components/wave-background";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function WaveDemoPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* The wave background takes up the full screen */}
      <WaveBackground />
      
      {/* Content on top of the background */}
      <div className="relative z-10">
        <BrandedNav />
        
        <div className="container mx-auto px-4 pt-20 pb-32">
          {/* Top section - visible in the sky portion */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
              Riding the Wave of Innovation
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 drop-shadow-md">
              Experience our cutting-edge ad campaign management platform against the stormy seas of digital advertising.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg">
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Bottom section - position in the water portion with underwater effect */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900/90 to-blue-900/0 py-24">
            <div className="max-w-3xl mx-auto backdrop-blur-sm bg-blue-900/30 rounded-xl p-8 text-white shadow-xl m-4">
              <h2 className="text-2xl font-bold mb-4">Dive Deeper Into Success</h2>
              <p className="mb-6">
                Immerse yourself in a world of data-driven advertising insights. Our platform provides the stability 
                and clarity you need to navigate the turbulent waters of digital marketing.
              </p>
              <p className="mb-6">
                With advanced analytics and intelligent bidding tools, we help you discover hidden 
                opportunities beneath the surface.
              </p>
              <div className="text-center mt-8">
                <Link href="/">
                  <Button variant="link" className="text-blue-100 hover:text-blue-200">
                    Back to Home Page
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Underwater bubbles effect */}
            <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden opacity-30">
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute bottom-0 rounded-full bg-blue-100 animate-bubble"
                  style={{
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 12 + 4}px`,
                    height: `${Math.random() * 12 + 4}px`,
                    animationDuration: `${Math.random() * 4 + 3}s`,
                    animationDelay: `${Math.random() * 5}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}