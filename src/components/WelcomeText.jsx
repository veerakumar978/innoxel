import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/innoxel-logo.png';

export default function WelcomeText({ transitioning, onEnterClick }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1800); // Trigger fade in after 1.8 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Subtitle */}
          <motion.div 
            className="sub-title"
            animate={transitioning ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            WELCOME TO
          </motion.div>
          
          {/* Center Official Logo with load and float animations */}
          <motion.div 
            className="welcome-logo-wrapper"
            initial={{ scale: 0.98, opacity: 0 }}
            animate={
              transitioning 
                ? { 
                    opacity: [1, 1, 0], 
                    scale: [1, 1.02, 0.96],
                    y: [0, -3, 0] 
                  }
                : { 
                    scale: 1, 
                    opacity: 1,
                    y: [0, -3, 0]
                  }
            }
            transition={
              transitioning 
                ? { 
                    opacity: { duration: 1.6, times: [0, 0.5, 1], ease: "easeInOut" },
                    scale: { duration: 1.6, times: [0, 0.5, 1], ease: "easeInOut" },
                    y: { duration: 6, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }
                  }
                : {
                    scale: { duration: 1.2, ease: "easeOut" },
                    opacity: { duration: 1.2, ease: "easeOut" },
                    y: {
                      duration: 6,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatType: "mirror"
                    }
                  }
            }
          >
            <img 
              src={logoImg} 
              className="welcome-logo-img" 
              alt="INNOXEL Private Limited" 
            />
          </motion.div>
          
          {/* Tagline */}
          <motion.p 
            className="welcome-tagline"
            animate={transitioning ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            Engineering <span className="gold-highlight">Digital Products</span> That Move Business Forward
          </motion.p>
          
          {/* Horizontal dividing line with center glow dot */}
          <motion.div 
            className="divider-container"
            animate={transitioning ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="divider-line" />
            <div className="divider-dot" />
          </motion.div>

          {/* Premium enter button */}
          <motion.button
            className="enter-website-btn"
            style={{ pointerEvents: 'auto' }}
            initial={{ opacity: 0, y: 10 }}
            animate={transitioning ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
            transition={transitioning ? { duration: 0.5, ease: "easeInOut" } : { delay: 0.5, duration: 0.8 }}
            whileHover={transitioning ? {} : { scale: 1.04 }}
            whileTap={transitioning ? {} : { scale: 0.96 }}
            onClick={(e) => {
              e.stopPropagation();
              if (onEnterClick) {
                onEnterClick();
              }
            }}
          >
            Explore INNOXEL →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
