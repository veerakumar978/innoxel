import React from 'react';
import logoImg from '../assets/innoxel-logo.png';

const nodes = [
  {
    name: 'UI / UX Design',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    ),
    angle: -90, // 12 o'clock
  },
  {
    name: 'Web Development',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    angle: -54,
  },
  {
    name: 'Mobile Apps',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12" y2="18.01" />
      </svg>
    ),
    angle: -18,
  },
  {
    name: 'AI Solutions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
      </svg>
    ),
    angle: 18,
  },
  {
    name: 'Cloud Solutions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
    angle: 54,
  },
  {
    name: 'API Integration',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    angle: 90, // 6 o'clock
  },
  {
    name: 'Cyber Security',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    angle: 126,
  },
  {
    name: 'Digital Marketing',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    ),
    angle: 162,
  },
  {
    name: 'Email Services',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    angle: 198,
  },
  {
    name: '24/7 Support',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
    angle: 234,
  },
];

export default function HeroOrbitVisual() {
  const R = 180; // Orbit Radius in pixels

  return (
    <div className="hero-orbit-wrapper">
      
      {/* Rotating Outer Ring & Connecting Dots Group */}
      <div className="orbit-rotating-group">
        {/* Orbit Ring Background Canvas / SVG */}
        <svg className="orbit-ring-svg" viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Brand Neon Blue Connecting Line */}
          <circle cx="225" cy="225" r={R} stroke="#22D3EE" strokeWidth="1.2" strokeOpacity="0.4" />
          
          {/* Connector nodes along the ring */}
          {nodes.map((n, i) => {
            const rad = (n.angle * Math.PI) / 180;
            const cx = 225 + R * Math.cos(rad);
            const cy = 225 + R * Math.sin(rad);
            // Mid-dots on the path
            const midRad = ((n.angle + 18) * Math.PI) / 180;
            const mx = 225 + R * Math.cos(midRad);
            const my = 225 + R * Math.sin(midRad);
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="3" fill="#F97316" opacity="0.9" />
                <circle cx={mx} cy={my} r="2.5" fill="#22D3EE" opacity="0.9" />
              </g>
            );
          })}
        </svg>

        {/* Orbit Capability Node Rings (Child elements will counter-rotate automatically via CSS animation) */}
        {nodes.map((node, i) => {
          const rad = (node.angle * Math.PI) / 180;
          const xVal = R * Math.cos(rad);
          const yVal = R * Math.sin(rad);

          return (
            <div
              key={i}
              className="orbit-node-container"
              style={{
                position: 'absolute',
                left: `calc(50% + ${xVal}px)`,
                top: `calc(50% + ${yVal}px)`,
              }}
            >
              {/* Node Icon Circle (Dark Blue background, White line icon) */}
              <div className="orbit-node-circle">
                {node.icon}
              </div>

              {/* Tooltip containing the capability service name */}
              <div className="orbit-node-tooltip">
                {node.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Central Stable Logo centering container */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto'
        }}
      >
        <div className="orbit-center-logo">
          <img 
            src={logoImg} 
            alt="INNOXEL Private Limited Logo" 
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      </div>

    </div>
  );
}
