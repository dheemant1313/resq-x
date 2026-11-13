import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function FloodedVillage() {
  const waterRef = useRef<THREE.Mesh>(null);

  // Animate gentle water swell and ripple effect
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = -0.2 + Math.sin(state.clock.elapsedTime * 1.2) * 0.08;
      // Slight tilt simulating surging flood current
      waterRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.005;
    }
  });

  return (
    <group>
      {/* ----------------- SURGING FLOOD WATER PLANE ----------------- */}
      <mesh
        ref={waterRef}
        position={[0, -0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[140, 140, 48, 48]} />
        <meshStandardMaterial
          color="#06121e"
          roughness={0.15}
          metalness={0.85}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* ----------------- PRIMARY ELEVATED REFUGE ROOF (PERSON'S LOCATION) ----------------- */}
      {/* Positioned at [0, 0, 0], top surface at y = 3.6 */}
      <group position={[0, 0, 0]}>
        {/* Partially Submerged Building Base */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[7, 3.2, 7]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>

        {/* Elevated Roof Terrace Deck (Safe Ground) */}
        <mesh position={[0, 2.9, 0]} receiveShadow>
          <boxGeometry args={[7.4, 0.4, 7.4]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>

        {/* Brick Parapet Railing */}
        <mesh position={[0, 3.3, 3.6]} receiveShadow>
          <boxGeometry args={[7.4, 0.6, 0.2]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.3, -3.6]} receiveShadow>
          <boxGeometry args={[7.4, 0.6, 0.2]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[-3.6, 3.3, 0]} receiveShadow>
          <boxGeometry args={[0.2, 0.6, 7.4]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[3.6, 3.3, 0]} receiveShadow>
          <boxGeometry args={[0.2, 0.6, 7.4]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>

        {/* Rooftop Water Tank & Antenna */}
        <mesh position={[-2.2, 4.0, -2.2]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 1.8, 16]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        <mesh position={[2.5, 4.5, -2.5]}>
          <cylinderGeometry args={[0.03, 0.03, 2.8, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>

      {/* ----------------- SURROUNDING SUBMERGED VILLAGE HOUSES ----------------- */}
      {/* House 1 (North-West, Sloped Roof almost submerged) */}
      <group position={[-14, -0.6, -10]} rotation={[0, 0.3, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 2.8, 5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        {/* Sloped Roof */}
        <mesh position={[0, 3.0, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[4.5, 2.0, 4]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
        </mesh>
      </group>

      {/* House 2 (North-East, Partially visible Gable) */}
      <group position={[12, -0.8, -14]} rotation={[0, -0.4, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[7, 2.5, 5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.8, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[3.8, 3.8, 5.2]} />
          <meshStandardMaterial color="#991b1b" roughness={0.8} />
        </mesh>
      </group>

      {/* House 3 (South-West, Half submerged) */}
      <group position={[-16, -1.0, 12]} rotation={[0, 0.6, 0]}>
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[5, 2.5, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[4.2, 1.8, 4]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </group>

      {/* House 4 (East, Tilted by surging water) */}
      <group position={[18, -1.2, 8]} rotation={[0.08, -0.2, 0.06]}>
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 2.5, 5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[4.4, 1.8, 4]} />
          <meshStandardMaterial color="#831843" roughness={0.7} />
        </mesh>
      </group>

      {/* ----------------- SUBMERGED STREET INFRASTRUCTURE & TREES ----------------- */}
      {/* Submerged Electric Poles */}
      <group position={[-6, 0, 8]}>
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 5.5, 8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 4.8, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>

      <group position={[8, 0, -6]}>
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 5.5, 8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 4.8, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>

      {/* Floating Emergency Debris / Red Oil Barrels */}
      <mesh position={[-4, 0.1, 4]} rotation={[0.4, 0.2, 0.8]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.9, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>
      <mesh position={[5, 0.1, 6]} rotation={[0.2, 0.8, 0.3]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.85, 12]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>
    </group>
  );
}
