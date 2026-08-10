import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

export default function LoaderTransition({ active, onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (active) {
      // Create a dummy object to animate progress from 0 to 100
      const obj = { value: 0 };
      
      // Perform a smooth GSAP animation over 3.5 seconds
      gsap.to(obj, {
        value: 100,
        duration: 3.5,
        ease: 'power1.inOut',
        onUpdate: () => {
          setProgress(Math.round(obj.value));
        },
        onComplete: () => {
          if (onComplete) {
            onComplete();
          }
        }
      });
    }
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="loader-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
        >
          <div className="loader-container">
            {/* Progress bar container and sliding neon fill */}
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%`, height: '100%' }}
              />
            </div>
            
            {/* Numerical percentage display */}
            <div className="loader-percentage">{progress}%</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
