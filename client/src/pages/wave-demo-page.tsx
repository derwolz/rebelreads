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
          
          <div className="mt-32 max-w-3xl mx-auto backdrop-blur-md bg-black/30 rounded-xl p-8 text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Navigate Through the Storm</h2>
            <p className="mb-6">
              Our platform provides the stability and clarity you need to navigate the turbulent waters of digital advertising. 
              With advanced analytics and intelligent bidding tools, we help you chart a course to success.
            </p>
            <div className="text-center mt-8">
              <Link href="/">
                <Button variant="link" className="text-white hover:text-primary">
                  Back to Home Page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}