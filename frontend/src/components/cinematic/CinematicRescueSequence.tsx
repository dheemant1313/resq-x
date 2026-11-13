import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, FastForward, RotateCcw, ShieldAlert, Compass } from 'lucide-react';
import gsap from 'gsap';
import { RescueCinematicCanvas, type CinematicState } from './RescueCinematicCanvas';
import { rescueAudio } from '../../audio/rescueAudio';

interface CinematicRescueSequenceProps {
  onComplete: () => void; // Triggered when transition into login occurs
  onCancel?: () => void;   // Return to landing page
}

export function CinematicRescueSequence({ onComplete, onCancel }: CinematicRescueSequenceProps) {
  const [muted, setMuted] = useState(false);
  const [activeStage, setActiveStage] = useState<string>('AERIAL RECONNAISSANCE');
  const [stageIndex, setStageIndex] = useState<number>(1);
  const [lightMaskOpacity, setLightMaskOpacity] = useState<number>(0);
  const [logoRevealOpacity, setLogoRevealOpacity] = useState<number>(0);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Cinematic State synchronized with GSAP
  const [cinematicState, setCinematicState] = useState<CinematicState>({
    cameraPos: [0, 24, 38],
    cameraLookAt: [0, 4, 0],
    heloPos: [-36, 26, -30],
    heloRot: [0.15, -0.6, -0.1],
    cableLength: 0,
    personPos: [0, 3.6, 0],
    isHeldOnRope: false,
    rightArmRaise: 0,
    torchOn: false,
    torchBeamIntensity: 0,
  });

  // Handle Skip
  const handleSkip = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    rescueAudio.playTransitionToLogin();
    setLightMaskOpacity(1);
    setLogoRevealOpacity(1);
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [onComplete]);

  // Handle Mute
  const handleToggleMute = () => {
    const isNowMuted = rescueAudio.toggleMute();
    setMuted(isNowMuted);
  };

  // Build and run GSAP Master Timeline
  useEffect(() => {
    // Start audio on user trigger
    rescueAudio.startAmbient();

    const stateObj = {
      camX: 0,
      camY: 24,
      camZ: 38,
      lookX: 0,
      lookY: 4,
      lookZ: 0,
      heloX: -36,
      heloY: 26,
      heloZ: -30,
      heloRotX: 0.15,
      heloRotY: -0.6,
      heloRotZ: -0.1,
      cableLen: 0,
      personY: 3.6,
      isRopeHeld: 0,
      armRaise: 0,
      isTorchActive: 0,
      beamIntensity: 0,
      maskGlow: 0,
      logoGlow: 0,
    };

    const updateState = () => {
      setCinematicState({
        cameraPos: [stateObj.camX, stateObj.camY, stateObj.camZ],
        cameraLookAt: [stateObj.lookX, stateObj.lookY, stateObj.lookZ],
        heloPos: [stateObj.heloX, stateObj.heloY, stateObj.heloZ],
        heloRot: [stateObj.heloRotX, stateObj.heloRotY, stateObj.heloRotZ],
        cableLength: stateObj.cableLen,
        personPos: [0, stateObj.personY, 0],
        isHeldOnRope: stateObj.isRopeHeld > 0.5,
        rightArmRaise: stateObj.armRaise,
        torchOn: stateObj.isTorchActive > 0.5,
        torchBeamIntensity: stateObj.beamIntensity,
      });

      setLightMaskOpacity(stateObj.maskGlow);
      setLogoRevealOpacity(stateObj.logoGlow);
    };

    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      },
    });

    timelineRef.current = tl;

    // -------------------------------------------------------------
    // SCENE 1 — FLOODED VILLAGE RECON (0s - 4.5s)
    // -------------------------------------------------------------
    tl.call(() => {
      setActiveStage('AERIAL FLOOD RECONNAISSANCE');
      setStageIndex(1);
    }, [], 0);

    tl.to(stateObj, {
      camX: 10,
      camY: 12,
      camZ: 22,
      lookX: 0,
      lookY: 3.6,
      lookZ: 0,
      duration: 4.5,
      ease: 'power2.inOut',
      onUpdate: updateState,
    }, 0);

    // -------------------------------------------------------------
    // SCENE 2 — HELICOPTER APPROACH (4.5s - 8.5s)
    // -------------------------------------------------------------
    tl.call(() => {
      setActiveStage('AIR-RESCUE HELO ON VECTOR');
      setStageIndex(2);
      rescueAudio.setHeloHover(0.85);
    }, [], 4.5);

    tl.to(stateObj, {
      heloX: 0,
      heloY: 14.5,
      heloZ: 0,
      heloRotX: 0,
      heloRotY: 0,
      heloRotZ: 0,
      duration: 4.0,
      ease: 'power3.out',
      onUpdate: updateState,
    }, 4.5);

    tl.to(stateObj, {
      camX: 8,
      camY: 9,
      camZ: 14,
      lookX: 0,
      lookY: 6,
      lookZ: 0,
      duration: 4.0,
      ease: 'power2.inOut',
      onUpdate: updateState,
    }, 4.5);

    // -------------------------------------------------------------
    // SCENE 3 — RESCUE ROPE & LIFT EXTRACTION (8.5s - 13.0s)
    // -------------------------------------------------------------
    tl.call(() => {
      setActiveStage('WINCH HOIST EXTRACTION');
      setStageIndex(3);
    }, [], 8.5);

    // Winch descends cable to person (length 9.5m)
    tl.to(stateObj, {
      cableLen: 9.5,
      duration: 2.0,
      ease: 'power2.inOut',
      onUpdate: updateState,
    }, 8.5);

    // Person connects to harness
    tl.set(stateObj, { isRopeHeld: 1 }, 10.5);

    // Hoist lifts person up to 9.2m while cable shortens
    tl.to(stateObj, {
      personY: 9.2,
      cableLen: 3.9,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: updateState,
    }, 10.5);

    // Camera moves up with person
    tl.to(stateObj, {
      camX: 2.5,
      camY: 10.2,
      camZ: 8.5,
      lookX: 0,
      lookY: 9.2,
      lookZ: 0,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: updateState,
    }, 10.5);

    // -------------------------------------------------------------
    // SCENE 4 — HANDHELD TORCH ACTIVATION (13.0s - 17.5s)
    // THIS IS THE MAIN LOGIN TRANSITION
    // -------------------------------------------------------------
    tl.call(() => {
      setActiveStage('HANDHELD BEACON ACTIVATION');
      setStageIndex(4);
    }, [], 13.0);

    // Camera moves close to the suspended person
    tl.to(stateObj, {
      camX: 0.25,
      camY: 9.6,
      camZ: 3.2,
      lookX: 0,
      lookY: 9.4,
      lookZ: 0,
      duration: 1.8,
      ease: 'power3.out',
      onUpdate: updateState,
    }, 13.0);

    // Person raises right hand holding the torch
    tl.to(stateObj, {
      armRaise: 1.0,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: updateState,
    }, 13.2);

    // Audible and visible switch click on torch!
    tl.call(() => {
      rescueAudio.playTorchClick();
    }, [], 14.8);

    tl.set(stateObj, { isTorchActive: 1 }, 14.8);

    // Torch emits beam directly toward the camera, beam expands
    tl.to(stateObj, {
      beamIntensity: 8.5,
      duration: 2.4,
      ease: 'power2.in',
      onUpdate: updateState,
    }, 14.8);

    // -------------------------------------------------------------
    // SCENE 5 — TORCH-TO-LOGIN TRANSITION MASK (17.2s - 20.0s)
    // Light fills screen, logo reveals, transitions to login
    // -------------------------------------------------------------
    tl.call(() => {
      setActiveStage('SYSTEM ACCESS GRANTED');
      setStageIndex(5);
      rescueAudio.playTransitionToLogin();
    }, [], 17.2);

    // Expanding light bloom fills screen
    tl.to(stateObj, {
      maskGlow: 1.0,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: updateState,
    }, 17.2);

    // Logo emerges through the warm transition light
    tl.to(stateObj, {
      logoGlow: 1.0,
      duration: 1.0,
      ease: 'power2.out',
      onUpdate: updateState,
    }, 18.0);

    return () => {
      tl.kill();
      rescueAudio.stopAndCleanup();
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 w-full h-full z-50 bg-[#020617] overflow-hidden select-none font-sans">
      {/* 3D WebGL Canvas Layer */}
      <RescueCinematicCanvas state={cinematicState} />

      {/* ----------------- TOP TACTICAL HUD CONTROLS ----------------- */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20 pointer-events-auto">
        {/* Left: Emergency Mission Badge */}
        <div className="flex items-center space-x-3 bg-command-950/70 backdrop-blur-md px-4 py-2 rounded-xl border border-command-700/80 shadow-2xl">
          <div className="p-1.5 bg-emergency-orange/20 border border-emergency-orange/40 rounded-lg text-emergency-orange animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest text-emergency-orange font-bold uppercase">
              <span>LIVE EXTRACTION TELEMETRY</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-xs font-bold text-white tracking-wide">
              DISASTER SECTOR 04 &bull; RESCUE OP
            </div>
          </div>
        </div>

        {/* Right: Sound, Skip, and Cancel Controls */}
        <div className="flex items-center space-x-3">
          {/* Mute/Unmute */}
          <button
            onClick={handleToggleMute}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-command-900/80 hover:bg-command-800 text-slate-200 border border-command-700 backdrop-blur-md text-xs font-mono transition-colors shadow-lg"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span className="hidden sm:inline">{muted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>

          {/* Skip Intro */}
          <button
            onClick={handleSkip}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emergency-orange/90 hover:bg-emergency-orange text-white border border-emergency-orange/60 backdrop-blur-md text-xs font-bold tracking-wider font-mono transition-all shadow-glow-orange hover:scale-105 active:scale-95"
          >
            <span>SKIP INTRO</span>
            <FastForward className="w-4 h-4" />
          </button>

          {/* Cancel & Return to Landing */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 rounded-xl bg-command-900/80 hover:bg-command-800 text-slate-400 hover:text-white border border-command-700 backdrop-blur-md transition-colors"
              title="Return to Landing Page"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ----------------- BOTTOM TIMELINE TICKER ----------------- */}
      <div className="absolute bottom-8 left-6 right-6 z-20 flex flex-col items-center pointer-events-none">
        <div className="max-w-xl w-full bg-command-950/80 backdrop-blur-md p-4 rounded-2xl border border-command-700/80 shadow-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emergency-orange" />
              STAGE {stageIndex} OF 5
            </span>
            <span className="text-emergency-orange font-bold tracking-wider uppercase">
              {activeStage}
            </span>
          </div>

          {/* 5-Segment Progress Bar */}
          <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`rounded-full transition-all duration-500 ${
                  stageIndex >= idx
                    ? 'bg-emergency-orange shadow-glow-orange'
                    : 'bg-command-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ----------------- SCENE 5: HANDHELD TORCH TRANSITION LIGHT MASK ----------------- */}
      {/* 
        This warm radial gradient mimics the blinding flashlight beam expanding over the camera lens,
        avoiding a harsh flat white strobe while providing an organic transition into the login UI.
      */}
      <div
        className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
        style={{
          opacity: lightMaskOpacity,
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 1) 0%, rgba(254, 243, 199, 0.95) 45%, rgba(15, 23, 42, 0.98) 100%)',
        }}
      />

      {/* Logo Reveal as light blooms */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none transition-opacity duration-500"
        style={{ opacity: logoRevealOpacity }}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-command-950/90 border-2 border-emergency-orange shadow-2xl flex items-center justify-center text-emergency-orange scale-110 animate-pulse">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tighter text-command-950 font-mono">
              RESQ-X
            </h1>
            <p className="text-xs font-mono font-bold tracking-widest text-slate-800 uppercase">
              DISASTER RELIEF COMMAND CENTER
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
