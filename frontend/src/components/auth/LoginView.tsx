import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { 
  Volume2, 
  VolumeX, 
  Waves, 
  RotateCcw, 
  FastForward
} from 'lucide-react';
import { startStorm, type Storm } from '../../lib/ambience';
import { sfx } from '../../lib/sound';
import { ApiClient } from '../../services/api';
import type { RoleType, AuthStage, AuthResponse } from './types';
import RoleSelectionCards from './RoleSelectionCards';
import LoginForm from './LoginForm';
import NDRFRegisterForm from './NDRFRegisterForm';
import ForgotPasswordModal from './ForgotPasswordModal';
import OperatorRestrictedModal from './OperatorRestrictedModal';
import AuthenticatedSessionCard from './AuthenticatedSessionCard';

interface LoginViewProps {
  onReplayCinematic?: () => void;
  onReturnToHome: () => void;
}

// ----------------- PROCEDURAL CANVAS ENGINE CONSTANTS -----------------
const REVEAL = 14.6; // Login card emerges when torch beam strikes
const END = 25;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (x: number) => x * x * (3 - 2 * x);
const mix = (a: number, b: number, x: number) => a + (b - a) * x;

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const mk = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  return c;
};

function buildScene(W: number, H: number) {
  const wy = Math.round(H * 0.55);
  const r = rng(11);
  const sky = mk(W * 2, wy + 4);
  let c = sky.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, 0, wy);
  g.addColorStop(0, '#1b2125');
  g.addColorStop(0.55, '#454e51');
  g.addColorStop(1, '#8a897e');
  c.fillStyle = g;
  c.fillRect(0, 0, W * 2, wy + 4);

  for (let i = 0; i < 90; i++) {
    const x = r() * W * 2,
      y = r() * wy * 0.8,
      s = 80 + r() * 260,
      dark = r() < 0.65;
    const rg = c.createRadialGradient(0, 0, 0, 0, 0, s);
    rg.addColorStop(0, dark ? 'rgba(34,40,44,.24)' : 'rgba(205,205,195,.16)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.save();
    c.translate(x, y);
    c.scale(1, 0.32);
    c.fillStyle = rg;
    c.beginPath();
    c.arc(0, 0, s, 0, 7);
    c.fill();
    c.restore();
  }

  const vil = mk(W, wy + 60);
  c = vil.getContext('2d')!;
  const trees = (base: number, h: number, col: string, seed: number) => {
    const q = rng(seed);
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, base + 60);
    for (let x = 0; x <= W; x += 12) {
      c.lineTo(x, base - h * (0.4 + 0.6 * q()) - Math.sin(x * 0.01 + seed) * h * 0.25);
    }
    c.lineTo(W, base + 60);
    c.closePath();
    c.fill();
  };

  const sc = H / 800;
  trees(wy - 8, H * 0.1, 'rgba(84,98,90,.85)', 3);
  trees(wy + 2, H * 0.07, 'rgba(44,56,46,.96)', 5);

  const houses: [number, number, number, string, number][] = [
    [0.07, 150, 120, '#a79c88', 0],
    [0.2, 120, 92, '#8a9aa3', 1],
    [0.34, 170, 130, '#b08c72', 0],
    [0.64, 140, 105, '#98a08a', 1],
    [0.77, 180, 140, '#a9a396', 0],
    [0.92, 120, 96, '#9b7f6e', 1],
  ];

  for (const [fx, w0, h0, col, flat] of houses) {
    const x = fx * W,
      w = w0 * sc,
      h = h0 * sc,
      base = wy + h * 0.45,
      side = w * 0.22;
    c.fillStyle = col;
    c.fillRect(x - w / 2, base - h, w, h);
    c.fillStyle = 'rgba(0,0,0,.38)';
    c.beginPath();
    c.moveTo(x + w / 2, base - h);
    c.lineTo(x + w / 2 + side, base - h + 10 * sc);
    c.lineTo(x + w / 2 + side, base + 10);
    c.lineTo(x + w / 2, base);
    c.fill();

    if (flat) {
      c.fillStyle = '#6f6a62';
      c.fillRect(x - w / 2 - 4, base - h - 9 * sc, w + side + 4, 9 * sc);
      c.fillStyle = '#2d3a40';
      c.fillRect(x - w * 0.3, base - h - 26 * sc, 22 * sc, 17 * sc);
    } else {
      const rg = c.createLinearGradient(0, base - h - 38 * sc, 0, base - h);
      rg.addColorStop(0, '#8a7a68');
      rg.addColorStop(1, '#4e4338');
      c.fillStyle = rg;
      c.beginPath();
      c.moveTo(x - w / 2 - 8, base - h);
      c.lineTo(x - w * 0.18, base - h - 38 * sc);
      c.lineTo(x + w * 0.18 + side, base - h - 38 * sc);
      c.lineTo(x + w / 2 + side + 8, base - h + 8 * sc);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(0,0,0,.25)';
      c.lineWidth = 1;
      for (let i = 1; i < 7; i++) {
        c.beginPath();
        c.moveTo(x - w / 2 + i * w / 7, base - h);
        c.lineTo(x - w * 0.18 + i * (w * 0.36 + side) / 7, base - h - 38 * sc);
        c.stroke();
      }
    }

    for (const wx of [-0.28, 0.14]) {
      c.fillStyle = '#1a2227';
      c.fillRect(x + wx * w, base - h * 0.72, w * 0.16, h * 0.22);
      c.strokeStyle = 'rgba(230,230,220,.45)';
      c.strokeRect(x + wx * w, base - h * 0.72, w * 0.16, h * 0.22);
    }

    c.fillStyle = '#3b2f26';
    c.fillRect(x - w * 0.06, base - h * 0.42, w * 0.14, h * 0.42);
    const st = c.createLinearGradient(0, base - h * 0.3, 0, base + 10);
    st.addColorStop(0, 'rgba(80,62,42,0)');
    st.addColorStop(1, 'rgba(80,62,42,.7)');
    c.fillStyle = st;
    c.fillRect(x - w / 2, base - h * 0.3, w + side, h * 0.3 + 10);
  }

  for (const fx of [0.14, 0.5, 0.86]) {
    const x = fx * W,
      b = wy + 8,
      t = 150 * sc;
    c.strokeStyle = '#4a3b2c';
    c.lineWidth = 6 * sc;
    c.beginPath();
    c.moveTo(x, b);
    c.quadraticCurveTo(x + 14 * sc, b - t / 2, x + 6 * sc, b - t);
    c.stroke();
    c.strokeStyle = '#2a3b26';
    c.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const an = (i / 9) * Math.PI * 2;
      c.beginPath();
      c.moveTo(x + 6 * sc, b - t);
      c.quadraticCurveTo(
        x + 6 * sc + Math.cos(an) * 40 * sc,
        b - t - 30 * sc,
        x + 6 * sc + Math.cos(an) * 70 * sc,
        b - t + Math.abs(Math.sin(an)) * 40 * sc
      );
      c.stroke();
    }
  }

  const hz = c.createLinearGradient(0, wy - H * 0.2, 0, wy + 20);
  hz.addColorStop(0, 'rgba(170,170,160,0)');
  hz.addColorStop(1, 'rgba(170,170,160,.28)');
  c.fillStyle = hz;
  c.fillRect(0, wy - H * 0.2, W, H * 0.2 + 20);

  return { wy, sky, vil };
}

type SceneType = ReturnType<typeof buildScene>;

export function LoginView({ onReturnToHome }: LoginViewProps) {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const startRef = useRef(0);
  const stormRef = useRef<Storm | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [caption, setCaption] = useState('Flash flood · raging current · a man is being swept away');
  const [ready, setReady] = useState(false);

  // Auth Gateway States (Phase 3)
  const [authStage, setAuthStage] = useState<AuthStage>('role_selection');
  const [selectedRole, setSelectedRole] = useState<RoleType>('RELIEF_CENTER');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showOperatorLockedModal, setShowOperatorLockedModal] = useState(false);
  const [authData, setAuthData] = useState<AuthResponse | null>(null);

  // ----------------- CANVAS LIFECYCLE & RESCUE ANIMATION -----------------
  useEffect(() => {
    const canvas = cv.current!;
    const box = root.current!;
    const ctx = canvas.getContext('2d')!;

    let W = 0,
      H = 0,
      S: SceneType = buildScene(1, 1),
      raf = 0,
      last = 0,
      revealed = false,
      capIdx = -1,
      prevFl = 0;
    let rain: { x: number; y: number; l: number; v: number }[] = [];
    let P = { x: 0, y: 0 };

    startRef.current = performance.now() - (reduceMotion ? END * 1000 : 0);

    const caps: [number, string][] = [
      [0, 'Flash flood · raging current · a man is being swept away'],
      [4, 'NDRF rescue helicopter on scene'],
      [5.6, 'Lowering the rescue line…'],
      [8.8, 'Man has the rope · lifting him clear of the water'],
      [11.2, 'He signals with a torch from left to right…'],
      [REVEAL, 'Signal received · sign in to enter the command center'],
    ];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = box.clientWidth;
      H = box.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S = buildScene(W, H);
      const r = rng(5);
      rain = Array.from({ length: Math.round(W / 3) }, () => ({
        x: r() * W,
        y: r() * H,
        l: 10 + r() * 16,
        v: 700 + r() * 500,
      }));
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    const limb = (a: number[], b: number[], w: number, col: string) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    };

    const beam = (sx: number, sy: number, tx: number, ty: number, spread: number, al: number) => {
      if (al <= 0) return;
      const ang = Math.atan2(ty - sy, tx - sx),
        len = Math.hypot(tx - sx, ty - sy);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(sx, sy);
      ctx.rotate(ang);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, `rgba(255,248,225,${0.6 * al})`);
      g.addColorStop(1, `rgba(255,248,225,${0.16 * al})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(len, -spread);
      ctx.lineTo(len, spread);
      ctx.lineTo(0, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const rg = ctx.createRadialGradient(tx, ty, 0, tx, ty, spread * 1.5);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      rg.addColorStop(0, `rgba(255,250,235,${0.55 * al})`);
      rg.addColorStop(1, 'rgba(255,250,235,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(tx, ty, spread * 1.5, 0, 7);
      ctx.fill();
      ctx.restore();
    };

    const heli = (x: number, y: number, k: number, tilt: number, a: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.scale(k, k);

      const body = ctx.createLinearGradient(0, -70, 0, 52);
      body.addColorStop(0, '#6a755d');
      body.addColorStop(0.5, '#3f4837');
      body.addColorStop(1, '#1c211a');
      ctx.fillStyle = body;
      ctx.strokeStyle = '#11150f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(215, 12);
      ctx.bezierCurveTo(215, -25, 180, -50, 125, -54);
      ctx.lineTo(-70, -58);
      ctx.lineTo(-150, -40);
      ctx.lineTo(-262, -28);
      ctx.lineTo(-278, -72);
      ctx.lineTo(-250, -72);
      ctx.lineTo(-236, -14);
      ctx.lineTo(-130, 4);
      ctx.lineTo(-80, 48);
      ctx.lineTo(150, 50);
      ctx.bezierCurveTo(195, 50, 215, 35, 215, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#36402f';
      ctx.beginPath();
      ctx.ellipse(20, -66, 62, 15, 0, 0, 7);
      ctx.fill();

      ctx.fillStyle = '#1a2830';
      ctx.beginPath();
      ctx.moveTo(205, 8);
      ctx.bezierCurveTo(200, -22, 170, -42, 130, -46);
      ctx.lineTo(118, 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(190,220,235,.25)';
      ctx.beginPath();
      ctx.moveTo(190, -4);
      ctx.lineTo(165, -34);
      ctx.lineTo(140, -38);
      ctx.lineTo(136, -4);
      ctx.fill();

      ctx.fillStyle = '#141b20';
      for (let i = 0; i < 3; i++) ctx.fillRect(60 - i * 42, -38, 24, 20);
      ctx.strokeStyle = 'rgba(0,0,0,.45)';
      ctx.strokeRect(-30, -4, 58, 50);
      ctx.fillStyle = '#ff5722';
      ctx.fillRect(-80, 33, 295, 5);

      // High-Visibility Labels
      ctx.fillStyle = '#f2f2ea';
      ctx.font = '900 40px Arial Black, Arial, sans-serif';
      ctx.fillText('NDRF', 40, 26);
      ctx.save();
      ctx.rotate(-0.07);
      ctx.font = '900 30px Arial Black, Arial, sans-serif';
      ctx.fillText('NDRF', -225, -8);
      ctx.restore();

      // Mast & Landing Skids
      ctx.fillStyle = '#d6d6cc';
      ctx.fillRect(-4, -92, 8, 30);
      ctx.strokeStyle = '#0e110d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(110, 50);
      ctx.lineTo(112, 62);
      ctx.moveTo(-30, 50);
      ctx.lineTo(-30, 62);
      ctx.stroke();
      ctx.fillStyle = '#0e110d';
      ctx.beginPath();
      ctx.arc(112, 66, 9, 0, 7);
      ctx.arc(-30, 66, 9, 0, 7);
      ctx.fill();

      // Tail Strobe Flasher
      ctx.fillStyle = '#ef4444';
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(a * 6);
      ctx.beginPath();
      ctx.arc(-276, -74, 3, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Spinning Rotor Blur & Blades
      ctx.fillStyle = 'rgba(15,18,14,.3)';
      ctx.beginPath();
      ctx.ellipse(0, -90, 310, 7, 0, 0, 7);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15,18,14,.35)';
      ctx.lineWidth = 7;
      for (let i = 0; i < 5; i++) {
        const ca = Math.cos(a * 55 + i * 1.2566) * 310;
        ctx.beginPath();
        ctx.moveTo(0, -90);
        ctx.lineTo(ca, -90 + ca * 0.012);
        ctx.stroke();
      }

      // Spinning Tail Rotor
      ctx.fillStyle = 'rgba(20,20,18,.35)';
      ctx.beginPath();
      ctx.ellipse(-272, -50, 5, 28 * Math.abs(Math.cos(a * 40)) + 4, 0, 0, 7);
      ctx.fill();
      ctx.restore();
    };

    const man = (
      hx: number,
      hy: number,
      s: number,
      a: number,
      wyM: number,
      hands: number[][],
      flail: boolean
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, wyM + Math.sin(a * 3) * 1.5);
      ctx.clip();
      const shirt = '#434e58',
        pants = '#2a303a',
        hip = [hx, hy + 70 * s];
      const sw = Math.sin(a * 2.2);
      const knee = flail ? [hx, hy + 100 * s] : [hx + sw * 6 * s, hy + 98 * s];
      const foot = flail ? [hx, hy + 130 * s] : [hx + Math.sin(a * 2.2 + 1) * 12 * s, hy + 128 * s];
      limb(hip, knee, 15 * s, pants);
      limb(knee, foot, 13 * s, pants);
      limb([hx - 6 * s, hy + 24 * s], hip, 34 * s, shirt);
      const sh = [
        [hx - 17 * s, hy + 22 * s],
        [hx + 17 * s, hy + 22 * s],
      ];
      hands.forEach((h, i) => {
        const el = [(sh[i][0] + h[0]) / 2 + (i ? 9 : -9) * s, (sh[i][1] + h[1]) / 2 + 6 * s];
        limb(sh[i], el, 11 * s, shirt);
        limb(el, h, 9 * s, '#7a553d');
        ctx.fillStyle = '#8a6249';
        ctx.beginPath();
        ctx.arc(h[0], h[1], 5.5 * s, 0, 7);
        ctx.fill();
      });
      limb([hx, hy + 10 * s], [hx, hy + 22 * s], 9 * s, '#7a553d');
      const sg = ctx.createRadialGradient(hx - 4 * s, hy - 5 * s, 1, hx, hy, 15 * s);
      sg.addColorStop(0, '#b78a68');
      sg.addColorStop(1, '#5e3d2a');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.ellipse(hx, hy, 10.5 * s, 13 * s, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#0f0c0b';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 5 * s, 11.5 * s, 9.5 * s, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(hx - 11.5 * s, hy - 6 * s, 3 * s, 9 * s);
      if (flail) {
        ctx.fillStyle = '#2a1410';
        ctx.beginPath();
        ctx.ellipse(hx + s, hy + 6 * s, 3 * s, 2.4 * s, 0, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = '#1c1210';
      ctx.fillRect(hx - 5 * s, hy - 1 * s, 2.5 * s, 1.6 * s);
      ctx.fillRect(hx + 3 * s, hy - 1 * s, 2.5 * s, 1.6 * s);
      ctx.restore();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      const a = now / 1000;
      const t = reduceMotion ? END : (now - startRef.current) / 1000;
      const wy = S.wy,
        k = clamp(W / 1500, 0.5, 1.1),
        s = k * 1.4,
        wyM = wy + H * 0.1,
        mx = W * 0.2;

      // 1. Sky + Flooded Village
      ctx.drawImage(S.sky, -W * 0.5 * (1 + Math.sin(a * 0.03)), 0);
      ctx.drawImage(S.vil, 0, 0);

      // 2. Surging Flood Water
      const wg = ctx.createLinearGradient(0, wy, 0, H);
      wg.addColorStop(0, '#6e5d44');
      wg.addColorStop(0.35, '#4d3f2d');
      wg.addColorStop(1, '#1d160e');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) {
        ctx.lineTo(x, wy + Math.sin(x * 0.02 + a * 3) * 4 + Math.sin(x * 0.051 - a * 4.5) * 2.5);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // 3. Rippling Water Reflection
      for (let y = 0; y < Math.min(H - wy, 260); y += 3) {
        ctx.globalAlpha = 0.34 * (1 - y / 260);
        ctx.drawImage(
          S.vil,
          0,
          wy - y - 3,
          W,
          3,
          Math.sin(y * 0.16 + a * 4) * (4 + y * 0.07),
          wy + y + 4,
          W,
          3
        );
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(70,55,36,.35)';
      ctx.fillRect(0, wy + 10, W, 40);

      // 4. Raging Flood Current Crests & Foam
      for (let r = 0; r < 14; r++) {
        const u = r / 13,
          y = wy + 16 + Math.pow(u, 1.6) * (H - wy - 16),
          amp = 2 + u * 14,
          wl = 60 + u * 220,
          sp = 60 + u * 260;
        ctx.strokeStyle = `rgba(235,225,200,${0.1 + 0.22 * u})`;
        ctx.lineWidth = 1 + u * 3;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 14) {
          const yy = y + Math.sin(((x + a * sp) / wl) * 6.283 + r) * amp;
          if (x) ctx.lineTo(x, yy);
          else ctx.moveTo(x, yy);
        }
        ctx.stroke();
      }

      // Foam streaks
      for (let i = 0; i < 160; i++) {
        const u = (i * 0.6180339) % 1,
          y = wy + 18 + u * u * (H - wy - 18),
          len = 10 + u * 70;
        const x = (((i * 97 + a * (90 + u * 380)) % (W + 200)) + W + 200) % (W + 200) - 100;
        ctx.strokeStyle = `rgba(240,232,210,${0.12 + 0.35 * (((i * 7) % 10) / 10)})`;
        ctx.lineWidth = 1 + u * 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y + Math.sin(a * 5 + i) * 1.5);
        ctx.stroke();
      }

      // Floating flood debris (wooden logs, barrels, pallets, tires)
      for (let i = 0; i < 8; i++) {
        const u = 0.12 + ((i * 0.11) % 0.85),
          sz = k * (16 + u * 56),
          type = i % 4;
        const x = (((i * 271 + a * (70 + u * 240)) % (W + 400)) + W + 400) % (W + 400) - 200,
          y = wy + 30 + u * (H - wy - 60) + Math.sin(a * 2 + i) * (3 + u * 8);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(a * 1.3 + i) * 0.12);
        ctx.fillStyle = 'rgba(240,232,210,.35)';
        ctx.beginPath();
        ctx.ellipse(-sz * 1.1, sz * 0.12, sz * 0.9, sz * 0.12, 0, 0, 7);
        ctx.fill();
        if (type === 0) {
          ctx.fillStyle = '#3b2c1e';
          ctx.fillRect(-sz, -sz * 0.13, sz * 2, sz * 0.27);
          ctx.fillStyle = 'rgba(255,255,255,.12)';
          ctx.fillRect(-sz, -sz * 0.13, sz * 2, sz * 0.05);
        } else if (type === 1) {
          ctx.fillStyle = '#8a9093';
          ctx.fillRect(-sz, -sz * 0.08, sz * 1.8, sz * 0.2);
          ctx.strokeStyle = 'rgba(0,0,0,.3)';
          for (let q = 1; q < 8; q++) {
            ctx.beginPath();
            ctx.moveTo(-sz + q * sz * 0.22, -sz * 0.08);
            ctx.lineTo(-sz + q * sz * 0.22, sz * 0.12);
            ctx.stroke();
          }
        } else if (type === 2) {
          ctx.strokeStyle = '#141414';
          ctx.lineWidth = sz * 0.28;
          ctx.beginPath();
          ctx.ellipse(0, 0, sz * 0.5, sz * 0.2, 0, 0, 7);
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#4a3825';
          ctx.lineWidth = sz * 0.14;
          ctx.beginPath();
          ctx.moveTo(-sz, 0);
          ctx.lineTo(sz, -sz * 0.1);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Calculate Login Card Target Point P (on Right Side of Viewport)
      if (card.current && box) {
        const c = card.current.getBoundingClientRect(),
          b = box.getBoundingClientRect();
        P = {
          x: c.left - b.left + c.width / 2,
          y: c.top - b.top + c.height / 2,
        };
      } else {
        P = { x: W * 0.72, y: H * 0.48 };
      }

      // 6. Helicopter Motion (Approaches -> Hovers -> Leaves behind card)
      const hov = mx - 10 * k,
        leave = ease(seg(t, 17.6, 23));
      const hx =
        mix(-300 * k, hov, ease(seg(t, 0, 4.5))) +
        Math.sin(a * 1.1) * 3 +
        leave * (W * 0.95 + 400 * k);
      const hy =
        mix(H * 0.08, H * 0.2, ease(seg(t, 0, 4.5))) -
        16 * ease(seg(t, 8.6, 11)) -
        leave * H * 0.12 +
        Math.sin(a * 1.7) * 2;
      const tilt =
        0.07 * (1 - ease(seg(t, 2.5, 4.5))) +
        0.1 * Math.sin(Math.min(1, leave * 1.4) * Math.PI * 0.6);
      const ax = hx + 10 * k,
        ay = hy + 52 * k;

      // Sound update (pans with X position across screen, fades as it leaves)
      stormRef.current?.setHeli(
        ease(seg(t, 0.2, 4.5)) * (1 - leave),
        clamp((hx / W) * 2 - 1, -1, 1) * 0.85
      );

      // Downward rotor wind displacement on water
      if (t > 3 && t < 17.8) {
        for (let i = 0; i < 3; i++) {
          const p = (a * 0.6 + i / 3) % 1;
          ctx.strokeStyle = `rgba(225,220,200,${0.3 * (1 - p)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(mx, wyM + 6 * k, (40 + p * 150) * k, (6 + p * 16) * k, 0, 0, 7);
          ctx.stroke();
        }
      }

      // 7. Rescue Line & Survivor Lift from Water
      const ext = ease(seg(t, 4.8, 7)),
        endLow = wyM - 70 * s,
        hangY = Math.max(Math.min(endLow - 10, wyM - 230 * s), ay + 60 * k);
      const endY =
        t < 8.6
          ? mix(ay + 4 * k, endLow, ext)
          : mix(endLow, hangY, ease(seg(t, 8.6, 11)));
      const swing = Math.sin(a * 1.5) * 12 * k * seg(t, 8.6, 10),
        lean = -45 * k * ease(seg(t, 17.6, 19.5));
      const endX = ax + (mx - ax) * ext * (1 - seg(t, 8.6, 9)) + swing + lean;
      const grab = ease(seg(t, 7.3, 8.6));

      let torch: number[] | null = null,
        torchDir = [0, 1],
        torchOn = 0;

      if (hx < W + 500 * k) {
        // Steel cable
        if (t > 4.8) {
          ctx.strokeStyle = '#cdb98e';
          ctx.lineWidth = 3.2 * k + 1;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo(
            (ax + endX) / 2 + Math.sin(a * 2) * 6 * k * ext,
            (ay + endY) / 2,
            endX,
            endY
          );
          ctx.stroke();
          ctx.strokeStyle = 'rgba(80,60,30,.7)';
          ctx.setLineDash([3, 5]);
          ctx.lineWidth = 2 * k + 0.5;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const hxS = mx + Math.sin(a * 1.3) * 4 * s,
          hyS =
            wyM -
            22 * s +
            Math.sin(a * 2.1) * 5 * s +
            Math.max(0, Math.sin(a * 0.9)) * 9 * s;
        const mhx = mix(hxS, endX, grab),
          mhy = mix(hyS, endY + 36 * s, grab);
        const reach = Math.max(ease(seg(t, 6.2, 7.3)) * 0.7, grab);
        const fR = [
          hxS + 34 * s + Math.sin(a * 5) * 12 * s,
          hyS - 30 * s - Math.abs(Math.cos(a * 3.7)) * 26 * s,
        ];
        const fL = [
          hxS - 30 * s + Math.sin(a * 4.3) * 10 * s,
          hyS + 6 * s + Math.cos(a * 6) * 8 * s,
        ];
        const rr = [mix(fR[0], endX + 3 * s, reach), mix(fR[1], endY, reach)];
        const shR = [mhx + 17 * s, mhy + 22 * s],
          dx = P.x - shR[0],
          dy = P.y - shR[1],
          dl = Math.hypot(dx, dy) || 1;

        // Torch aims directly from LEFT across to RIGHT end!
        torchDir = [dx / dl, dy / dl];
        torchOn = ease(seg(t, 10.8, 11.8)) * (1 - ease(seg(t, 18, 19)));
        const th = [shR[0] + torchDir[0] * 40 * s, shR[1] + torchDir[1] * 40 * s];
        const hands = [
          [mix(fL[0], endX - 3 * s, grab), mix(fL[1], endY, grab)],
          [mix(rr[0], th[0], torchOn), mix(rr[1], th[1], torchOn)],
        ];

        // Draw the man
        man(mhx, mhy, s, a, wyM, hands, grab < 0.5);

        if (torchOn > 0.05) torch = hands[1];

        // Water ripple circles around survivor's body
        const ry = wyM + Math.sin(a * 3) * 1.5;
        for (let i = 0; i < 3; i++) {
          const p = (a * 0.8 + i / 3) % 1;
          ctx.strokeStyle = `rgba(230,225,205,${0.45 * (1 - p)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(hxS, ry, (18 + p * 40) * s, (3 + p * 8) * s, 0, 0, 7);
          ctx.stroke();
        }
      }

      // Draw Helicopter
      heli(hx, hy, k, tilt, a);

      // Searchlight sweeping down from helicopter
      const ls = [hx + 150 * k, hy + 46 * k];
      beam(
        ls[0],
        ls[1],
        mix(mx, endX, grab),
        mix(wyM - 10 * s, endY + 60 * s, grab),
        mix(150, 55, grab) * k,
        seg(t, 3.4, 4.6) * (1 - 0.55 * grab) * (1 - seg(t, 17.6, 19))
      );

      // 8. HANDHELD TORCH BEAM (FROM LEFT TO RIGHT END)
      if (torch) {
        ctx.save();
        ctx.fillStyle = '#15181c';
        ctx.translate(torch[0], torch[1]);
        ctx.rotate(Math.atan2(torchDir[1], torchDir[0]));
        ctx.fillRect(-4 * s, -4 * s, 20 * s, 8 * s);
        ctx.fillStyle = '#fff6d8';
        ctx.fillRect(16 * s, -5.5 * s, 3 * s, 11 * s);
        ctx.restore();

        // Beam sweeps from left to right end!
        beam(
          torch[0] + torchDir[0] * 19 * s,
          torch[1] + torchDir[1] * 19 * s,
          P.x,
          P.y,
          46 * k,
          torchOn
        );
      }

      // 9. Radial Light Bloom on Login Card
      const gr = ease(seg(t, 12.2, REVEAL + 0.6)),
        ga = 1 - 0.55 * seg(t, REVEAL + 1, REVEAL + 3.5);
      if (gr > 0) {
        const r = mix(10, Math.max(W, H) * 0.35, gr);
        const g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, r);
        g.addColorStop(0, `rgba(255,252,238,${0.6 * ga})`);
        g.addColorStop(0.4, `rgba(255,240,200,${0.3 * ga})`);
        g.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(P.x, P.y, r, 0, 7);
        ctx.fill();
        ctx.restore();
      }

      // 10. Rain + Splashes
      ctx.strokeStyle = 'rgba(235,230,210,.28)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.ellipse(
          Math.random() * W,
          wy + 20 + Math.random() * (H - wy - 20),
          2 + Math.random() * 7,
          1 + Math.random() * 2,
          0,
          0,
          7
        );
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(215,225,230,.42)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of rain) {
        d.y += d.v * dt;
        d.x -= d.v * dt * 0.3;
        if (d.y > H) {
          d.y = -20;
          d.x = Math.random() * (W + 120);
        }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.l * 0.3, d.y - d.l);
      }
      ctx.stroke();

      // 11. Lightning & Thunder
      const m = a % 7,
        fl =
          m > 3 && m < 3.1
            ? 0.4
            : m > 3.2 && m < 3.3
            ? 0.22
            : m > 5.5 && m < 5.58
            ? 0.25
            : 0;
      if (fl) {
        ctx.fillStyle = `rgba(225,235,245,${fl})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (fl && !prevFl) stormRef.current?.thunder(fl / 0.4);
      prevFl = fl;

      const dk = ctx.createLinearGradient(0, 0, 0, H);
      dk.addColorStop(0, 'rgba(8,12,16,.5)');
      dk.addColorStop(1, 'rgba(8,12,16,.3)');
      ctx.fillStyle = dk;
      ctx.fillRect(0, 0, W, H);

      // 12. Captions & Reveal Login Card
      let ci = 0;
      caps.forEach(([ct], i) => {
        if (t >= ct) ci = i;
      });
      if (ci !== capIdx) {
        capIdx = ci;
        setCaption(caps[ci][1]);
      }

      if (t >= REVEAL && !revealed) {
        revealed = true;
        setReady(true);
        sfx.accept();
        gsap.fromTo(
          card.current,
          { autoAlpha: 0, scale: 0.9, filter: 'brightness(3)' },
          {
            autoAlpha: 1,
            scale: 1,
            filter: 'brightness(1)',
            duration: reduceMotion ? 0 : 1.2,
            ease: 'power3.out',
          }
        );
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (card.current) gsap.killTweensOf(card.current);
    };
  }, [reduceMotion]);

  // Audio Ambience
  useEffect(() => {
    if (!soundEnabled) return;
    const storm = startStorm();
    stormRef.current = storm;
    return () => {
      storm.stop();
      if (stormRef.current === storm) stormRef.current = null;
    };
  }, [soundEnabled]);

  // Skip Intro / Fast Forward to Login
  const handleSkipIntro = () => {
    startRef.current = performance.now() - REVEAL * 1000;
    setReady(true);
    sfx.accept();
    if (card.current) {
      gsap.to(card.current, {
        autoAlpha: 1,
        scale: 1,
        filter: 'brightness(1)',
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  };

  // Replay
  const handleReplay = () => {
    startRef.current = performance.now();
    setReady(false);
    if (card.current) {
      gsap.set(card.current, { autoAlpha: 0, scale: 0.9 });
    }
  };

  const handleLogout = async () => {
    await ApiClient.logout();
    setAuthData(null);
    setAuthStage('role_selection');
  };

  return (
    <div ref={root} className="relative h-screen w-screen overflow-hidden bg-[#02050c] text-slate-100 font-sans select-none">
      {/* ----------------- PROCEDURAL CANVAS SIMULATION ----------------- */}
      <canvas ref={cv} className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden />

      {/* Atmospheric Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,5,12,0.65)_100%)]" />

      {/* ----------------- TOP TACTICAL NAVIGATION BAR ----------------- */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 md:px-8">
        <div className="cursor-pointer" onClick={onReturnToHome}>
          <div className="text-xl sm:text-2xl font-black tracking-[0.2em] text-white flex items-center gap-1.5 font-mono">
            <span>RESQ</span>
            <span className="text-emergency-orange">-X</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/80 font-mono">
            Disaster Relief Command System
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!ready && (
            <button
              onClick={handleSkipIntro}
              className="btn btn-amber text-xs font-mono !py-1.5"
              title="Skip straight to login form"
            >
              <FastForward size={14} />
              <span className="hidden sm:inline">SKIP INTRO</span>
            </button>
          )}

          <button
            onClick={handleReplay}
            className="btn text-xs font-mono !py-1.5"
            title="Replay Rescue Scene"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">REPLAY</span>
          </button>

          <button
            className="btn text-xs font-mono !py-1.5"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={14} className="text-cyan-400" /> : <VolumeX size={14} className="text-rose-400" />}
          </button>

          <button
            className="btn text-xs font-mono !py-1.5"
            onClick={() => setReduceMotion(!reduceMotion)}
            title="Toggle reduced motion"
          >
            <Waves size={14} />
          </button>

          <button
            onClick={onReturnToHome}
            className="btn text-xs font-mono !py-1.5 bg-emergency-orange/80 hover:bg-emergency-orange text-white border-emergency-orange"
          >
            <span>HOME</span>
          </button>
        </div>
      </div>

      {/* ----------------- SUBTITLES / MISSION TICKER ----------------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
        <div className="rounded-full border border-cyan-400/30 bg-slate-950/80 backdrop-blur-md px-4 py-1.5 text-xs text-cyan-200 font-mono shadow-2xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emergency-orange animate-ping" />
          <span>{caption}</span>
        </div>
      </div>

      {/* ----------------- LOGIN & ROLE SELECTION GATEWAY (ILLUMINATED BY TORCH) ----------------- */}
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center sm:justify-end px-3 sm:px-6 lg:px-12 overflow-y-auto py-16">
        <div
          ref={card}
          className="pointer-events-auto invisible relative w-full max-w-2xl p-5 sm:p-7 rounded-2xl border border-cyan-400/40 bg-slate-950/85 backdrop-blur-2xl shadow-[0_0_60px_rgba(249,115,22,0.22)]"
          style={{ visibility: 'hidden' }}
        >
          {/* Subtle Orange Ambient Backlighting */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.14),transparent_65%)]" />

          <div className="relative z-10">
            {/* Command Gateway Header with RESQ-X Logo */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emergency-orange opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emergency-orange" />
                </span>
                <span className="text-lg font-black tracking-widest text-white font-mono flex items-center gap-1">
                  <span>RESQ</span>
                  <span className="text-emergency-orange">-X</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  DISASTER RELIEF PLATFORM
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300/80">
                ACTIVE RADAR // LIVE
              </span>
            </div>

            {/* Stage Routing */}
            {authStage === 'authenticated' && authData ? (
              <AuthenticatedSessionCard
                authData={authData}
                onLogout={handleLogout}
                onReturnToHome={onReturnToHome}
              />
            ) : authStage === 'register_ndrf' ? (
              <NDRFRegisterForm
                onBackToLogin={() => setAuthStage('login')}
                onSuccess={() => {
                  setAuthStage('login');
                }}
              />
            ) : authStage === 'login' ? (
              <LoginForm
                role={selectedRole}
                onBackToRoles={() => setAuthStage('role_selection')}
                onSuccess={(data) => {
                  setAuthData(data);
                  setAuthStage('authenticated');
                }}
                onOpenForgot={() => setShowForgotModal(true)}
                onOpenNDRFRegister={selectedRole === 'RELIEF_CENTER' ? () => setAuthStage('register_ndrf') : undefined}
              />
            ) : (
              <RoleSelectionCards
                onSelectRole={(r) => {
                  setSelectedRole(r);
                  setAuthStage('login');
                }}
                onOpenNDRFRegister={() => {
                  setSelectedRole('RELIEF_CENTER');
                  setAuthStage('register_ndrf');
                }}
                onOpenOperatorLocked={() => setShowOperatorLockedModal(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Security Modals */}
      {showForgotModal && (
        <ForgotPasswordModal
          role={selectedRole}
          onClose={() => setShowForgotModal(false)}
        />
      )}

      {showOperatorLockedModal && (
        <OperatorRestrictedModal
          onClose={() => setShowOperatorLockedModal(false)}
          onProceedToLogin={() => {
            setShowOperatorLockedModal(false);
            setSelectedRole('OPERATOR');
            setAuthStage('login');
          }}
        />
      )}
    </div>
  );
}
