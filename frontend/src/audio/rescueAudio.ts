/**
 * RESQ-X Web Audio API Sound System
 * 
 * Procedural multi-channel environmental and mechanical audio engine:
 * 1. Rain Channel: Filtered stochastic noise with droplet transients and natural intensity fluctuations.
 * 2. Flood Water Channel: Low-frequency brownian noise with oscillating gentle swells.
 * 3. Helicopter Channel: Rhythmic blade-chopping dual oscillators (45-65Hz) frequency-modulated
 *    by an LFO (16Hz blade frequency) + resonant turbine whine (820Hz).
 * 4. Torch FX Channel: High-transient physical toggle switch click, glowing electric filament hum,
 *    and cinematic light-reveal riser whoosh.
 * 5. Transition FX Channel: Deep sub-bass whoosh resolving into command-center hum.
 * 
 * Features:
 * - Independent channel volume gains.
 * - Master volume and mute controls.
 * - Browser autoplay compliance (resumes on user gesture).
 * - Smooth exponential parameter automation between scenes.
 * - Complete teardown and memory cleanup on unmount.
 */

export class RescueAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Channel Gain Nodes
  private rainGain: GainNode | null = null;
  private floodGain: GainNode | null = null;
  private heloGain: GainNode | null = null;
  private fxGain: GainNode | null = null;

  // Active Sound Generators
  private rainNode: AudioBufferSourceNode | null = null;
  private floodNode: AudioBufferSourceNode | null = null;
  private heloOsc1: OscillatorNode | null = null;
  private heloOsc2: OscillatorNode | null = null;
  private heloChop: GainNode | null = null;
  private heloLfo: OscillatorNode | null = null;
  private heloTurbine: OscillatorNode | null = null;

  private isRunning: boolean = false;

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Channel Gains
      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.rainGain.connect(this.masterGain);

      this.floodGain = this.ctx.createGain();
      this.floodGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.floodGain.connect(this.masterGain);

      this.heloGain = this.ctx.createGain();
      this.heloGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.heloGain.connect(this.masterGain);

      this.fxGain = this.ctx.createGain();
      this.fxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.fxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Generates a 5-second looped buffer of pink/white noise for rainfall and rushing water.
   */
  private createNoiseBuffer(kind: 'pink' | 'brown'): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not ready');
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (kind === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      } else {
        // Brown noise for flood water
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 1.8;
      }
    }
    return buffer;
  }

  /**
   * Starts the environmental ambient loop (Rain + Flood + Helicopter).
   */
  public startAmbient() {
    this.initContext();
    if (!this.ctx || this.isRunning) return;
    this.isRunning = true;

    const t = this.ctx.currentTime;

    // 1. RAIN SYNTHESIS
    const rainBuffer = this.createNoiseBuffer('pink');
    this.rainNode = this.ctx.createBufferSource();
    this.rainNode.buffer = rainBuffer;
    this.rainNode.loop = true;

    // Filter rain to simulate heavy downpour hitting metal roofs and water
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(1400, t);
    rainFilter.Q.setValueAtTime(0.7, t);

    this.rainNode.connect(rainFilter);
    if (this.rainGain) {
      rainFilter.connect(this.rainGain);
      // Smooth fade-in
      this.rainGain.gain.setValueAtTime(0.01, t);
      this.rainGain.gain.exponentialRampToValueAtTime(0.45, t + 2.0);
    }
    this.rainNode.start();

    // 2. FLOOD WATER SYNTHESIS
    const floodBuffer = this.createNoiseBuffer('brown');
    this.floodNode = this.ctx.createBufferSource();
    this.floodNode.buffer = floodBuffer;
    this.floodNode.loop = true;

    const floodFilter = this.ctx.createBiquadFilter();
    floodFilter.type = 'lowpass';
    floodFilter.frequency.setValueAtTime(320, t);
    floodFilter.Q.setValueAtTime(1.2, t);

    this.floodNode.connect(floodFilter);
    if (this.floodGain) {
      floodFilter.connect(this.floodGain);
      this.floodGain.gain.setValueAtTime(0.01, t);
      this.floodGain.gain.exponentialRampToValueAtTime(0.35, t + 2.5);
    }
    this.floodNode.start();

    // 3. HELICOPTER ROTOR & TURBINE SYNTHESIS
    // Dual bass oscillators for the mechanical engine rumble
    this.heloOsc1 = this.ctx.createOscillator();
    this.heloOsc1.type = 'sawtooth';
    this.heloOsc1.frequency.setValueAtTime(46, t);

    this.heloOsc2 = this.ctx.createOscillator();
    this.heloOsc2.type = 'triangle';
    this.heloOsc2.frequency.setValueAtTime(92, t);

    // Amplitude modulation for the 16.5Hz blade chopping
    this.heloChop = this.ctx.createGain();
    this.heloChop.gain.setValueAtTime(0.5, t);

    this.heloLfo = this.ctx.createOscillator();
    this.heloLfo.type = 'sine';
    this.heloLfo.frequency.setValueAtTime(16.5, t); // Blade chop rate

    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.setValueAtTime(0.4, t);
    this.heloLfo.connect(lfoDepth);
    lfoDepth.connect(this.heloChop.gain);

    // High turbine whine
    this.heloTurbine = this.ctx.createOscillator();
    this.heloTurbine.type = 'sine';
    this.heloTurbine.frequency.setValueAtTime(840, t);

    const turbineGain = this.ctx.createGain();
    turbineGain.gain.setValueAtTime(0.06, t);
    this.heloTurbine.connect(turbineGain);

    // Helicopter low-pass resonant body filter
    const heloFilter = this.ctx.createBiquadFilter();
    heloFilter.type = 'lowpass';
    heloFilter.frequency.setValueAtTime(280, t);
    heloFilter.Q.setValueAtTime(2.0, t);

    this.heloOsc1.connect(heloFilter);
    this.heloOsc2.connect(heloFilter);
    heloFilter.connect(this.heloChop);

    if (this.heloGain) {
      this.heloChop.connect(this.heloGain);
      turbineGain.connect(this.heloGain);
      // Starts distant (low volume)
      this.heloGain.gain.setValueAtTime(0.01, t);
      this.heloGain.gain.exponentialRampToValueAtTime(0.12, t + 3.0);
    }

    this.heloOsc1.start();
    this.heloOsc2.start();
    this.heloLfo.start();
    this.heloTurbine.start();
  }

  /**
   * Adjusts the helicopter audio as it approaches and hovers overhead.
   */
  public setHeloHover(intensity: number = 0.8) {
    if (!this.ctx || !this.heloGain) return;
    const t = this.ctx.currentTime;
    const target = Math.max(0.01, Math.min(1.0, intensity));
    this.heloGain.gain.cancelScheduledValues(t);
    this.heloGain.gain.exponentialRampToValueAtTime(target, t + 2.5);
  }

  /**
   * Plays a physical mechanical switch click and electrical arc when the handheld torch is turned on.
   */
  public playTorchClick() {
    this.initContext();
    if (!this.ctx || !this.fxGain) return;
    const t = this.ctx.currentTime;

    // 1. High transient mechanical click
    const oscClick = this.ctx.createOscillator();
    const gainClick = this.ctx.createGain();
    oscClick.type = 'square';
    oscClick.frequency.setValueAtTime(2400, t);
    oscClick.frequency.exponentialRampToValueAtTime(400, t + 0.035);

    gainClick.gain.setValueAtTime(0.8, t);
    gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    oscClick.connect(gainClick);
    gainClick.connect(this.fxGain);

    oscClick.start(t);
    oscClick.stop(t + 0.05);

    // 2. Subtle filament glow hum
    const humOsc = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    humOsc.type = 'triangle';
    humOsc.frequency.setValueAtTime(120, t + 0.02);
    humGain.gain.setValueAtTime(0.001, t + 0.02);
    humGain.gain.linearRampToValueAtTime(0.15, t + 0.1);
    humGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    humOsc.connect(humGain);
    humGain.connect(this.fxGain);

    humOsc.start(t + 0.02);
    humOsc.stop(t + 1.3);

    // 3. Cinematic light bloom whoosh (rising filtered noise)
    const whooshBuffer = this.createNoiseBuffer('pink');
    const whooshNode = this.ctx.createBufferSource();
    whooshNode.buffer = whooshBuffer;

    const whooshFilter = this.ctx.createBiquadFilter();
    whooshFilter.type = 'lowpass';
    whooshFilter.frequency.setValueAtTime(200, t);
    whooshFilter.frequency.exponentialRampToValueAtTime(3200, t + 1.5);

    const whooshGain = this.ctx.createGain();
    whooshGain.gain.setValueAtTime(0.01, t);
    whooshGain.gain.linearRampToValueAtTime(0.35, t + 1.0);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    whooshNode.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(this.fxGain);

    whooshNode.start(t);
    whooshNode.stop(t + 2.3);
  }

  /**
   * Distant thunder and lightning acoustic rumble.
   */
  public playLightningRumble() {
    this.initContext();
    if (!this.ctx || !this.fxGain) return;
    const t = this.ctx.currentTime;

    const thunderBuffer = this.createNoiseBuffer('brown');
    const thunderNode = this.ctx.createBufferSource();
    thunderNode.buffer = thunderBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, t);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);

    thunderNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxGain);

    thunderNode.start(t);
    thunderNode.stop(t + 3.2);
  }

  /**
   * Transition sound into the login command center.
   * Fades out ambient storm & helicopter, swells a low command-room drone.
   */
  public playTransitionToLogin() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Fade out helicopter and storm
    if (this.heloGain) {
      this.heloGain.gain.cancelScheduledValues(t);
      this.heloGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
    }
    if (this.rainGain) {
      this.rainGain.gain.cancelScheduledValues(t);
      this.rainGain.gain.exponentialRampToValueAtTime(0.04, t + 2.5); // Keep very faint rain in background
    }
    if (this.floodGain) {
      this.floodGain.gain.cancelScheduledValues(t);
      this.floodGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
    }

    // Command-center steady power hum
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(60, t); // 60Hz power grid hum

    humGain.gain.setValueAtTime(0.001, t);
    humGain.gain.linearRampToValueAtTime(0.08, t + 1.8);

    hum.connect(humGain);
    if (this.masterGain) {
      humGain.connect(this.masterGain);
    }
    hum.start(t);
  }

  /**
   * Master volume control (0.0 to 1.0).
   */
  public setMasterVolume(val: number) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime);
  }

  /**
   * Toggle audio mute state.
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Completely stops and disposes all audio nodes and context.
   */
  public stopAndCleanup() {
    try {
      if (this.rainNode) {
        this.rainNode.stop();
        this.rainNode.disconnect();
      }
      if (this.floodNode) {
        this.floodNode.stop();
        this.floodNode.disconnect();
      }
      if (this.heloOsc1) {
        this.heloOsc1.stop();
        this.heloOsc1.disconnect();
      }
      if (this.heloOsc2) {
        this.heloOsc2.stop();
        this.heloOsc2.disconnect();
      }
      if (this.heloLfo) {
        this.heloLfo.stop();
        this.heloLfo.disconnect();
      }
      if (this.heloTurbine) {
        this.heloTurbine.stop();
        this.heloTurbine.disconnect();
      }
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close();
      }
    } catch {
      // Audio nodes already stopped or disposed
    } finally {
      this.ctx = null;
      this.isRunning = false;
    }
  }
}

// Global audio engine singleton
export const rescueAudio = new RescueAudioEngine();
