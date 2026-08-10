import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/innoxel-logo.png';

// --- Procedural Web Audio API Synthesizer Class ---
class CinematicSynth {
  constructor() {
    this.ctx = null;
    this.droneOsc = null;
    this.droneGain = null;
    this.swellGain = null;
    this.impactGain = null;
    this.whooshGain = null;
    this.whiteNoiseNode = null;
    this.oscs = [];
    this.initialized = false;
    this.muted = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  playDrone() {
    if (!this.initialized || this.muted) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();

      // Create white noise source for rumbling wind
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      this.whiteNoiseNode = ctx.createBufferSource();
      this.whiteNoiseNode.buffer = noiseBuffer;
      this.whiteNoiseNode.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(65, ctx.currentTime);

      this.droneGain = ctx.createGain();
      this.droneGain.gain.setValueAtTime(0, ctx.currentTime);
      this.droneGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.5);

      this.whiteNoiseNode.connect(filter);
      filter.connect(this.droneGain);
      this.droneGain.connect(ctx.destination);
      
      this.whiteNoiseNode.start();
    } catch (e) {
      console.error(e);
    }
  }

  playSwell() {
    if (!this.initialized || this.muted) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const freqs = [146.83, 174.61, 220.00, 261.63]; // D minor 7th (D3, F3, A3, C4)
      this.oscs = [];

      this.swellGain = ctx.createGain();
      this.swellGain.gain.setValueAtTime(0, ctx.currentTime);
      this.swellGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 3.0);
      this.swellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5.0);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 3.0);

      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 15, ctx.currentTime);
        osc.connect(filter);
        osc.start();
        this.oscs.push(osc);
      });

      filter.connect(this.swellGain);
      this.swellGain.connect(ctx.destination);
    } catch (e) {
      console.error(e);
    }
  }

  playImpact() {
    if (!this.initialized || this.muted) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();

      // Deep sub-bass boom
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.4);

      this.impactGain = ctx.createGain();
      this.impactGain.gain.setValueAtTime(0, ctx.currentTime);
      this.impactGain.gain.linearRampToValueAtTime(0.75, ctx.currentTime + 0.05);
      this.impactGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

      // Noise click layer for high-end crispness
      const noiseSource = ctx.createBufferSource();
      const bufferSize = 0.5 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noiseSource.buffer = noiseBuffer;

      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(900, ctx.currentTime);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0, ctx.currentTime);
      clickGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(this.impactGain);
      this.impactGain.connect(ctx.destination);

      noiseSource.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(ctx.destination);

      osc.start();
      noiseSource.start();

      setTimeout(() => {
        try {
          osc.stop();
          noiseSource.stop();
        } catch {}
      }, 2500);
    } catch (error) {
      console.error(error);
    }
  }

  playWhoosh() {
    if (!this.initialized || this.muted) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();

      // Wing swoosh sound
      const whooshSource = ctx.createBufferSource();
      const bufferSize = 2.5 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      whooshSource.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(120, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.7);
      filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 2.0);
      filter.Q.setValueAtTime(4.0, ctx.currentTime);

      this.whooshGain = ctx.createGain();
      this.whooshGain.gain.setValueAtTime(0, ctx.currentTime);
      this.whooshGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.6);
      this.whooshGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

      whooshSource.connect(filter);
      filter.connect(this.whooshGain);

      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.setValueAtTime(-0.8, ctx.currentTime);
        panner.pan.linearRampToValueAtTime(0.8, ctx.currentTime + 1.6);
        this.whooshGain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        this.whooshGain.connect(ctx.destination);
      }

      whooshSource.start();
      setTimeout(() => {
        try {
          whooshSource.stop();
        } catch {}
      }, 3000);
    } catch (error) {
      console.error(error);
    }
  }

  setMute(isMuted) {
    this.muted = isMuted;
    if (isMuted) {
      this.stopAll();
    } else {
      this.playDrone();
    }
  }

  stopAll() {
    try {
      if (this.whiteNoiseNode) {
        this.whiteNoiseNode.stop();
        this.whiteNoiseNode = null;
      }
      if (this.oscs) {
        this.oscs.forEach(osc => {
          try { osc.stop(); } catch {}
        });
        this.oscs = [];
      }
      if (this.droneGain) this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.swellGain) this.swellGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.impactGain) this.impactGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.whooshGain) this.whooshGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } catch {}
  }
}

export default function WelcomeScreen({ onTransitionStart, onSkipIntro, isSoundMuted, setIsSoundMuted }) {
  const canvasRef = useRef(null);
  const logoImageRef = useRef(null);
  const animationFrameRef = useRef(null);
  const soundInitializedRef = useRef(false);

  const [timelineTime, setTimelineTime] = useState(0);
  const [localMuted, setLocalMuted] = useState(true);
  const isMuted = isSoundMuted !== undefined ? isSoundMuted : localMuted;
  const setIsMuted = setIsSoundMuted !== undefined ? setIsSoundMuted : setLocalMuted;
  const [logoPoints, setLogoPoints] = useState([]);
  
  // Create audio synth once
  const synth = useMemo(() => new CinematicSynth(), []);

  // Determine timeline phase string (Stretched dynamically for a 20-second cinematic build)
  const timelinePhase = useMemo(() => {
    if (timelineTime < 3.5) return 'anticipation';
    if (timelineTime < 7.0) return 'emergence';
    if (timelineTime < 9.3) return 'meaning1';
    if (timelineTime < 11.5) return 'meaning2';
    if (timelineTime < 17.5) return 'reveal';
    return 'wipe';
  }, [timelineTime]);

  // Load logo and extract morph coordinates
  useEffect(() => {
    const img = new Image();
    img.src = logoImg;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      logoImageRef.current = img;
      try {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        // Scan at 80x80 for clean particle density and performance
        tempCanvas.width = 80;
        tempCanvas.height = 80;
        tempCtx.drawImage(img, 0, 0, 80, 80);
        const data = tempCtx.getImageData(0, 0, 80, 80).data;
        const points = [];
        for (let y = 0; y < 80; y += 2) {
          for (let x = 0; x < 80; x += 2) {
            const idx = (y * 80 + x) * 4;
            const alpha = data[idx + 3];
            if (alpha > 120) {
              points.push({ x: x - 40, y: y - 40 });
            }
          }
        }
        setLogoPoints(points);
      } catch (err) {
        console.warn("Failed scanning logo pixels, defaulting to preset grid", err);
      }
    };
  }, []);

  // Window listeners to initialize audio on first user click
  useEffect(() => {
    const handleInteraction = () => {
      if (!soundInitializedRef.current) {
        synth.init();
        soundInitializedRef.current = true;
        if (!isMuted) {
          synth.playDrone();
        }
      }
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [isMuted, synth]);

  // Main canvas animation and sound timing trigger loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    // Sound triggers tracker
    let droneTriggered = false;
    let swellTriggered = false;
    let impactTriggered = false;
    let whooshTriggered = false;
    let transitionTriggered = false;

    // Particles Setup
    const ambientStars = [];
    for (let i = 0; i < 80; i++) {
      ambientStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.2 + 0.5,
        alpha: Math.random() * 0.5 + 0.15,
        speed: Math.random() * 0.12 + 0.04
      });
    }

    const phoenixParticles = [];
    const maxParticles = 600;

    function initPhoenixParticle(p) {
      p.x = w / 2;
      p.y = h / 2 + 50;
      p.vx = (Math.random() - 0.5) * 2;
      p.vy = (Math.random() - 0.5) * 2;
      p.life = Math.random() * 0.6 + 0.4;
      p.maxLife = p.life;
      p.size = Math.random() * 2.2 + 0.8;
      p.color = Math.random() > 0.45 ? 'cyan' : 'orange';
      p.logoAssigned = false;
    }

    for (let i = 0; i < maxParticles; i++) {
      const p = {};
      initPhoenixParticle(p);
      phoenixParticles.push(p);
    }

    // Bird animation drawing function
    function drawBird(ctx, bx, by, scale, opacity, flapPhase) {
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(scale, scale);

      // CRITICAL PERFORMANCE FIX: Disable heavy shadowBlur at high scales to prevent browser canvas rasterizer lag
      if (scale < 1.5) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(34, 211, 238, 0.75)';
      } else {
        ctx.shadowBlur = 0;
      }

      const grad = ctx.createLinearGradient(-100, 0, 100, 0);
      grad.addColorStop(0, '#f97316'); // orange left
      grad.addColorStop(0.3, '#22d3ee'); // cyan middle
      grad.addColorStop(0.7, '#22d3ee');
      grad.addColorStop(1, '#f97316'); // orange right

      ctx.strokeStyle = grad;
      ctx.fillStyle = grad;
      ctx.globalAlpha = opacity;

      // Head
      ctx.beginPath();
      ctx.arc(0, -35, 7, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.lineTo(-3, -37);
      ctx.lineTo(3, -37);
      ctx.closePath();
      ctx.fill();

      // Body torso
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.bezierCurveTo(-15, -10, -12, 20, 0, 30);
      ctx.bezierCurveTo(12, 20, 15, -10, 0, -30);
      ctx.closePath();
      ctx.fill();

      // Tail Feathers
      ctx.lineWidth = 2.0;
      const tail1 = Math.sin(flapPhase * 0.5) * 12;
      const tail2 = Math.sin(flapPhase * 0.5 + 1.2) * 10;
      const tail3 = Math.sin(flapPhase * 0.5 - 1.2) * 10;

      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.bezierCurveTo(tail1 * 0.5, 60, tail1, 90, tail1 * 0.8, 120);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-4, 28);
      ctx.bezierCurveTo(-15 + tail2 * 0.5, 55, -20 + tail2, 85, -18 + tail2 * 0.8, 110);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(4, 28);
      ctx.bezierCurveTo(15 + tail3 * 0.5, 55, 20 + tail3, 85, 18 + tail3 * 0.8, 110);
      ctx.stroke();

      // Left Wing
      const flapY1 = Math.sin(flapPhase) * 35;
      const flapY2 = Math.sin(flapPhase - 0.4) * 45;
      const flapY3 = Math.sin(flapPhase - 0.8) * 55;

      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.quadraticCurveTo(-45, -30 + flapY1, -85, -45 + flapY2);
      ctx.quadraticCurveTo(-115, -30 + flapY3, -150, -10 + flapY3 * 1.2);
      ctx.stroke();

      // Left Wing Feathers
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 6; i++) {
        const t = i / 7;
        const bx = -10 * (1 - t) + -150 * t;
        const by = -10 * (1 - t) + (-10 + flapY3 * 1.2) * t;
        const featherLen = (35 + Math.sin(flapPhase - t * 2) * 12) * (1 - t * 0.3);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - 8, by + featherLen);
        ctx.stroke();
      }

      // Right Wing
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(10, -10);
      ctx.quadraticCurveTo(45, -30 + flapY1, 85, -45 + flapY2);
      ctx.quadraticCurveTo(115, -30 + flapY3, -150, -10 + flapY3 * 1.2); // Symmetrical wrist
      ctx.quadraticCurveTo(115, -30 + flapY3, 150, -10 + flapY3 * 1.2);
      ctx.stroke();

      // Right Wing Feathers
      for (let i = 1; i <= 6; i++) {
        const t = i / 7;
        const bx = 10 * (1 - t) + 150 * t;
        const by = -10 * (1 - t) + (-10 + flapY3 * 1.2) * t;
        const featherLen = (35 + Math.sin(flapPhase - t * 2) * 12) * (1 - t * 0.3);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + 8, by + featherLen);
        ctx.stroke();
      }

      ctx.restore();
    }

    let lastTime = performance.now();
    let accumTime = 0;

    function renderLoop(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const delta = Math.min(dt, 0.1);
      accumTime += delta;

      setTimelineTime(accumTime);

      // --- 20-Second Sound Triggers ---
      if (soundInitializedRef.current) {
        if (accumTime >= 0.0 && !droneTriggered) {
          synth.playDrone();
          droneTriggered = true;
        }
        if (accumTime >= 3.5 && !swellTriggered) {
          synth.playSwell();
          swellTriggered = true;
        }
        if (accumTime >= 11.5 && !impactTriggered) {
          synth.playImpact();
          impactTriggered = true;
        }
        if (accumTime >= 17.5 && !whooshTriggered) {
          synth.playWhoosh();
          whooshTriggered = true;
        }
      }

      // --- Timeline Skip Trigger at 18.8s (reveals site as wipe animation finishes) ---
      if (accumTime >= 18.8 && !transitionTriggered) {
        onTransitionStart();
        transitionTriggered = true;
      }
      if (accumTime >= 20.0) {
        synth.stopAll();
        return;
      }

      // --- Drawing Logic ---
      ctx.clearRect(0, 0, w, h);

      // 1. Starry background
      ctx.fillStyle = '#050810';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#ffffff';
      ambientStars.forEach(s => {
        s.y -= s.speed;
        if (s.y < 0) s.y = h;
        ctx.globalAlpha = s.alpha * (accumTime >= 18.8 ? Math.max(0, 1 - (accumTime - 18.8) / 1.2) : 1);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Faint Volumetric Lighting (0.0s - 15.0s)
      if (accumTime < 15.0) {
        const rayGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, 350);
        let rayOpacity = 0.05;
        if (accumTime >= 3.5 && accumTime < 11.5) {
          rayOpacity = 0.05 + ((accumTime - 3.5) / 8.0) * 0.12;
        } else if (accumTime >= 11.5 && accumTime < 15.0) {
          rayOpacity = 0.17 + ((accumTime - 11.5) / 3.5) * 0.18;
        }
        rayGrad.addColorStop(0, `rgba(34, 211, 238, ${rayOpacity})`);
        rayGrad.addColorStop(0.4, `rgba(249, 115, 22, ${rayOpacity * 0.6})`);
        rayGrad.addColorStop(1, 'rgba(5, 8, 16, 0)');
        ctx.fillStyle = rayGrad;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 450, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Phoenix Flying & Particle Simulation
      const flapPhase = accumTime * 8.2; // slightly slower flap for professional weight
      
      let birdX = w / 2;
      let birdY = h / 2 + 10;
      let birdScale = 0.5;
      let birdOpacity = 0;

      if (accumTime < 3.5) {
        // Phase 1: Anticipation
        birdOpacity = (accumTime / 3.5) * 0.18;
        birdScale = 0.28;
      } else if (accumTime < 7.0) {
        // Phase 2: Emerges
        birdOpacity = 0.18 + ((accumTime - 3.5) / 3.5) * 0.42;
        birdScale = 0.28 + ((accumTime - 3.5) / 3.5) * 0.22;
      } else if (accumTime < 11.5) {
        // Phase 3: Struggle to rise
        birdOpacity = 0.6;
        birdScale = 0.5;
        birdY = (h / 2 + 10) - ((accumTime - 7.0) / 4.5) * 80;
      } else if (accumTime < 15.0) {
        // Phase 4: Brand reveal approach
        birdOpacity = 0.6 + ((accumTime - 11.5) / 3.5) * 0.4;
        birdScale = 0.5 + ((accumTime - 11.5) / 3.5) * 0.45;
        birdY = (h / 2 - 70) + ((accumTime - 11.5) / 3.5) * 70; // centers
      } else if (accumTime < 17.5) {
        // Phase 5: Morphing
        birdOpacity = Math.max(0, 1.0 - ((accumTime - 15.0) / 1.2));
        birdScale = 0.95;
      } else {
        // Phase 6: WIPE TRANSITION
        birdOpacity = 1.0;
        birdScale = 0.95 + Math.pow((accumTime - 17.5) * 7.5, 2.3);
        birdY = h / 2 - ((accumTime - 17.5) * 150);
      }

      const isMorphing = accumTime >= 15.0 && accumTime < 17.5;
      const isWiping = accumTime >= 17.5;

      if (!isMorphing && !isWiping && logoPoints.length > 0) {
        // Normal particle emission trailing the bird
        phoenixParticles.forEach(p => {
          p.life -= delta * 1.3;
          if (p.life <= 0) {
            initPhoenixParticle(p);
            const side = Math.random() > 0.5 ? -1 : 1;
            const wingFactor = Math.random();
            const flapY = Math.sin(flapPhase - wingFactor * 0.8) * 55;
            p.x = birdX + side * (20 + wingFactor * 130 * birdScale);
            p.y = birdY + (flapY * 1.2 * birdScale);
            p.vx = -side * (Math.random() * 2 + 1) * birdScale;
            p.vy = (Math.random() * 3 + 1.5) * birdScale;
          }
          p.x += p.vx;
          p.y += p.vy;

          // HIGH PERFORMANCE RENDERING: Set stroke/fill colors with alpha without costly save/restore/shadowBlur calls
          const alpha = (p.life / p.maxLife) * birdOpacity * 0.7;
          ctx.fillStyle = p.color === 'cyan' ? `rgba(34, 211, 238, ${alpha})` : `rgba(249, 115, 22, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * birdScale, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (isMorphing && logoPoints.length > 0) {
        // Morph particles into logo pixels (slower 2.5s morph duration)
        const morphProgress = (accumTime - 15.0) / 2.5; // 0 to 1
        const ease = morphProgress < 0.5 
          ? 4 * morphProgress * morphProgress * morphProgress 
          : 1 - Math.pow(-2 * morphProgress + 2, 3) / 2; // cubic ease in/out

        const logoScale = Math.min(w * 0.005, 3.8);

        phoenixParticles.forEach((p, idx) => {
          if (!p.logoAssigned) {
            const ptIdx = idx % logoPoints.length;
            p.targetX = w / 2 + logoPoints[ptIdx].x * logoScale;
            p.targetY = h / 2 + logoPoints[ptIdx].y * logoScale - 45;
            p.startX = p.x;
            p.startY = p.y;
            p.logoAssigned = true;
          }

          p.x = p.startX * (1 - ease) + p.targetX * ease;
          p.y = p.startY * (1 - ease) + p.targetY * ease;

          const alpha = Math.min(1.0, 0.45 + ease * 0.5);
          ctx.fillStyle = p.color === 'cyan' ? `rgba(165, 243, 252, ${alpha})` : `rgba(255, 237, 213, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.95, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (isWiping) {
        phoenixParticles.forEach(p => {
          p.x += p.vx * 3;
          p.y += p.vy * 3;
          const alpha = Math.max(0, 1 - (accumTime - 17.5) / 0.8);
          ctx.fillStyle = p.color === 'cyan' ? `rgba(34, 211, 238, ${alpha})` : `rgba(249, 115, 22, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // CRITICAL VISUAL FIX: Draw bird silhouette continuously during wipe to show it approaching camera
      if (birdOpacity > 0 && !isMorphing) {
        drawBird(ctx, birdX, birdY, birdScale, birdOpacity, flapPhase);
      }

      // Draw Wipe transition at 17.5s+
      if (isWiping) {
        ctx.save();
        ctx.translate(w / 2, birdY);
        // CRITICAL VISUAL FIX: Scale up wipe wings even larger (0.65x instead of 0.45x) to guarantee screen coverage
        ctx.scale(birdScale * 0.65, birdScale * 0.65);
        
        // CRITICAL PERFORMANCE FIX: Disable costly shadowBlur at massive scales (prevents canvas rendering freeze)
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(5, 8, 16, 0.95)';
        ctx.beginPath();
        ctx.moveTo(-1500, 0);
        ctx.bezierCurveTo(-800, -900, 800, -900, 1500, 0);
        ctx.bezierCurveTo(800, 900, -800, 900, -1500, 0);
        ctx.closePath();
        
        const wipeGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 1500);
        wipeGrad.addColorStop(0, '#22d3ee');
        wipeGrad.addColorStop(0.3, '#f97316');
        wipeGrad.addColorStop(0.65, '#0a0f1e');
        wipeGrad.addColorStop(1, '#050810');

        ctx.fillStyle = wipeGrad;
        ctx.fill();
        ctx.restore();

        if (accumTime >= 18.8) {
          ctx.fillStyle = '#050810';
          ctx.globalAlpha = Math.max(0, 1.0 - (accumTime - 18.8) / 1.2);
          ctx.fillRect(0, 0, w, h);
        }
      }

      // 4. Logo Reveal & Light Sweep (11.5s - 17.5s)
      if (accumTime >= 11.5 && accumTime < 18.8 && logoImageRef.current) {
        const logoOpacity = Math.min(1.0, (accumTime - 11.5) / 1.8); // Fades in over 1.8s for readable classic look
        ctx.save();
        ctx.globalAlpha = logoOpacity * (accumTime >= 17.5 ? Math.max(0, 1 - (accumTime - 17.5) / 0.8) : 1);
        
        const logoWidth = Math.min(w * 0.35, 340);
        const logoHeight = logoWidth * (logoImageRef.current.height / logoImageRef.current.width);
        const lx = w / 2 - logoWidth / 2;
        const ly = h / 2 - logoHeight / 2 - 45;

        ctx.drawImage(logoImageRef.current, lx, ly, logoWidth, logoHeight);

        // Light Sweep shine effect (16.0s - 17.0s)
        if (accumTime >= 16.0 && accumTime < 17.0) {
          const sweepProgress = (accumTime - 16.0) / 1.0;
          const sweepX = -logoWidth + sweepProgress * (logoWidth * 2.5);

          ctx.globalCompositeOperation = 'source-atop';
          const sweepGrad = ctx.createLinearGradient(lx + sweepX - 60, 0, lx + sweepX + 60, 0);
          sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          sweepGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.55)');
          sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = sweepGrad;
          ctx.fillRect(lx, ly, logoWidth, logoHeight);
        }
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [logoPoints, onTransitionStart, synth]);

  // Audio Context cleanup
  useEffect(() => {
    return () => {
      synth.stopAll();
      if (synth.ctx) {
        synth.ctx.close().catch(() => {});
      }
    };
  }, [synth]);

  // Skip button click handler
  const handleSkip = (e) => {
    e.stopPropagation();
    synth.stopAll();
    if (onSkipIntro) {
      onSkipIntro();
    }
  };

  // Mute toggle handler
  const handleMuteToggle = (e) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (!soundInitializedRef.current) {
      synth.init();
      soundInitializedRef.current = true;
    }
    
    synth.setMute(newMuted);
  };

  return (
    <div className="cinematic-container">
      <style>{`
        .cinematic-container {
          position: relative;
          width: 100%;
          height: 100%;
          background-color: #050810;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        .cinematic-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        .cinematic-text-wrapper {
          position: absolute;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          text-align: center;
          padding: 0 20px;
          max-width: 800px;
        }
        .cinematic-quote {
          font-size: clamp(1.4rem, 2.8vw, 2.5rem);
          font-weight: 300;
          letter-spacing: 0.16em;
          color: #ffffff;
          margin: 0;
          text-shadow: 0 0 25px rgba(255, 255, 255, 0.25);
          line-height: 1.6;
        }
        .text-cyan {
          color: #22d3ee;
          text-shadow: 0 0 20px rgba(34, 211, 238, 0.45);
        }
        .text-orange {
          color: #f97316;
          text-shadow: 0 0 20px rgba(249, 115, 22, 0.45);
        }
        .mt-2 {
          margin-top: 0.75rem;
        }
        .skip-btn {
          position: absolute;
          top: 30px;
          right: 30px;
          z-index: 5;
          background: rgba(10, 15, 30, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 10px 22px;
          border-radius: 30px;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.3s ease;
          backdrop-filter: blur(8px);
        }
        .skip-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(34, 211, 238, 0.5);
          color: #ffffff;
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.35);
        }
        .audio-toggle-btn {
          position: absolute;
          top: 30px;
          right: 175px;
          z-index: 5;
          background: rgba(10, 15, 30, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.15);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.3s ease;
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .audio-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(249, 115, 22, 0.5);
          color: #ffffff;
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.35);
        }
        .audio-icon-svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
        }
        .sub-company-label {
          font-size: clamp(0.7rem, 1.3vw, 0.9rem);
          font-weight: 500;
          letter-spacing: 0.45em;
          color: #f97316;
          text-shadow: 0 0 15px rgba(249, 115, 22, 0.3);
          margin-top: 1rem;
        }
      `}</style>

      {/* Main Timeline Render Canvas */}
      <canvas ref={canvasRef} className="cinematic-canvas" />

      {/* Audio Mute/Unmute toggle */}
      {timelinePhase !== 'wipe' && (
        <button className="audio-toggle-btn" onClick={handleMuteToggle} title={isMuted ? "Unmute soundscape" : "Mute soundscape"}>
          {isMuted ? (
            <svg className="audio-icon-svg" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : (
            <svg className="audio-icon-svg" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
      )}

      {/* Skip button overlay */}
      {timelinePhase !== 'wipe' && (
        <button className="skip-btn" onClick={handleSkip}>
          Skip Intro →
        </button>
      )}

      {/* Cinematic Text Layers Overlay */}
      <AnimatePresence mode="wait">
        {timelinePhase === 'anticipation' && timelineTime >= 0.5 && (
          <motion.div
            key="anticipation"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="cinematic-text-wrapper"
          >
            <h1 className="cinematic-quote">Before you discover INNOXEL...</h1>
          </motion.div>
        )}
        {timelinePhase === 'emergence' && timelineTime >= 4.0 && (
          <motion.div
            key="emergence"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="cinematic-text-wrapper"
          >
            <h1 className="cinematic-quote">Built to rise. Built to endure.</h1>
          </motion.div>
        )}
        {timelinePhase === 'meaning1' && timelineTime >= 7.5 && (
          <motion.div
            key="meaning1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="cinematic-text-wrapper"
          >
            <h1 className="cinematic-quote">Like the Phoenix, we rise stronger.</h1>
          </motion.div>
        )}
        {timelinePhase === 'meaning2' && timelineTime >= 9.5 && (
          <motion.div
            key="meaning2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="cinematic-text-wrapper"
          >
            <h1 className="cinematic-quote text-cyan">Every challenge. Every setback.</h1>
            <h1 className="cinematic-quote text-orange mt-2">Every time we rise.</h1>
          </motion.div>
        )}
        {timelinePhase === 'reveal' && timelineTime >= 12.0 && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
            className="cinematic-text-wrapper"
            style={{ bottom: '15%', height: 'auto', display: 'flex', flexDirection: 'column' }}
          >
            <motion.h1
              initial={{ letterSpacing: '0.2em', opacity: 0 }}
              animate={{ letterSpacing: '0.45em', opacity: 1 }}
              transition={{ delay: 0.4, duration: 1.4 }}
              style={{
                color: '#ffffff',
                fontSize: 'clamp(1.5rem, 3.2vw, 2.6rem)',
                fontWeight: 300,
                margin: 0,
                textAlign: 'center'
              }}
            >
              INNOXEL
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="sub-company-label"
            >
              PRIVATE LIMITED
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              style={{
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                margin: '1.2rem 0 0 0',
                fontWeight: 600
              }}
            >
              SOFTWARE • AI • CLOUD • INNOVATION
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
