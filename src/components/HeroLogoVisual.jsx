import React from 'react';
import { motion } from 'framer-motion';

export default function HeroLogoVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
      className="hero-logo-svg-wrapper"
      style={{
        width: '100%',
        height: '100%',
        maxWidth: '400px',
        maxHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        className="hero-logo-svg"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <defs>
          {/* Brand Gradient matching INNOXEL logo */}
          <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fdf8e6" />
            <stop offset="25%" stopColor="#e5c07b" />
            <stop offset="50%" stopColor="#b38938" />
            <stop offset="75%" stopColor="#f5dc9e" />
            <stop offset="100%" stopColor="#8a6421" />
          </linearGradient>

          {/* Metallic Silver/White Gradient for S and M */}
          <linearGradient id="logoSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#e1e4e6" />
            <stop offset="60%" stopColor="#9da4a9" />
            <stop offset="85%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#737a7f" />
          </linearGradient>

          {/* Soft Shimmer Light Sweep Gradient */}
          <linearGradient id="heroSweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Mask containing all logo elements for the sweep overlay */}
          <mask id="heroLogoMask">
            <rect x="0" y="0" width="400" height="400" fill="black" />
            
            {/* Circle Outline */}
            <circle cx="200" cy="190" r="115" stroke="white" strokeWidth="4" fill="none" />
            
            {/* V, T, S, M paths shifted up slightly (cy=190 center) to balance texts below */}
            <g transform="translate(0, -10)">
              <path d="M 90 140 L 122 140 L 122 146 L 115 146 L 157 265 L 183 200 L 165 200 L 165 194 L 200 194 L 200 200 L 193 200 L 163 275 L 150 275 L 105 146 L 98 146 L 98 140 Z" fill="white" />
              <path d="M 195 140 L 290 140 L 290 146 L 282 146 L 253 146 L 253 250 L 259 250 L 259 256 L 231 256 L 231 250 L 237 250 L 237 146 L 203 146 L 195 146 Z" fill="white" />
              <path d="M 225 155 C 205 155 180 162 180 185 C 180 205 200 215 218 220 C 235 225 248 232 248 252 C 248 275 220 282 198 272 L 201 262 C 218 270 238 268 238 252 C 238 238 223 230 205 225 C 188 220 170 208 170 185 C 170 160 198 145 225 145 C 230 145 235 146 238 147 L 235 156 C 232 155 228 155 225 155 Z" fill="white" />
              <path d="M 268 152 L 285 152 L 315 220 L 345 152 L 362 152 L 362 250 L 368 250 L 368 256 L 342 256 L 342 250 L 348 250 L 348 165 L 322 230 L 308 230 L 282 165 L 282 250 L 288 250 L 288 256 L 262 256 L 262 250 L 268 250 Z" fill="white" />
            </g>

            {/* Subtitle INSIGHTS & PVT LTD text and lines */}
            <text x="200" y="325" fill="white" fontFamily="'Poppins', sans-serif" fontSize="18" fontWeight="500" letterSpacing="8" textAnchor="middle">INSIGHTS</text>
            <line x1="70" y1="319" x2="130" y2="319" stroke="white" strokeWidth="1.5" />
            <line x1="270" y1="319" x2="330" y2="319" stroke="white" strokeWidth="1.5" />

            <text x="200" y="352" fill="white" fontFamily="'Poppins', sans-serif" fontSize="9" fontWeight="400" letterSpacing="4" textAnchor="middle">PVT LTD</text>
            <line x1="140" y1="349" x2="175" y2="349" stroke="white" strokeWidth="1" />
            <line x1="225" y1="349" x2="260" y2="349" stroke="white" strokeWidth="1" />
          </mask>
        </defs>

        {/* --- Render Base Logo Shape with Gold & Silver Gradients --- */}
        <g>
          {/* Gold Circle outline */}
          <circle cx="200" cy="190" r="115" stroke="url(#logoGold)" strokeWidth="4" fill="none" />

          {/* VTSM group with Gold (V, T) and Silver (S, M) */}
          <g transform="translate(0, -10)">
            {/* V (Gold) */}
            <path d="M 90 140 L 122 140 L 122 146 L 115 146 L 157 265 L 183 200 L 165 200 L 165 194 L 200 194 L 200 200 L 193 200 L 163 275 L 150 275 L 105 146 L 98 146 L 98 140 Z" fill="url(#logoGold)" />
            {/* T (Gold) */}
            <path d="M 195 140 L 290 140 L 290 146 L 282 146 L 253 146 L 253 250 L 259 250 L 259 256 L 231 256 L 231 250 L 237 250 L 237 146 L 203 146 L 195 146 Z" fill="url(#logoGold)" />
            {/* S (Silver) */}
            <path d="M 225 155 C 205 155 180 162 180 185 C 180 205 200 215 218 220 C 235 225 248 232 248 252 C 248 275 220 282 198 272 L 201 262 C 218 270 238 268 238 252 C 238 238 223 230 205 225 C 188 220 170 208 170 185 C 170 160 198 145 225 145 C 230 145 235 146 238 147 L 235 156 C 232 155 228 155 225 155 Z" fill="url(#logoSilver)" />
            {/* M (Silver) */}
            <path d="M 268 152 L 285 152 L 315 220 L 345 152 L 362 152 L 362 250 L 368 250 L 368 256 L 342 256 L 342 250 L 348 250 L 348 165 L 322 230 L 308 230 L 282 165 L 282 250 L 288 250 L 288 256 L 262 256 L 262 250 L 268 250 Z" fill="url(#logoSilver)" />
          </g>

          {/* Underneath lines and text INSIGHTS (Gold) */}
          <line x1="70" y1="319" x2="130" y2="319" stroke="url(#logoGold)" strokeWidth="1.5" />
          <text x="200" y="325" fill="url(#logoGold)" fontFamily="'Poppins', sans-serif" fontSize="18" fontWeight="500" letterSpacing="8" textAnchor="middle">INSIGHTS</text>
          <line x1="270" y1="319" x2="330" y2="319" stroke="url(#logoGold)" strokeWidth="1.5" />

          {/* Underneath lines and text PVT LTD (Gold) */}
          <line x1="140" y1="349" x2="175" y2="349" stroke="url(#logoGold)" strokeWidth="1" />
          <text x="200" y="352" fill="url(#logoGold)" fontFamily="'Poppins', sans-serif" fontSize="9" fontWeight="400" letterSpacing="4" textAnchor="middle">PVT LTD</text>
          <line x1="225" y1="349" x2="260" y2="349" stroke="url(#logoGold)" strokeWidth="1" />
        </g>

        {/* --- Render Sliding Shimmer Sweep Overlay on top of Mask shape --- */}
        <g mask="url(#heroLogoMask)">
          <rect x="-400" y="0" width="300" height="400" fill="url(#heroSweepGrad)" transform="skewX(-20)">
            <animate 
              attributeName="x" 
              from="-500" 
              to="600" 
              dur="4.5s" 
              repeatCount="indefinite" 
              begin="0s"
            />
          </rect>
        </g>
      </svg>
    </motion.div>
  );
}
