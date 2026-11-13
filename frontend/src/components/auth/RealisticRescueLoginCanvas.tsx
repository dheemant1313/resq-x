import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RealisticRescueLoginCanvasProps {
  torchOn: boolean;
  torchIntensity: number;
  heloPhase: 'approaching' | 'hovering' | 'leaving';
  heloProgress: number; // 0 to 1
}

// ----------------- SUBMERGED SURVIVOR IN FLOOD WATER -----------------
function DrenchedSurvivorInWater({
  torchOn,
  torchIntensity,
}: {
  torchOn: boolean;
  torchIntensity: number;
}) {
  const rippleRef1 = useRef<THREE.Mesh>(null);
  const rippleRef2 = useRef<THREE.Mesh>(null);
  const armRef = useRef<THREE.Group>(null);
  const torchTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const beamConeRef = useRef<THREE.Mesh>(null);

  // Position person on the left side of the screen, waist-deep in water
  const personBase: [number, number, number] = [-4.6, -0.45, 1.8];

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // 1. Water ripple expansion around the person's submerged torso
    if (rippleRef1.current) {
      const s1 = 1.0 + ((t * 0.8) % 2.0) * 1.2;
      rippleRef1.current.scale.set(s1, s1, 1);
      const mat = rippleRef1.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.45 - (s1 - 1.0) * 0.2);
    }
    if (rippleRef2.current) {
      const s2 = 1.0 + (((t * 0.8) + 1.0) % 2.0) * 1.2;
      rippleRef2.current.scale.set(s2, s2, 1);
      const mat = rippleRef2.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.45 - (s2 - 1.0) * 0.2);
    }

    // 2. Slight floating bobbing in the water current
    if (armRef.current) {
      armRef.current.position.y = Math.sin(t * 1.4) * 0.03;
    }

    // 3. Torch beam target pointing from left to right end of screen
    if (spotLightRef.current && torchTargetRef.current) {
      // Point directly across to the right side where login card is located: [5.2, 1.4, -0.5]
      torchTargetRef.current.position.set(5.2, 1.4 + Math.sin(t * 0.8) * 0.08, -0.5);
      spotLightRef.current.target = torchTargetRef.current;
    }

    // 4. Volumetric cone scale
    if (beamConeRef.current) {
      const s = Math.max(0.001, torchIntensity);
      beamConeRef.current.scale.set(s, 1, s);
    }
  });

  return (
    <group position={personBase}>
      {/* ----------------- EXPANDING WATER SURFACE RIPPLES ----------------- */}
      <mesh
        ref={rippleRef1}
        position={[0, 0.48, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.5, 0.65, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        ref={rippleRef2}
        position={[0, 0.48, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.6, 0.78, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Wooden Refuge Plank / Debris Person Clings To */}
      <mesh position={[-0.4, 0.44, 0.2]} rotation={[0.05, 0.2, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.12, 0.8]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      {/* Floating Yellow Warning Drum */}
      <mesh position={[-1.2, 0.45, -0.4]} rotation={[0.4, 0.2, 0.8]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.8, 16]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>

      {/* ----------------- SUBMERGED HUMAN BODY ----------------- */}
      {/* Lower Waist (partially under flood water) */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.2, 0.5, 12]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>

      {/* Torso / Soaked Dark Rain Jacket */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.56, 0.7, 0.36]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* High-Visibility Emergency Orange Life Vest (Drenched in water) */}
      <mesh position={[0, 0.85, 0.02]} castShadow>
        <boxGeometry args={[0.6, 0.52, 0.4]} />
        <meshStandardMaterial color="#ea580c" roughness={0.3} />
      </mesh>
      {/* Reflective vest tape */}
      <mesh position={[0, 0.95, 0.23]}>
        <boxGeometry args={[0.52, 0.08, 0.02]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.1} emissive="#f8fafc" emissiveIntensity={0.3} />
      </mesh>

      {/* Head with Hood (Dripping wet) */}
      <mesh position={[0, 1.36, 0.02]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} />
      </mesh>
      {/* Face Looking Right towards camera & horizon */}
      <mesh position={[0.06, 1.34, 0.12]} rotation={[0, 0.4, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>

      {/* Left Arm: Resting on floating debris plank */}
      <group position={[-0.32, 1.05, 0]}>
        <mesh position={[-0.15, -0.3, 0.15]} rotation={[0.4, 0, 0.5]}>
          <cylinderGeometry args={[0.08, 0.07, 0.55, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Left hand gripping wood */}
        <mesh position={[-0.26, -0.52, 0.28]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>

      {/* ----------------- RIGHT ARM HOLDING HANDHELD TORCH ----------------- */}
      {/* Raised and extended forward-right, pointing torch from LEFT to RIGHT end */}
      <group ref={armRef} position={[0.32, 1.08, 0]}>
        {/* Upper Arm angled right */}
        <mesh position={[0.2, -0.05, 0.12]} rotation={[-0.3, -0.4, -0.7]}>
          <cylinderGeometry args={[0.085, 0.075, 0.48, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Forearm angled forward pointing right */}
        <group position={[0.38, -0.15, 0.25]} rotation={[-0.1, 0.7, -0.1]}>
          <mesh position={[0.18, 0.05, 0.15]} rotation={[0.1, 0.8, -0.1]}>
            <cylinderGeometry args={[0.075, 0.065, 0.46, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>

          {/* Gloved Hand gripping torch */}
          <mesh position={[0.38, 0.08, 0.32]}>
            <sphereGeometry args={[0.085, 8, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>

          {/* ============================================================== */}
          {/* THE HANDHELD TORCH — BEAMING FROM LEFT TO RIGHT END            */}
          {/* ============================================================== */}
          <group position={[0.42, 0.09, 0.36]} rotation={[-0.1, 1.15, -0.05]}>
            {/* Torch Cylindrical Barrel */}
            <mesh position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Rubberized knurled orange safety grip */}
            <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.053, 0.053, 0.14, 16]} />
              <meshStandardMaterial color="#ff5722" roughness={0.6} />
            </mesh>
            {/* Flared Head Bezel */}
            <mesh position={[0, 0, 0.1]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
              <coneGeometry args={[0.095, 0.14, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.9} />
            </mesh>

            {/* Front Glass Lens */}
            <mesh position={[0, 0, 0.18]}>
              <circleGeometry args={[0.09, 16]} />
              {torchOn ? (
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
              ) : (
                <meshStandardMaterial color="#334155" roughness={0.2} />
              )}
            </mesh>

            {/* ----------------- VOLUMETRIC TORCH BEAM (LEFT TO RIGHT) ----------------- */}
            {torchOn && (
              <group position={[0, 0, 0.2]}>
                {/* Local lens glow on person */}
                <pointLight
                  color="#fffbeb"
                  intensity={4.0 * torchIntensity}
                  distance={6}
                />

                {/* Primary High-Intensity Directional Spotlight Sweeping to Right */}
                <spotLight
                  ref={spotLightRef}
                  position={[0, 0, 0]}
                  color="#fffbeb"
                  intensity={18.0 * torchIntensity}
                  distance={85}
                  angle={Math.PI / 5.2}
                  penumbra={0.25}
                  castShadow
                />

                {/* Volumetric Beam Cone traversing all the way to right side */}
                <mesh
                  ref={beamConeRef}
                  position={[0, 0, 9]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[3.2, 0.12, 18, 24, 1, true]} />
                  <meshBasicMaterial
                    color="#fffbeb"
                    transparent
                    opacity={Math.min(0.55, torchIntensity * 0.22)}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                  />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>

      <primitive object={torchTargetRef.current} />
    </group>
  );
}

// ----------------- RESCUE HELICOPTER (APPROACHES & LEAVES IN BACKGROUND) -----------------
function BackgroundRescueHelicopter({
  phase,
  progress,
}: {
  phase: 'approaching' | 'hovering' | 'leaving';
  progress: number;
}) {
  const heloGroupRef = useRef<THREE.Group>(null);
  const mainRotorRef = useRef<THREE.Group>(null);
  const tailRotorRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);
  const searchlightRef = useRef<THREE.SpotLight>(null);
  const searchlightTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  useFrame((state, delta) => {
    // 1. High RPM Rotor Spin
    if (mainRotorRef.current) {
      mainRotorRef.current.rotation.y += delta * 38;
    }
    if (tailRotorRef.current) {
      tailRotorRef.current.rotation.x += delta * 52;
    }

    // 2. Anti-collision strobe beacon
    if (beaconRef.current) {
      beaconRef.current.intensity = Math.sin(state.clock.elapsedTime * 8) > 0.3 ? 3.0 : 0.2;
    }

    // 3. Helicopter Choreography: Approaching -> Hovering -> Leaving
    if (heloGroupRef.current) {
      if (phase === 'approaching') {
        // Enters from far stormy left-rear clouds: [-24, 16, -25] -> hovering at [-3.5, 7.8, -5]
        const p = Math.min(1, Math.max(0, progress));
        heloGroupRef.current.position.x = -24 + p * 20.5;
        heloGroupRef.current.position.y = 16 - p * 8.2;
        heloGroupRef.current.position.z = -25 + p * 20;
        heloGroupRef.current.rotation.set(0.12, -0.4 * (1 - p), -0.08);

        // Searchlight sweeps down at the flooded water and person
        if (searchlightRef.current && searchlightTargetRef.current) {
          searchlightTargetRef.current.position.set(-4.6, 0, 1.8);
          searchlightRef.current.target = searchlightTargetRef.current;
        }
      } else if (phase === 'hovering') {
        // Steady hovering over water near person
        const t = state.clock.elapsedTime;
        heloGroupRef.current.position.set(
          -3.5 + Math.sin(t * 0.9) * 0.25,
          7.8 + Math.cos(t * 1.3) * 0.2,
          -5.0 + Math.sin(t * 0.7) * 0.15
        );
        heloGroupRef.current.rotation.set(
          0.02 + Math.sin(t * 0.8) * 0.03,
          0.15 + Math.cos(t * 0.6) * 0.04,
          -0.03
        );

        if (searchlightRef.current && searchlightTargetRef.current) {
          searchlightTargetRef.current.position.set(-4.6, 0, 1.8);
          searchlightRef.current.target = searchlightTargetRef.current;
        }
      } else if (phase === 'leaving') {
        // Banks forward and leaves into distant right stormy background behind the login panel!
        // Moves from [-3.5, 7.8, -5] -> [32, 19, -55]
        const p = Math.min(1, Math.max(0, progress));
        heloGroupRef.current.position.x = -3.5 + p * 35.5;
        heloGroupRef.current.position.y = 7.8 + p * 11.2;
        heloGroupRef.current.position.z = -5.0 - p * 50.0;
        // Tilted forward & banking right
        heloGroupRef.current.rotation.set(0.22, 0.85, -0.25);

        // Searchlight angles forward as it departs
        if (searchlightRef.current && searchlightTargetRef.current) {
          searchlightTargetRef.current.position.set(15, 0, -20);
          searchlightRef.current.target = searchlightTargetRef.current;
        }
      }
    }
  });

  return (
    <group ref={heloGroupRef} position={[-24, 16, -25]}>
      {/* Cockpit & Fuselage */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.0, 1.7, 4.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Emergency Orange Flank Trim */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[2.05, 0.42, 4.2]} />
        <meshStandardMaterial color="#ff5722" roughness={0.4} />
      </mesh>

      {/* Cockpit Canopy Glass */}
      <mesh position={[0, 0.32, 1.8]} rotation={[0.42, 0, 0]}>
        <boxGeometry args={[1.8, 1.0, 1.6]} />
        <meshStandardMaterial color="#06b6d4" roughness={0.1} metalness={0.9} transparent opacity={0.7} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, -0.2, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.8, 0.8, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* Engine & Rotor Mast */}
      <mesh position={[0, 1.0, -0.4]}>
        <boxGeometry args={[1.4, 0.55, 2.5]} />
        <meshStandardMaterial color="#ff5722" />
      </mesh>
      <mesh position={[0, 1.45, 0.2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </mesh>

      {/* Spinning Main Rotor Blades */}
      <group ref={mainRotorRef} position={[0, 1.75, 0.2]}>
        <mesh>
          <boxGeometry args={[0.26, 0.03, 8.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh>
          <boxGeometry args={[8.8, 0.03, 0.26]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        {/* Yellow Safety tips */}
        <mesh position={[0, 0.01, 4.2]}>
          <boxGeometry args={[0.28, 0.04, 0.4]} />
          <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.01, -4.2]}>
          <boxGeometry args={[0.28, 0.04, 0.4]} />
          <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Tail Boom & Tail Rotor */}
      <mesh position={[0, 0.2, -4.2]} rotation={[-0.05, 0, 0]}>
        <boxGeometry args={[0.55, 0.55, 4.2]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 0.75, -6.2]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.12, 1.5, 0.8]} />
        <meshStandardMaterial color="#ff5722" />
      </mesh>

      <group ref={tailRotorRef} position={[0.18, 1.0, -6.3]}>
        <mesh>
          <boxGeometry args={[0.04, 1.6, 0.14]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>

      {/* Skid Tubes */}
      <group position={[-1.1, -1.1, 0]}>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 4.4, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
      </group>
      <group position={[1.1, -1.1, 0]}>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 4.4, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
      </group>

      {/* Anti-Collision Flashing Strobe (Top) */}
      <pointLight ref={beaconRef} position={[0, 1.4, -1.0]} color="#ef4444" intensity={2.5} distance={20} />

      {/* Searchlight sweeping downward */}
      <spotLight
        ref={searchlightRef}
        position={[0, -0.85, 1.6]}
        color="#e0f2fe"
        intensity={9.0}
        distance={60}
        angle={Math.PI / 6.5}
        penumbra={0.35}
        castShadow
      />
      <primitive object={searchlightTargetRef.current} />
    </group>
  );
}

// ----------------- SURGING FLOOD WATER SURFACE -----------------
function SurgingFloodWater() {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = -0.05 + Math.sin(state.clock.elapsedTime * 1.5) * 0.06;
    }
  });

  return (
    <mesh ref={waterRef} position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[120, 120, 48, 48]} />
      <meshStandardMaterial
        color="#040d16"
        roughness={0.12}
        metalness={0.88}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

// ----------------- RAIN PARTICLES -----------------
function HeavyNightRain() {
  const rainRef = useRef<THREE.Points>(null);
  const count = 1600;

  const positions = useRef(
    (() => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 65;
        pos[i * 3 + 1] = Math.random() * 30;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 65;
      }
      return pos;
    })()
  ).current;

  useFrame((_, delta) => {
    if (rainRef.current) {
      const posAttr = rainRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] -= delta * 24; // Falling speed
        arr[i * 3] -= delta * 2.5;     // Wind slant

        if (arr[i * 3 + 1] < -0.2) {
          arr[i * 3 + 1] = 28 + Math.random() * 2;
          arr[i * 3] = (Math.random() - 0.5) * 65;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={rainRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        color="#94a3b8"
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function RealisticRescueLoginCanvas({
  torchOn,
  torchIntensity,
  heloPhase,
  heloProgress,
}: RealisticRescueLoginCanvasProps) {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#020617] overflow-hidden pointer-events-none select-none">
      <Canvas
        shadows
        camera={{ position: [0, 2.0, 8.5], fov: 46, near: 0.1, far: 250 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Stormy Dark Atmosphere & Dense Fog */}
        <color attach="background" args={['#020617']} />
        <fogExp2 attach="fog" args={['#040a14', 0.026]} />

        {/* Ambient Storm Blue Sky Light */}
        <ambientLight intensity={0.4} color="#38bdf8" />

        {/* Distant Moon / Storm Cloud Key Light */}
        <directionalLight
          position={[15, 35, -20]}
          intensity={0.65}
          color="#93c5fd"
          castShadow
        />

        {/* Heavy Rain Downpour */}
        <HeavyNightRain />

        {/* Surging Flood Water */}
        <SurgingFloodWater />

        {/* Submerged Person on the Left holding Handheld Torch beaming to the Right */}
        <DrenchedSurvivorInWater
          torchOn={torchOn}
          torchIntensity={torchIntensity}
        />

        {/* Background Helicopter (Approaches, Hovers, and Leaves into Distance) */}
        <BackgroundRescueHelicopter
          phase={heloPhase}
          progress={heloProgress}
        />
      </Canvas>
    </div>
  );
}
