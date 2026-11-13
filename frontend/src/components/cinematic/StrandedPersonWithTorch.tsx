import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StrandedPersonWithTorchProps {
  position?: [number, number, number]; // Position in world space
  isHeldOnRope?: boolean; // Whether holding the rope harness
  rightArmRaise?: number; // 0 (down) to 1 (raised pointing torch at camera)
  torchOn?: boolean; // Whether handheld torch is switched ON
  torchBeamIntensity?: number; // 0 to 10 (expands beam intensity and radius)
  cameraTarget?: [number, number, number]; // Where the torch beam directs (towards camera)
}

export function StrandedPersonWithTorch({
  position = [0, 3.6, 0],
  isHeldOnRope = false,
  rightArmRaise = 0,
  torchOn = false,
  torchBeamIntensity = 0,
  cameraTarget = [0, 5, 8],
}: StrandedPersonWithTorchProps) {
  const torchSpotRef = useRef<THREE.SpotLight>(null);
  const torchLensRef = useRef<THREE.Mesh>(null);
  const beamConeRef = useRef<THREE.Mesh>(null);
  const rightArmGroupRef = useRef<THREE.Group>(null);
  const targetObjRef = useRef<THREE.Object3D>(new THREE.Object3D());

  useFrame(() => {
    // 1. Right arm articulation (raising hand holding torch)
    if (rightArmGroupRef.current) {
      // Rotate shoulder forward and inward: from 0 to -1.35 rad (pointing forward towards camera)
      rightArmGroupRef.current.rotation.x = -rightArmRaise * 1.45;
      rightArmGroupRef.current.rotation.z = -0.2 - rightArmRaise * 0.35;
      rightArmGroupRef.current.rotation.y = rightArmRaise * 0.25;
    }

    // 2. Direct torch spotlight towards camera target
    if (torchSpotRef.current && targetObjRef.current) {
      targetObjRef.current.position.set(...cameraTarget);
      torchSpotRef.current.target = targetObjRef.current;
    }

    // 3. Scale volumetric beam cone with torch intensity
    if (beamConeRef.current) {
      const scale = Math.max(0.001, torchBeamIntensity * 1.5);
      beamConeRef.current.scale.set(scale, 1, scale);
    }
  });

  return (
    <group position={position}>
      {/* ----------------- HUMAN FIGURE (RESCUEE) ----------------- */}

      {/* Torso / Heavy Waterproof Storm Anorak */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.55, 0.75, 0.35]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Emergency High-Visibility Orange Life Vest / Harness */}
      <mesh position={[0, 0.95, 0.02]} castShadow>
        <boxGeometry args={[0.58, 0.55, 0.38]} />
        <meshStandardMaterial color="#ff5722" roughness={0.4} />
      </mesh>
      {/* Life Vest Reflective Safety Stripes */}
      <mesh position={[0, 1.05, 0.22]}>
        <boxGeometry args={[0.5, 0.08, 0.02]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} emissive="#f8fafc" emissiveIntensity={0.2} />
      </mesh>

      {/* Head with Hood */}
      <mesh position={[0, 1.48, 0.02]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
      {/* Face (visible under hood) */}
      <mesh position={[0, 1.46, 0.12]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-0.18, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.09, 0.7, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      {/* Left Boot */}
      <mesh position={[-0.18, 0.05, 0.05]} castShadow>
        <boxGeometry args={[0.15, 0.12, 0.3]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.18, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.09, 0.7, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      {/* Right Boot */}
      <mesh position={[0.18, 0.05, 0.05]} castShadow>
        <boxGeometry args={[0.15, 0.12, 0.3]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>

      {/* ----------------- LEFT ARM (HOLDING RESCUE ROPE HARNESS) ----------------- */}
      <group position={[-0.32, 1.2, 0]}>
        {isHeldOnRope ? (
          // Reaching upwards grasping harness carabiner
          <group rotation={[0, 0, 0.4]}>
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.08, 0.07, 0.6, 8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Gloved Hand */}
            <mesh position={[0, 0.58, 0]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            {/* Steel Carabiner ring connected to cable */}
            <mesh position={[0, 0.68, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.08, 0.02, 8, 16]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.9} />
            </mesh>
          </group>
        ) : (
          // Waiting by side
          <group rotation={[0, 0, -0.15]}>
            <mesh position={[0, -0.28, 0]}>
              <cylinderGeometry args={[0.08, 0.07, 0.6, 8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, -0.58, 0]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
          </group>
        )}
      </group>

      {/* ----------------- RIGHT ARM & VISIBLE HANDHELD TORCH ----------------- */}
      <group ref={rightArmGroupRef} position={[0.32, 1.2, 0]}>
        {/* Upper Arm Sleeve */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.085, 0.075, 0.45, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Forearm & Gloved Hand holding torch */}
        <group position={[0, -0.45, 0]}>
          <mesh position={[0, -0.18, 0.08]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.065, 0.42, 8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>

          {/* Gloved Hand Grip */}
          <mesh position={[0, -0.36, 0.2]}>
            <sphereGeometry args={[0.085, 8, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>

          {/* ============================================================== */}
          {/* THE HANDHELD TORCH / FLASHLIGHT IN PERSON'S HAND               */}
          {/* ============================================================== */}
          <group position={[0, -0.36, 0.22]} rotation={[0.65, 0, 0]}>
            {/* Heavy-Duty Aluminum Torch Body / Barrel */}
            <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.28, 16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Tactical Rubberized Knurled Grip Bands */}
            <mesh position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.048, 0.048, 0.12, 16]} />
              <meshStandardMaterial color="#ff5722" roughness={0.7} />
            </mesh>

            {/* Flared Head / Reflector Bezel */}
            <mesh position={[0, 0, 0.1]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
              <coneGeometry args={[0.085, 0.12, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.9} />
            </mesh>

            {/* Visual Mechanical Toggle/Slide Switch (Moves forward when ON) */}
            <mesh position={[0, 0.05, torchOn ? -0.02 : -0.05]}>
              <boxGeometry args={[0.025, 0.015, 0.04]} />
              <meshStandardMaterial color={torchOn ? "#10b981" : "#dc2626"} />
            </mesh>

            {/* Front Glass Lens */}
            <mesh ref={torchLensRef} position={[0, 0, 0.16]}>
              <circleGeometry args={[0.08, 16]} />
              {torchOn ? (
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
              ) : (
                <meshStandardMaterial color="#475569" roughness={0.1} metalness={0.9} />
              )}
            </mesh>

            {/* ----------------- VOLUMETRIC TORCH BEAM & LIGHT EMITTERS ----------------- */}
            {torchOn && (
              <group position={[0, 0, 0.18]}>
                {/* Local Lens Glow Point Light (Illuminates Person's hand and face) */}
                <pointLight
                  color="#fffbeb"
                  intensity={3.5 * Math.min(1.0, torchBeamIntensity)}
                  distance={6}
                />

                {/* Primary High-Intensity Directional Torch Spotlight */}
                <spotLight
                  ref={torchSpotRef}
                  position={[0, 0, 0]}
                  color="#fffbeb"
                  intensity={torchBeamIntensity * 12.0}
                  distance={60}
                  angle={Math.PI / 6 + torchBeamIntensity * 0.08}
                  penumbra={0.3}
                  castShadow
                />

                {/* Visible Volumetric Mist-Scattering Beam Cone */}
                <mesh
                  ref={beamConeRef}
                  position={[0, 0, 10]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[2.5, 0.1, 20, 24, 1, true]} />
                  <meshBasicMaterial
                    color="#fffbeb"
                    transparent
                    opacity={Math.min(0.65, torchBeamIntensity * 0.18)}
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

      <primitive object={targetObjRef.current} />
    </group>
  );
}
