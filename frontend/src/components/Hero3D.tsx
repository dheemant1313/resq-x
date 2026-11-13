import { useRef, useState, useEffect, Suspense, Component } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

// ----------------- 3D RESCUE HELICOPTER COMPONENT -----------------
function RescueHelicopter({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const mainRotorRef = useRef<THREE.Group>(null);
  const tailRotorRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (mainRotorRef.current) {
      mainRotorRef.current.rotation.y += delta * 25;
    }
    if (tailRotorRef.current) {
      tailRotorRef.current.rotation.x += delta * 30;
    }
  });

  return (
    <group position={position}>
      {/* Helicopter Main Body / Cabin */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.8, 2.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Emergency Orange Tactical Stripe */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.22, 0.2, 2.22]} />
        <meshStandardMaterial color="#ff5722" emissive="#ff5722" emissiveIntensity={0.3} />
      </mesh>

      {/* Cockpit Canopy Glass */}
      <mesh position={[0, 0.5, 0.9]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[1.0, 0.6, 0.8]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} transparent opacity={0.65} />
      </mesh>

      {/* Tail Boom */}
      <mesh position={[0, 0.5, -1.8]}>
        <boxGeometry args={[0.3, 0.3, 2.0]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} />
      </mesh>

      {/* Vertical Tail Fin */}
      <mesh position={[0, 0.9, -2.7]}>
        <boxGeometry args={[0.1, 0.8, 0.5]} />
        <meshStandardMaterial color="#ff5722" />
      </mesh>

      {/* Tail Rotor Hub & Blades */}
      <group position={[0.2, 1.0, -2.7]} ref={tailRotorRef}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.9, 0.08]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>

      {/* Main Rotor Mast */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>

      {/* Spinning Main Rotor Blades */}
      <group position={[0, 1.05, 0]} ref={mainRotorRef}>
        {/* Hub */}
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Blade 1 & 2 */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.15, 0.02, 4.4]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.6} />
        </mesh>
        {/* Blade 3 & 4 */}
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.15, 0.02, 4.4]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.6} />
        </mesh>
      </group>

      {/* Landing Skids Struts */}
      <mesh position={[-0.5, -0.1, 0.4]}>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0.5, -0.1, 0.4]}>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[-0.5, -0.1, -0.4]}>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0.5, -0.1, -0.4]}>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Landing Skids */}
      <mesh position={[-0.5, -0.3, 0]}>
        <boxGeometry args={[0.08, 0.06, 2.4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
      <mesh position={[0.5, -0.3, 0]}>
        <boxGeometry args={[0.08, 0.06, 2.4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>

      {/* Emergency Spotlight / Beacon */}
      <pointLight position={[0, -0.2, 0.8]} color="#ff5722" intensity={2.5} distance={10} />
    </group>
  );
}

// ----------------- TACTICAL RADAR BEACON TOWER -----------------
function BeaconTower({ position = [3, -1, -2] }: { position?: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      // Pulse emission
      lightRef.current.intensity = 1.5 + Math.sin(clock.getElapsedTime() * 4) * 1.2;
    }
  });

  return (
    <group position={position}>
      {/* Lattice Mast */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.4, 2.4, 6]} />
        <meshStandardMaterial color="#1e293b" wireframe />
      </mesh>
      {/* Beacon Head */}
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ff5722" emissive="#ff5722" emissiveIntensity={2} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 2.5, 0]} color="#ff5722" intensity={2} distance={8} />
    </group>
  );
}

// ----------------- DISASTER WAYPOINT PINS -----------------
function WaypointMarker({ position, label, color = "#06b6d4" }: { position: [number, number, number]; label: string; color?: string }) {
  return (
    <group position={position} name={label}>
      {/* Glowing Pin Head */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
      </mesh>
      {/* Needle Stem */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* Ground Ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.35, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ----------------- TACTICAL WIREFRAME TERRAIN -----------------
function TacticalTerrain() {
  return (
    <group position={[0, -1.8, 0]}>
      {/* Ground Elevation Grid */}
      <gridHelper args={[24, 24, "#ff5722", "#1e293b"]} position={[0, 0, 0]} />
      {/* Topographic Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#070a12" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}

// ----------------- 3D SCENE ROOT -----------------
function EmergencyScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} color="#f8fafc" />
      <pointLight position={[-6, 4, -4]} intensity={1.5} color="#06b6d4" />

      {/* Floating Tactical Helicopter */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.6}>
        <RescueHelicopter position={[-0.8, 0.4, 0.5]} />
      </Float>

      {/* Command Beacon & Relay Mast */}
      <BeaconTower position={[4.2, -1.8, -2.5]} />
      <BeaconTower position={[-4.5, -1.8, -3.2]} />

      {/* Disaster Relief Waypoints */}
      <WaypointMarker position={[2.5, -1.8, 1.8]} label="CAMP-ALPHA" color="#ff5722" />
      <WaypointMarker position={[-3.2, -1.8, 1.2]} label="DEPOT-HQ" color="#06b6d4" />
      <WaypointMarker position={[0.5, -1.8, -3.5]} label="TRANSIT-HUB" color="#10b981" />

      {/* Terrain Base */}
      <TacticalTerrain />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 3.5}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </>
  );
}

// ----------------- LIGHTWEIGHT 2D RADAR FALLBACK -----------------
export function Radar2DFallback() {
  return (
    <div className="w-full h-full min-h-[380px] bg-command-900/90 rounded-2xl border border-command-700 relative overflow-hidden flex items-center justify-center">
      {/* Radar Coordinate Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      {/* Concentric Radar Rings */}
      <div className="w-72 h-72 rounded-full border border-command-700/60 absolute animate-pulse" />
      <div className="w-52 h-52 rounded-full border border-emergency-orange/20 absolute" />
      <div className="w-32 h-32 rounded-full border border-cyan-500/20 absolute" />

      {/* Rotating Radar Sweep Line */}
      <div className="w-72 h-72 absolute rounded-full overflow-hidden pointer-events-none">
        <div className="w-1/2 h-1/2 absolute top-0 right-0 origin-bottom-left bg-gradient-to-tr from-emergency-orange/20 to-transparent animate-[spin_4s_linear_infinite]" />
      </div>

      {/* Central Command Beacon */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-2">
        <div className="w-4 h-4 rounded-full bg-emergency-orange animate-ping" />
        <div className="font-mono text-xs text-emergency-orange font-bold tracking-widest uppercase">
          RADAR TELEMETRY VECTOR ACTIVE
        </div>
        <p className="text-xs text-slate-400 max-w-xs font-mono">
          Sector Alpha: 19.1663° N, 72.8526° E | Convoy Readiness: 100%
        </p>
      </div>

      {/* Simulated Waypoint Blips */}
      <div className="absolute top-1/4 left-1/4 flex items-center space-x-1.5 font-mono text-[10px] text-cyan-400">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <span>[DEPOT-CENTRAL]</span>
      </div>
      <div className="absolute bottom-1/3 right-1/4 flex items-center space-x-1.5 font-mono text-[10px] text-emergency-orange">
        <span className="w-2 h-2 rounded-full bg-emergency-orange" />
        <span>[RC-ALPHA: FLOOD ZONE]</span>
      </div>
    </div>
  );
}

// ----------------- ERROR BOUNDARY FOR 3D CANVAS -----------------
class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("WebGL / Three.js context warning, using 2D fallback:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ----------------- EXPORTED HERO 3D CONTAINER -----------------
export default function Hero3D() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  useEffect(() => {
    // Check reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Check basic WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLAvailable(false);
      }
    } catch {
      setWebGLAvailable(false);
    }
  }, []);

  if (prefersReducedMotion || !webGLAvailable) {
    return <Radar2DFallback />;
  }

  return (
    <CanvasErrorBoundary fallback={<Radar2DFallback />}>
      <div className="w-full h-[480px] lg:h-[540px] rounded-2xl overflow-hidden border border-command-700 glass-panel relative">
        <Suspense fallback={<Radar2DFallback />}>
          <Canvas
            camera={{ position: [0, 3, 7.5], fov: 45 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          >
            <EmergencyScene />
          </Canvas>
        </Suspense>

        {/* Tactical HUD Overlay Metadata */}
        <div className="absolute top-4 left-4 pointer-events-none font-mono text-[10px] text-slate-400 space-y-1 bg-command-950/70 p-2.5 rounded border border-command-700/60 backdrop-blur-xs">
          <div className="text-emergency-orange font-bold">TACTICAL AIR SPACE TELEMETRY</div>
          <div>OBJECT: NDRF AIR-RECON RESCUE-01</div>
          <div>STATUS: AIRBORNE / PATROL</div>
          <div>ALTITUDE: 450m AGL | VECTOR: 042°</div>
        </div>

        <div className="absolute bottom-4 right-4 pointer-events-none font-mono text-[10px] text-slate-400 bg-command-950/70 px-3 py-1.5 rounded border border-command-700/60 backdrop-blur-xs flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>INTERACTIVE 3D SCENE (DRAG TO ROTATE)</span>
        </div>
      </div>
    </CanvasErrorBoundary>
  );
}
