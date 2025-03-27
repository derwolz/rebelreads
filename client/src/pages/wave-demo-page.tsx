import React from 'react';
import { WaveBackground } from '../components/wave-background';

export function WaveDemoPage() {
  return (
    <div className="relative min-h-screen">
      {/* Ocean wave background with bump mapping and reflections */}
      <WaveBackground scrollEnabled={true} />
      
      {/* Content overlay */}
      <div className="relative z-10 container mx-auto px-4 py-16 text-white">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-8 text-center">
            Ocean Waves Simulation
          </h1>
          
          <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Enhanced with Realistic Effects
            </h2>
            <p className="text-xl mb-4">
              This ocean wave effect features several realistic enhancements:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Bump mapping for detailed wave surface textures</li>
              <li>Realistic water reflections (with moon reflection)</li>
              <li>Dynamic wave animations with varying frequencies</li>
              <li>Foam effects on wave crests</li>
              <li>Occasional lightning flashes in stormy conditions</li>
            </ul>
            <p>
              Scroll down to dive beneath the surface and explore the underwater environment.
            </p>
          </div>
          
          {/* Add enough spacing to allow scrolling for the underwater effect */}
          <div className="h-[200vh]">
            <div className="h-[50vh] flex items-center justify-center">
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl max-w-xl text-center">
                <h3 className="text-2xl font-bold mb-2">Diving Deeper</h3>
                <p>
                  As you dive beneath the surface, notice the caustic light effects 
                  and changing color gradients.
                </p>
              </div>
            </div>
            
            <div className="h-[50vh] flex items-center justify-center">
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl max-w-xl text-center">
                <h3 className="text-2xl font-bold mb-2">Ocean Floor</h3>
                <p>
                  Continue scrolling to reach the seabed with its sandy terrain 
                  and scattered plant life.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaveDemoPage;