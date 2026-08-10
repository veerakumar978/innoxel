import React, { useEffect, useRef } from 'react';

const particleColors = [
  { rgb: '34, 211, 238', glow: 'rgba(34, 211, 238, 0.5)', glowMultiplier: 1.2 },   // Neon Blue (#22D3EE)
  { rgb: '249, 115, 22', glow: 'rgba(249, 115, 22, 0.5)', glowMultiplier: 1.2 },    // Orange (#F97316)
  { rgb: '255, 255, 255', glow: 'rgba(255, 255, 255, 0.5)', glowMultiplier: 0.8 }   // White
];

const shapes = ['circle', 'diamond', 'sparkle'];

export default function InteractiveCanvas({ minimal = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let dpr = 1;
    let ambient = [];
    let animationFrameId = null;
    let time = 0;
    let scrollY = 0;

    const mouse = { x: -9999, y: -9999, active: false };

    // Select subset of colors for minimal homepage view
    const activeColors = particleColors;

    function buildAmbient() {
      if (w <= 0 || h <= 0) return;
      
      const cell = minimal ? 60 : 36;
      const maxParticles = minimal ? 160 : 450;
      let cols = Math.ceil(w / cell);
      let rows = Math.ceil(h / cell);
      
      while (cols * rows > maxParticles) {
        cols = Math.ceil(cols * 0.9);
        rows = Math.ceil(rows * 0.9);
      }

      ambient = [];
      for (let cx = 0; cx < cols; cx++) {
        for (let cy = 0; cy < rows; cy++) {
          const bx = Math.random() * w;
          const by = Math.random() * h;
          
          const colorObj = activeColors[Math.floor(Math.random() * activeColors.length)];
          const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
          
          ambient.push({
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
            r: Math.random() * (minimal ? 1.2 : 1.8) + 0.8,
            shape: shapeType,
            rgb: colorObj.rgb,
            glowColor: colorObj.glow,
            glowMultiplier: colorObj.glowMultiplier,
            phase: Math.random() * Math.PI * 2,
            speed: minimal ? (0.35 + Math.random() * 0.45) : (0.7 + Math.random() * 0.9),
          });
        }
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildAmbient();
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    resize();

    // Renders the glowing vector Phoenix silhouette in the footer background
    function drawPhoenixSilhouette(ctx, cx, cy, scale, opacity) {
      ctx.save();
      ctx.globalAlpha = opacity * 0.35; // keep it subtle and elegant in the background
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      
      const grad = ctx.createLinearGradient(-200, 0, 200, 0);
      grad.addColorStop(0, '#f97316'); // orange outer wings
      grad.addColorStop(0.5, '#22d3ee'); // cyan core
      grad.addColorStop(1, '#f97316');
      
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.0;
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(34, 211, 238, 0.6)';
      
      // Outer Wings
      ctx.beginPath();
      ctx.moveTo(-15, -10);
      ctx.bezierCurveTo(-60, -60, -150, -80, -260, -30);
      ctx.bezierCurveTo(-180, 20, -100, 30, -15, 10);
      
      ctx.moveTo(15, -10);
      ctx.bezierCurveTo(60, -60, 150, -80, 260, -30);
      ctx.bezierCurveTo(180, 20, 100, 30, 15, 10);
      
      // Secondary feather layers
      ctx.moveTo(-15, 0);
      ctx.bezierCurveTo(-50, -30, -120, -45, -200, -15);
      ctx.bezierCurveTo(-140, 25, -80, 30, -15, 15);

      ctx.moveTo(15, 0);
      ctx.bezierCurveTo(50, -30, 120, -45, 200, -15);
      ctx.bezierCurveTo(140, 25, 80, 30, 15, 15);
      
      // Head
      ctx.moveTo(0, -45);
      ctx.arc(0, -45, 10, 0, Math.PI * 2);
      
      // Beak
      ctx.moveTo(0, -55);
      ctx.lineTo(-4, -49);
      ctx.lineTo(4, -49);
      ctx.closePath();
      
      // Tail Feathers
      ctx.moveTo(0, 20);
      ctx.quadraticCurveTo(-30, 60, -20, 110);
      ctx.moveTo(0, 20);
      ctx.quadraticCurveTo(0, 70, 0, 130);
      ctx.moveTo(0, 20);
      ctx.quadraticCurveTo(30, 60, 20, 110);
      
      ctx.stroke();
      ctx.restore();
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      time += 0.005;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPct = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      // Scroll speed modifier (embers drift faster as you scroll)
      const scrollSpeedFactor = 1.0 + scrollPct * 1.5;

      // 1. Draw Phoenix Silhouette if near footer
      let footerOpacity = 0;
      if (scrollPct > 0.65) {
        footerOpacity = (scrollPct - 0.65) / 0.35; // Fades in cleanly during the last 35% of page scroll
      }
      if (footerOpacity > 0) {
        // Render silhouette in center of screen
        const scale = Math.min(w * 0.002, 1.6);
        drawPhoenixSilhouette(ctx, w / 2, h * 0.52, scale, footerOpacity);
      }

      // 2. Draw Embers
      for (let i = 0; i < ambient.length; i++) {
        const s = ambient[i];
        
        // Embers drift upwards naturally
        let targetX = s.x + Math.sin(time * 0.5 + s.phase) * 0.45;
        let targetY = s.y - s.speed * 0.28 * scrollSpeedFactor;
        let boost = 0;

        // Wrap around top boundary
        if (targetY < -20) {
          targetY = h + 20;
          s.x = Math.random() * w;
        }

        // Magnetic Attraction Gravity toward Mouse Cursor
        if (mouse.active) {
          const dx = mouse.x - s.x;
          const dy = mouse.y - s.y;
          const distSq = dx * dx + dy * dy;
          const radius = 220;
          const radiusSq = radius * radius;
          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq) + 0.001;
            const force = (1 - dist / radius) ** 1.8;
            const angle = Math.atan2(dy, dx);
            const pullStrength = minimal ? 0.35 : 0.65;
            s.vx += Math.cos(angle) * force * pullStrength;
            s.vy += Math.sin(angle) * force * pullStrength;
            boost = force * 0.65;
          }
        }

        s.vx *= 0.88;
        s.vy *= 0.88;
        s.x = targetX + s.vx;
        s.y = targetY + s.vy;

        const size = s.r + boost * 1.5;
        const tw = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase);
        const opacity = Math.max(0.1, Math.min(0.85, 0.2 + tw * 0.45 + boost * 0.3));

        // Draw particle path (no shadowBlur to maintain high frame rate)
        ctx.fillStyle = `rgba(${s.rgb}, ${opacity})`;

        if (s.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.shape === 'diamond') {
          ctx.beginPath();
          const dSize = size * 1.35;
          ctx.moveTo(s.x, s.y - dSize);
          ctx.lineTo(s.x + dSize, s.y);
          ctx.lineTo(s.x, s.y + dSize);
          ctx.lineTo(s.x - dSize, s.y);
          ctx.closePath();
          ctx.fill();
        } else if (s.shape === 'sparkle') {
          ctx.beginPath();
          const sRad = size * 1.45;
          const inRad = sRad * 0.25;
          for (let j = 0; j < 4; j++) {
            const angle = (j * Math.PI) / 2;
            ctx.lineTo(s.x + Math.cos(angle) * sRad, s.y + Math.sin(angle) * sRad);
            const midAngle = angle + Math.PI / 4;
            ctx.lineTo(s.x + Math.cos(midAngle) * inRad, s.y + Math.sin(midAngle) * inRad);
          }
          ctx.closePath();
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [minimal]);

  return <canvas id="field" ref={canvasRef} />;
}
