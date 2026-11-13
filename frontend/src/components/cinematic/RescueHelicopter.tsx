import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RescueHelicopterProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  cableLength?: number; // Distance cable descends from winch hoist
  searchlightTarget?: [number, number, number];
}

export function RescueHelicopter({
  position = [0, 14, 0],
  rotation = [0, 0, 0],
  cableLength = 0,
  searchlightTarget = [0, 3.2, 0],
}: RescueHelicopterProps) {
  const mainRotorRef = useRef<THREE.Group>(null);
  const tailRotorRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);
  const searchlightRef = useRef<THREE.SpotLight>(null);
  const targetObjRef = useRef<THREE.Object3D>(new THREE.Object3D());

  useFrame((_, delta) => {
    // 1. High RPM Main Rotor Spin (Twin blades)
    if (mainRotorRef.current) {
      mainRotorRef.current.rotation.y += delta * 36;
    }

    // 2. High RPM Tail Rotor Spin
    if (tailRotorRef.current) {
      tailRotorRef.current.rotation.x += delta * 48;
    }

    // 3. Strobe Beacon Flash (Red anti-collision warning)
    if (beaconRef.current) {
      const time = Date.now() * 0.005;
      beaconRef.current.intensity = Math.sin(time) > 0.4 ? 2.5 : 0.2;
    }

    // 4. Orient searchlight towards target
    if (searchlightRef.current && targetObjRef.current) {
      targetObjRef.current.position.set(...searchlightTarget);
      searchlightRef.current.target = targetObjRef.current;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* ----------------- HELICOPTER FUSELAGE / BODY ----------------- */}
      {/* Main Cabin / Aerodynamic Cockpit */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.2, 1.8, 5.0]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* High-Visibility Emergency Orange Flank Stripes */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[2.25, 0.45, 4.6]} />
        <meshStandardMaterial color="#ff5722" roughness={0.4} />
      </mesh>

      {/* Cockpit Canopy / Tinted Glass Dome */}
      <mesh position={[0, 0.35, 1.9]} rotation={[0.45, 0, 0]} castShadow>
        <boxGeometry args={[2.0, 1.1, 1.8]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Nose Cone */}
      <mesh position={[0, -0.2, 2.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.9, 0.9, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* ----------------- ENGINE TURBINE & ROTOR MAST ----------------- */}
      {/* Engine Cowling Atop Fuselage */}
      <mesh position={[0, 1.1, -0.4]} castShadow>
        <boxGeometry args={[1.5, 0.6, 2.8]} />
        <meshStandardMaterial color="#ff5722" roughness={0.4} />
      </mesh>

      {/* Dual Turbine Jet Exhaust Ports */}
      <mesh position={[-0.45, 1.1, -1.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} />
      </mesh>
      <mesh position={[0.45, 1.1, -1.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} />
      </mesh>

      {/* Rotor Mast Shaft */}
      <mesh position={[0, 1.55, 0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.6, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </mesh>

      {/* Rotor Hub & Swashplate */}
      <mesh position={[0, 1.85, 0.2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.15, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>

      {/* ----------------- SPINNING MAIN ROTOR BLADES ----------------- */}
      <group ref={mainRotorRef} position={[0, 1.95, 0.2]}>
        {/* Blade 1 (Forward/Aft span) */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.3, 0.04, 9.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Blade 2 (Cross span) */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[9.4, 0.04, 0.3]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* High-visibility yellow safety tips */}
        <mesh position={[0, 0.01, 4.5]}>
          <boxGeometry args={[0.32, 0.05, 0.4]} />
          <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.01, -4.5]}>
          <boxGeometry args={[0.32, 0.05, 0.4]} />
          <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[4.5, 0.01, 0]}>
          <boxGeometry args={[0.4, 0.05, 0.32]} />
          <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-4.5, 0.01, 0]}>
          <boxGeometry args={[0.4, 0.05, 0.32]} />
          <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* ----------------- TAIL BOOM & TAIL ROTOR ----------------- */}
      {/* Tapered Tail Boom */}
      <mesh position={[0, 0.2, -4.6]} rotation={[-0.05, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.6, 4.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* Vertical Tail Fin Stabilizer */}
      <mesh position={[0, 0.8, -6.8]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.15, 1.6, 0.9]} />
        <meshStandardMaterial color="#ff5722" roughness={0.4} />
      </mesh>

      {/* Horizontal Stabilizer Wings */}
      <mesh position={[0, 0.3, -6.0]}>
        <boxGeometry args={[2.2, 0.08, 0.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* Spinning Tail Rotor */}
      <group ref={tailRotorRef} position={[0.2, 1.1, -6.9]}>
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[0.04, 1.8, 0.15]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.04, 1.8, 0.15]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>

      {/* ----------------- TUBULAR LANDING SKIDS ----------------- */}
      {/* Left Skid */}
      <group position={[-1.2, -1.2, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 4.8, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
        {/* Struts */}
        <mesh position={[0.3, 0.45, 1.1]} rotation={[0, 0, -0.45]}>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[0.3, 0.45, -1.1]} rotation={[0, 0, -0.45]}>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
      </group>

      {/* Right Skid */}
      <group position={[1.2, -1.2, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 4.8, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
        {/* Struts */}
        <mesh position={[-0.3, 0.45, 1.1]} rotation={[0, 0, 0.45]}>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[-0.3, 0.45, -1.1]} rotation={[0, 0, 0.45]}>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
      </group>

      {/* ----------------- WINCH HOIST & RESCUE CABLE ----------------- */}
      {/* Starboard Winch Arm Boom */}
      <group position={[1.25, 0.8, 0.6]}>
        <mesh position={[0.25, 0.0, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
          <meshStandardMaterial color="#eab308" metalness={0.8} />
        </mesh>
        <mesh position={[0.55, 0.2, 0]}>
          <boxGeometry args={[0.3, 0.25, 0.3]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Rescue Cable descending downwards */}
        {cableLength > 0.05 && (
          <mesh position={[0.55, -cableLength / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, cableLength, 6]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.2} />
          </mesh>
        )}
      </group>

      {/* ----------------- LIGHTS & BEACONS ----------------- */}
      {/* Flashing Anti-Collision Beacon (Top) */}
      <mesh position={[0, 1.45, -1.2]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
      </mesh>
      <pointLight ref={beaconRef} position={[0, 1.5, -1.2]} color="#ef4444" intensity={2} distance={15} />

      {/* Starboard Green Navigation LED */}
      <mesh position={[1.15, 0.0, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* Port Red Navigation LED */}
      <mesh position={[-1.15, 0.0, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* ----------------- HIGH-INTENSITY HELICOPTER SEARCHLIGHT ----------------- */}
      {/* Searchlight Housing Mount underneath nose */}
      <mesh position={[0, -0.85, 1.8]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.4, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>
      {/* Glowing Lens */}
      <mesh position={[0, -0.92, 1.9]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>

      {/* Searchlight Spot Beam */}
      <spotLight
        ref={searchlightRef}
        position={[0, -0.95, 1.9]}
        color="#e0f2fe"
        intensity={8.0}
        distance={45}
        angle={Math.PI / 7}
        penumbra={0.4}
        castShadow
      />
      <primitive object={targetObjRef.current} />
    </group>
  );
}
