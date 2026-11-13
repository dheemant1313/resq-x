import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { FloodedVillage } from './FloodedVillage';
import { RescueHelicopter } from './RescueHelicopter';
import { StrandedPersonWithTorch } from './StrandedPersonWithTorch';
import { RainStorm } from './RainStorm';
import * as THREE from 'three';

export interface CinematicState {
  cameraPos: [number, number, number];
  cameraLookAt: [number, number, number];
  heloPos: [number, number, number];
  heloRot: [number, number, number];
  cableLength: number;
  personPos: [number, number, number];
  isHeldOnRope: boolean;
  rightArmRaise: number;
  torchOn: boolean;
  torchBeamIntensity: number;
}

function CameraRig({
  cameraPos,
  cameraLookAt,
}: {
  cameraPos: [number, number, number];
  cameraLookAt: [number, number, number];
}) {
  const lookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(...cameraLookAt));

  useFrame(({ camera }) => {
    // Smooth camera positioning
    camera.position.lerp(new THREE.Vector3(...cameraPos), 0.12);

    // Smooth lookAt target
    lookAtRef.current.lerp(new THREE.Vector3(...cameraLookAt), 0.12);
    camera.lookAt(lookAtRef.current);
  });

  return null;
}

interface RescueCinematicCanvasProps {
  state: CinematicState;
}

export function RescueCinematicCanvas({ state }: RescueCinematicCanvasProps) {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#020617] overflow-hidden pointer-events-none select-none">
      <Canvas
        shadows
        camera={{ position: state.cameraPos, fov: 45, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Dynamic Camera Rig */}
        <CameraRig
          cameraPos={state.cameraPos}
          cameraLookAt={state.cameraLookAt}
        />

        {/* ----------------- STORMY NIGHT ATMOSPHERIC FOG & AMBIENCE ----------------- */}
        <color attach="background" args={['#030712']} />
        <fogExp2 attach="fog" args={['#06111e', 0.022]} />

        {/* Night Ambient Light */}
        <ambientLight intensity={0.45} color="#38bdf8" />

        {/* Distant Moon / Storm Cloud Directional Light */}
        <directionalLight
          position={[25, 45, -20]}
          intensity={0.65}
          color="#93c5fd"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Heavy Rain & Dynamic Lightning Flashes */}
        <RainStorm rainCount={2000} lightningEnabled={true} />

        {/* Surging Flooded Village & Elevated Refuge Roof */}
        <FloodedVillage />

        {/* Rescue Helicopter with Winch Hoist & Main Rotors */}
        <RescueHelicopter
          position={state.heloPos}
          rotation={state.heloRot}
          cableLength={state.cableLength}
          searchlightTarget={state.personPos}
        />

        {/* Stranded Person Holding Handheld Torch & Harness */}
        <StrandedPersonWithTorch
          position={state.personPos}
          isHeldOnRope={state.isHeldOnRope}
          rightArmRaise={state.rightArmRaise}
          torchOn={state.torchOn}
          torchBeamIntensity={state.torchBeamIntensity}
          cameraTarget={state.cameraPos}
        />
      </Canvas>
    </div>
  );
}
