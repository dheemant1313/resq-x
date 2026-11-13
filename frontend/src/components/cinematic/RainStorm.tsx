import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { rescueAudio } from '../../audio/rescueAudio';

interface RainStormProps {
  rainCount?: number;
  lightningEnabled?: boolean;
}

export function RainStorm({ rainCount = 1800, lightningEnabled = true }: RainStormProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const lightningLightRef = useRef<THREE.DirectionalLight>(null);
  const flashTimer = useRef<number>(0);
  const isFlashing = useRef<boolean>(false);

  // Generate rain particle positions and falling velocities
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(rainCount * 3);
    const vel = new Float32Array(rainCount);

    for (let i = 0; i < rainCount; i++) {
      // Spread across a 70x70m area around the center
      pos[i * 3] = (Math.random() - 0.5) * 75;
      pos[i * 3 + 1] = Math.random() * 45; // Height 0 to 45m
      pos[i * 3 + 2] = (Math.random() - 0.5) * 75;

      vel[i] = 22 + Math.random() * 14; // Downward speed
    }
    return [pos, vel];
  }, [rainCount]);

  useFrame((_, delta) => {
    // 1. Animate raindrops downward with slight storm wind slant
    if (pointsRef.current) {
      const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const array = positionAttr.array as Float32Array;

      for (let i = 0; i < rainCount; i++) {
        // Fall down
        array[i * 3 + 1] -= velocities[i] * delta;
        // Wind drift along X
        array[i * 3] -= 2.2 * delta;

        // Reset if hitting ground/water level
        if (array[i * 3 + 1] < -0.2) {
          array[i * 3 + 1] = 40 + Math.random() * 5;
          array[i * 3] = (Math.random() - 0.5) * 75;
          array[i * 3 + 2] = (Math.random() - 0.5) * 75;
        }
      }
      positionAttr.needsUpdate = true;
    }

    // 2. Periodic Lightning Flashes
    if (lightningEnabled && lightningLightRef.current) {
      flashTimer.current += delta;

      // Random trigger every 4 to 8 seconds
      if (flashTimer.current > 5.2 && Math.random() < 0.04 && !isFlashing.current) {
        isFlashing.current = true;
        flashTimer.current = 0;

        // High intensity blue-white flash
        lightningLightRef.current.intensity = 5.5 + Math.random() * 3.5;
        rescueAudio.playLightningRumble();

        // Double flash jitter
        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 1.0;
        }, 60);

        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 4.2;
        }, 110);

        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 0.0;
          isFlashing.current = false;
        }, 220);
      }
    }
  });

  return (
    <group>
      {/* ----------------- RAIN PARTICLES ----------------- */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          color="#94a3b8"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* ----------------- DISTANT LIGHTNING FLASH LIGHT ----------------- */}
      <directionalLight
        ref={lightningLightRef}
        position={[-30, 40, -40]}
        color="#a5f3fc"
        intensity={0.0}
      />
    </group>
  );
}
