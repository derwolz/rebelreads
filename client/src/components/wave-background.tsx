import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WaveBackgroundProps {
  /**
   * Optional CSS class name to be applied to the background container
   */
  className?: string;
  
  /**
   * Whether to make the background fixed position
   * Default is true
   */
  fixed?: boolean;
}

/**
 * WaveBackground component creates an animated ocean wave effect using Three.js
 * with a dark stormy night sky above the waves and blue ocean below
 */
export function WaveBackground({
  className = "",
  fixed = true,
}: WaveBackgroundProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const positionClass = fixed ? "fixed" : "absolute";
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create the wave geometry
    const geometry = new THREE.PlaneGeometry(30, 30, 100, 100);
    
    // Create wave shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x0a1a2a) }, // Dark stormy blue
        uColor2: { value: new THREE.Color(0x0077be) }, // Deep blue ocean
        uStorminess: { value: 0.8 },
        uLightning: { value: 0.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uStorminess;
        
        varying vec2 vUv;
        varying float vElevation;
        
        // Simplex 3D noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          
          i = mod289(i);
          vec4 p = permute( permute( permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                  
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }
        
        void main() {
          vUv = uv;
          
          // Create wave patterns using multiple noise frequencies
          float wave1 = snoise(vec3(position.x * 0.2, position.y * 0.2, uTime * 0.5)) * 0.5;
          float wave2 = snoise(vec3(position.x * 0.4, position.y * 0.4, uTime * 0.3)) * 0.25;
          float wave3 = snoise(vec3(position.x * 0.8, position.y * 0.8, uTime * 0.2)) * 0.125;
          
          // Combine waves and adjust height based on storminess
          vElevation = (wave1 + wave2 + wave3) * uStorminess;
          
          // Set the vertex position with the wave height
          vec3 newPosition = position;
          newPosition.z += vElevation;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;  // Dark stormy blue
        uniform vec3 uColor2;  // Deep ocean blue
        uniform float uLightning;
        
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          // Add lightning effect as occasional bright flashes
          vec3 lightning = vec3(1.0, 1.0, 1.0) * uLightning;
          
          // Create a gradient based on elevation (waves higher = more stormy/dark)
          float mixFactor = smoothstep(-0.5, 0.5, vElevation);
          vec3 color = mix(uColor2, uColor1, mixFactor);
          
          // Mix in the lightning effect
          color = mix(color, lightning, uLightning * 0.7);
          
          // Add some foam to wave peaks
          if (vElevation > 0.3) {
            float foamFactor = smoothstep(0.3, 0.5, vElevation);
            color = mix(color, vec3(0.9, 0.95, 1.0), foamFactor * 0.6);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
    
    // Create the wave mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2.5; // Angle the surface slightly
    mesh.position.y = -2;
    scene.add(mesh);
    meshRef.current = mesh;
    
    // Add dark stormy sky - simple gradient background
    const skyGeometry = new THREE.PlaneGeometry(50, 30);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLightning: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uLightning;
        
        varying vec2 vUv;
        
        // Simple random function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
          // Dark stormy sky gradient
          vec3 skyColor1 = vec3(0.05, 0.05, 0.1);  // Almost black
          vec3 skyColor2 = vec3(0.1, 0.1, 0.2);    // Very dark blue
          vec3 cloudColor = vec3(0.2, 0.2, 0.25);  // Dark grey
          
          // Base sky gradient
          vec3 color = mix(skyColor1, skyColor2, vUv.y);
          
          // Add some cloud-like noise
          float noiseValue = random(vUv + uTime * 0.05);
          float cloudMask = smoothstep(0.5, 0.8, noiseValue);
          color = mix(color, cloudColor, cloudMask * 0.4);
          
          // Add occasional random lightning flashes
          float lightningBrightness = uLightning;
          color = mix(color, vec3(0.9, 0.9, 1.0), lightningBrightness);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.z = -15;
    sky.position.y = 5;
    scene.add(sky);
    
    // Create lightning effect
    let lightningTimer = 0;
    let lightningActive = false;
    
    // Window resize handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    let timeElapsed = 0;
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !meshRef.current) {
        return;
      }
      
      timeElapsed += 0.01;
      
      // Update time uniform for wave animation
      const waveMaterial = meshRef.current.material as THREE.ShaderMaterial;
      waveMaterial.uniforms.uTime.value = timeElapsed;
      
      // Handle lightning effect
      lightningTimer -= 0.02;
      
      if (!lightningActive && Math.random() < 0.005) {
        lightningActive = true;
        lightningTimer = Math.random() * 0.2 + 0.1; // Lightning duration
      }
      
      if (lightningActive) {
        // Flicker the lightning intensity
        const intensity = Math.max(0, Math.sin(timeElapsed * 30) * 0.5 + 0.5) * 0.8;
        waveMaterial.uniforms.uLightning.value = intensity;
        
        // Also update sky lightning
        (sky.material as THREE.ShaderMaterial).uniforms.uLightning.value = intensity;
        
        if (lightningTimer <= 0) {
          lightningActive = false;
          lightningTimer = Math.random() * 5 + 2; // Time until next lightning
          waveMaterial.uniforms.uLightning.value = 0;
          (sky.material as THREE.ShaderMaterial).uniforms.uLightning.value = 0;
        }
      }
      
      // Update sky time uniform
      (sky.material as THREE.ShaderMaterial).uniforms.uTime.value = timeElapsed;
      
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      return () => {
        cancelAnimationFrame(animationId);
      };
    };
    
    animate();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of Three.js resources
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        (meshRef.current.material as THREE.Material).dispose();
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className={`${positionClass} inset-0 overflow-hidden z-[-1] ${className}`}
    />
  );
}