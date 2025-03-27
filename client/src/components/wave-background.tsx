import { useEffect, useRef, useState } from 'react';
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
  
  /**
   * Enable scroll-based camera movement
   * Default is false
   */
  scrollEnabled?: boolean;
}

/**
 * WaveBackground component creates an animated ocean wave effect using Three.js
 * with the camera position adjustable via scrolling
 */
export function WaveBackground({
  className = "",
  fixed = true,
  scrollEnabled = false,
}: WaveBackgroundProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const underwaterMeshRef = useRef<THREE.Mesh | null>(null);
  const seabedMeshRef = useRef<THREE.Mesh | null>(null);
  const positionClass = fixed ? "fixed" : "absolute";
  const [initialCameraY] = useState(8); // Start above water
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera - position initially above water level
    const camera = new THREE.PerspectiveCamera(
      70, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    // Start with camera above water looking down at an angle
    camera.position.set(0, initialCameraY, 12);
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
    
    // Create the water surface geometry
    // Use higher subdivision for smoother waves
    const waterGeometry = new THREE.PlaneGeometry(125,200, 512, 512);
    
    // Create water surface shader material
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x0a1a2a) }, // Dark stormy blue (surface)
        uColor2: { value: new THREE.Color(0x0066aa) }, // Medium blue (wave troughs)
        uStorminess: { value: 0.7 },
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
          float wave1 = snoise(vec3(position.x * 0.1, position.y * 0.1, uTime * 0.3)) * 0.5;
          float wave2 = snoise(vec3(position.x * 0.3, position.y * 0.3, uTime * 0.2)) * 0.25;
          float wave3 = snoise(vec3(position.x * 0.6, position.y * 0.6, uTime * 0.1)) * 0.125;
          
          // Combine waves and adjust height based on storminess
          vElevation = (wave1 + wave2 + wave3) * uStorminess;
          
          // Set the vertex position with the wave height
          vec3 newPosition = position;
          newPosition.z = vElevation;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;  // Dark stormy blue
        uniform vec3 uColor2;  // Medium blue
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
          if (vElevation > 0.25) {
            float foamFactor = smoothstep(0.25, 0.4, vElevation);
            color = mix(color, vec3(0.9, 0.95, 1.0), foamFactor * 0.2);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
    
    // Create the water surface mesh
    const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2; // Make the plane horizontal
    waterMesh.position.y = 0; // At water level
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;
    
    // Create underwater volume with deep blue color
    const underwaterGeometry = new THREE.BoxGeometry(200, 40, 200);
    const underwaterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDepthColor: { value: new THREE.Color(0x0033aa) }, // Deep blue
        uSurfaceColor: { value: new THREE.Color(0x0066aa) }, // Medium blue near surface
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDepth;
        
        void main() {
          vUv = uv;
          vDepth = position.y; // Pass y position for depth calculation
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uDepthColor;
        uniform vec3 uSurfaceColor;
        
        varying vec2 vUv;
        varying float vDepth;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
          // Calculate depth gradient (deeper = darker)
          float depthFactor = smoothstep(-40.0, 0.0, vDepth);
          vec3 color = mix(uDepthColor, uSurfaceColor, depthFactor);
          
          // Add some caustics near the surface
          if (vDepth > -8.0) {
            float causticIntensity = random(vUv + uTime * 0.05) * 0.1;
            float causticPattern = sin(vUv.x * 20.0 + uTime) * sin(vUv.y * 20.0 + uTime * 1.3) * 0.5 + 0.5;
            causticPattern *= smoothstep(-8.0, -1.0, vDepth); // Stronger near surface
            color += vec3(0.2, 0.3, 0.4) * causticPattern * causticIntensity;
          }
          
          // Add dusty particles in the water
          float dustSpeck = step(0.997, random(vUv * 100.0 + uTime * 0.01));
          color += vec3(0.4, 0.5, 0.6) * dustSpeck * 0.1;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const underwaterMesh = new THREE.Mesh(underwaterGeometry, underwaterMaterial);
    underwaterMesh.position.y = -20; // Position below the water surface
    scene.add(underwaterMesh);
    underwaterMeshRef.current = underwaterMesh;
    
    // Create seabed at the bottom
    // Use higher subdivision for smoother seabed terrain
    const seabedGeometry = new THREE.PlaneGeometry(200, 200, 128, 128);
    const seabedMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSandColor: { value: new THREE.Color(0xe6a75f) }, // Sandy orange color
        uRockColor: { value: new THREE.Color(0xc6824a) }, // Darker orange-brown rock
      },
      vertexShader: `
        uniform float uTime;
        
        varying vec2 vUv;
        varying float vElevation;
        
        // Simplex 3D noise function (simplified version)
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        // Simple noise function for seabed terrain
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        void main() {
          vUv = uv;
          
          // Create seabed terrain with multiple noise layers
          float n1 = noise(vec2(position.x * 0.05, position.y * 0.05)) * 0.8;
          float n2 = noise(vec2(position.x * 0.15, position.y * 0.15)) * 0.2;
          float n3 = noise(vec2(position.x * 0.4, position.y * 0.4)) * 0.1;
          
          // Combine for varied terrain
          vElevation = n1 + n2 + n3;
          
          // Set the vertex position with the terrain height
          vec3 newPosition = position;
          newPosition.z = vElevation * 3.0; // Scale height for more pronounced effect
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSandColor;
        uniform vec3 uRockColor;
        
        varying vec2 vUv;
        varying float vElevation;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
          // Mix sand and rock based on elevation
          float rockFactor = smoothstep(0.2, 0.7, vElevation);
          vec3 baseColor = mix(uSandColor, uRockColor, rockFactor);
          
          // Add some variation with noise
          float noiseValue = random(vUv * 50.0) * 0.1;
          vec3 color = baseColor + vec3(noiseValue);
          
          // Add small particles to simulate seabed detritus
          float detritusAmount = step(0.993, random(vUv * 500.0 + uTime * 0.01));
          color += vec3(0.3, 0.25, 0.15) * detritusAmount;
          
          // Add some marine algae/plant-like highlights
          float plantHighlight = step(0.97, random(vUv * 20.0));
          if (plantHighlight > 0.5 && vElevation < 0.4) {
            vec3 plantColor = vec3(0.1, 0.4, 0.1); // Brighter green algae
            color = mix(color, plantColor, 0.3);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
    
    const seabedMesh = new THREE.Mesh(seabedGeometry, seabedMaterial);
    seabedMesh.rotation.x = -Math.PI / 2; // Make it horizontal
    seabedMesh.position.y = -40; // Position at the bottom
    scene.add(seabedMesh);
    seabedMeshRef.current = seabedMesh;
    
    // Create a skybox using cube textures
    // Use gradient colors instead of images for a clean look
    const createGradientTexture = (color1: string, color2: string, size = 512) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      
      // Fill with gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      
      return new THREE.CanvasTexture(canvas);
    };
    
    // Create textures for each side of the skybox
    // Top: dark blue
    const topTexture = createGradientTexture('#0a0e1a', '#131b36');
    
    // Bottom: not visible (underwater)
    const bottomTexture = createGradientTexture('#050a14', '#050a14');
    
    // Sides: gradient from horizon to higher
    const sideTexture = createGradientTexture('#050a14', '#131b36');
    
    // Create materials for each face
    const skyboxMaterials = [
      new THREE.MeshBasicMaterial({ map: sideTexture, side: THREE.BackSide }), // right
      new THREE.MeshBasicMaterial({ map: sideTexture, side: THREE.BackSide }), // left
      new THREE.MeshBasicMaterial({ map: topTexture, side: THREE.BackSide }),  // top
      new THREE.MeshBasicMaterial({ map: bottomTexture, side: THREE.BackSide }), // bottom
      new THREE.MeshBasicMaterial({ map: sideTexture, side: THREE.BackSide }), // front
      new THREE.MeshBasicMaterial({ map: sideTexture, side: THREE.BackSide })  // back
    ];
    
    // Create a skybox
    const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
    scene.add(skybox);
    
    // Stars in the sky
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false
    });
    
    // Create random stars
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      // Place stars only in the upper hemisphere
      const theta = Math.random() * Math.PI; // 0 to PI (only upper hemisphere)
      const phi = Math.random() * 2 * Math.PI; // 0 to 2PI
      
      // Convert to Cartesian coordinates (radius 245 - just inside the skybox)
      const radius = 245;
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = Math.abs(radius * Math.cos(theta)); // Make y positive (upper hemisphere)
      const z = radius * Math.sin(theta) * Math.sin(phi);
      
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    // Lightning flash effect
    const lightningSphere = new THREE.Mesh(
      new THREE.SphereGeometry(240, 32, 32),
      new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0,
        side: THREE.BackSide 
      })
    );
    scene.add(lightningSphere);
    
    // Create lightning effect
    let lightningTimer = 0;
    let lightningActive = false;
    
    // Handle scrolling to move camera up/down
    const handleScroll = () => {
      if (!scrollEnabled || !cameraRef.current) return;
      
      // Get scroll position
      const scrollY = window.scrollY;
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const scrollProgress = Math.min(1, scrollY / totalHeight);
      
      // Calculate camera position based on scroll
      // Start above water (initialCameraY), end at bottom of ocean (-38)
      const targetY = initialCameraY - (scrollProgress * (initialCameraY + 38));
      
      // Smoothly update camera position
      cameraRef.current.position.y = targetY;
      
      // Adjust camera angle based on depth
      if (targetY > 0) {
        // Above water, look down at water
        cameraRef.current.lookAt(0, -5, 0);
      } else if (targetY > -35) {
        // In water, look slightly downward
        cameraRef.current.lookAt(0, targetY - 10, 0);
      } else {
        // Near bottom, look at seabed
        cameraRef.current.lookAt(0, -40, 0);
      }
    };
    
    // Window resize handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    if (scrollEnabled) {
      window.addEventListener('scroll', handleScroll);
      // Initial camera position based on scroll
      handleScroll();
    }
    
    // Animation loop
    let timeElapsed = 0;
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || 
          !waterMeshRef.current || !underwaterMeshRef.current || !seabedMeshRef.current) {
        return;
      }
      
      timeElapsed += 0.01;
      
      // Small bobbing motion for the camera to simulate floating on water
      // Only apply this when camera is near the surface
      if (cameraRef.current.position.y > -2 && cameraRef.current.position.y < 2) {
        cameraRef.current.position.y += Math.sin(timeElapsed * 0.5) * 0.01;
        // Gently rock the camera for more realism
        cameraRef.current.rotation.z = Math.sin(timeElapsed * 0.3) * 0.01;
      } else {
        cameraRef.current.rotation.z = 0;
      }
      
      // Update time uniform for water animation
      const waterMaterial = waterMeshRef.current.material as THREE.ShaderMaterial;
      waterMaterial.uniforms.uTime.value = timeElapsed;
      
      // Update underwater material
      const underwaterMaterial = underwaterMeshRef.current.material as THREE.ShaderMaterial;
      underwaterMaterial.uniforms.uTime.value = timeElapsed;
      
      // Update seabed material
      const seabedMaterial = seabedMeshRef.current.material as THREE.ShaderMaterial;
      seabedMaterial.uniforms.uTime.value = timeElapsed;
      
      // Handle lightning effect
      lightningTimer -= 0.02;
      
      if (!lightningActive && Math.random() < 0.003) {
        lightningActive = true;
        lightningTimer = Math.random() * 0.2 + 0.1; // Lightning duration
      }
      
      if (lightningActive) {
        // Flicker the lightning intensity
        const intensity = Math.max(0, Math.sin(timeElapsed * 30) * 0.5 + 0.5) * 0.8;
        waterMaterial.uniforms.uLightning.value = intensity;
        
        // Update lightning sphere for the skybox
        (lightningSphere.material as THREE.MeshBasicMaterial).opacity = intensity * 0.3;
        
        if (lightningTimer <= 0) {
          lightningActive = false;
          lightningTimer = Math.random() * 5 + 2; // Time until next lightning
          waterMaterial.uniforms.uLightning.value = 0;
          (lightningSphere.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }
      
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    
    animate();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollEnabled) {
        window.removeEventListener('scroll', handleScroll);
      }
      
      if (rendererRef.current && rendererRef.current.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of Three.js resources
      if (waterMeshRef.current) {
        waterMeshRef.current.geometry.dispose();
        (waterMeshRef.current.material as THREE.Material).dispose();
      }
      if (underwaterMeshRef.current) {
        underwaterMeshRef.current.geometry.dispose();
        (underwaterMeshRef.current.material as THREE.Material).dispose();
      }
      if (seabedMeshRef.current) {
        seabedMeshRef.current.geometry.dispose();
        (seabedMeshRef.current.material as THREE.Material).dispose();
      }
    };
  }, [initialCameraY, scrollEnabled]);
  
  return (
    <div 
      ref={containerRef} 
      className={`${positionClass} inset-0 overflow-hidden z-[-1] ${className}`}
    />
  );
}