import { BrandedNav } from "@/components/branded-nav";
import { WaveBackground } from "@/components/wave-background";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect, useRef } from "react";

export default function WaveDemoPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Set the page to be 3x viewport height to allow for scrolling
    if (pageRef.current) {
      pageRef.current.style.minHeight = "300vh";
    }
  }, []);
  
  return (
    <div ref={pageRef} className="relative overflow-hidden">
      {/* Fixed navigation at the top */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <BrandedNav />
      </div>
      
      {/* The wave background takes up the full screen and responds to scrolling */}
      <WaveBackground fixed={true} scrollEnabled={true} />
      
      {/* Content sections positioned at different heights */}
      <div className="relative z-10">
        {/* SKY SECTION - Top of the page (above water) */}
        <section className="h-screen flex items-center relative">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
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
              
              <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce">
                <div className="text-white text-center">
                  <p className="mb-2">Scroll to Dive Below</p>
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
                    className="mx-auto"
                  >
                    <path d="M12 5v14"></path>
                    <path d="m19 12-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* WATER SURFACE SECTION - Middle of the page (water transition) */}
        <section className="h-screen flex items-center justify-center relative">
          <div className="container mx-auto px-4 pointer-events-none">
            <div className="max-w-xl mx-auto text-center backdrop-blur-sm bg-blue-600/20 rounded-xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-6">Breaking Through the Surface</h2>
              <p className="text-lg mb-4">
                As you dive beneath the waves, discover a whole new world of strategic insights and opportunities.
              </p>
              <p className="text-lg">
                Our platform reveals what lies beneath the surface of your advertising campaigns.
              </p>
            </div>
            
            {/* Bubbles at the water surface transition */}
            <div className="absolute left-0 right-0 h-24 overflow-hidden opacity-60">
              {Array.from({ length: 30 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute rounded-full bg-blue-100 animate-bubble"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 12 + 4}px`,
                    height: `${Math.random() * 12 + 4}px`,
                    animationDuration: `${Math.random() * 4 + 3}s`,
                    animationDelay: `${Math.random() * 5}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* DEEP OCEAN SECTION - Bottom of the page (seabed) */}
        <section className="h-screen flex items-end justify-center pb-16 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto backdrop-blur-sm bg-blue-950/40 rounded-xl p-8 text-white shadow-xl border border-blue-900/30">
              <h2 className="text-3xl font-bold mb-4">Explore the Depths</h2>
              <p className="mb-6">
                At the ocean floor of digital marketing lies untapped potential. Our platform provides the visibility and tools 
                to discover valuable insights hidden in the deepest data.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-900/30 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Deep Analytics</h3>
                  <p>Comprehensive data analysis that reveals patterns invisible on the surface.</p>
                </div>
                <div className="bg-blue-900/30 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Smart Bidding</h3>
                  <p>AI-powered optimization that adapts to changing market currents.</p>
                </div>
                <div className="bg-blue-900/30 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Campaign Clarity</h3>
                  <p>Clear visibility into performance across all your marketing initiatives.</p>
                </div>
              </div>
              <div className="text-center mt-8">
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Surface to Home Page
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Ocean floor decorative elements */}
            <div className="absolute bottom-0 left-0 right-0 h-12">
              {/* Seaweed and coral decorations */}
              <div className="absolute bottom-0 left-1/4 w-6 h-20 bg-green-900/60 rounded-t-full animate-pulse" 
                   style={{animationDuration: '6s'}}></div>
              <div className="absolute bottom-0 left-1/4 ml-8 w-4 h-14 bg-green-800/60 rounded-t-full animate-pulse"
                   style={{animationDuration: '7s'}}></div>
              <div className="absolute bottom-0 left-3/4 w-8 h-16 bg-green-900/70 rounded-t-full animate-pulse"
                   style={{animationDuration: '5s'}}></div>
              
              {/* Rocks */}
              <div className="absolute bottom-0 left-[20%] w-16 h-8 bg-gray-800/70 rounded-t-lg"></div>
              <div className="absolute bottom-0 right-1/4 w-20 h-12 bg-gray-900/70 rounded-t-lg"></div>
              
              {/* Coral */}
              <div className="absolute bottom-0 right-1/3 w-12 h-10 bg-red-900/60 rounded-t-lg"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}