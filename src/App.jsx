import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeScreen from './components/WelcomeScreen';
import Homepage from './components/Homepage';

function App() {
  const [page, setPage] = useState(() => {
    const hasSeenIntro = sessionStorage.getItem('innoxel_intro_viewed') === 'true';
    return (window.location.pathname === '/home' || hasSeenIntro) ? 'home' : 'welcome';
  });
  const [showWelcome, setShowWelcome] = useState(() => {
    const hasSeenIntro = sessionStorage.getItem('innoxel_intro_viewed') === 'true';
    return window.location.pathname !== '/home' && !hasSeenIntro;
  });
  const [transitioning, setTransitioning] = useState(false);
  const [targetSection, setTargetSection] = useState(null);
  const [showBrandMessage, setShowBrandMessage] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(true);

  const triggerBrandMessage = () => {
    setShowBrandMessage(true);
    setTimeout(() => {
      setShowBrandMessage(false);
    }, 1400); // 800ms display + 600ms fade transition
  };

  useEffect(() => {
    const handlePopState = () => {
      const isHome = window.location.pathname === '/home';
      setPage(isHome ? 'home' : 'welcome');
      setShowWelcome(!isHome);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const root = document.getElementById('root');
    // Allow scroll only on home page and when not transitioning
    if (page === 'home' && !transitioning) {
      document.body.style.overflowX = 'hidden';
      document.body.style.overflowY = 'auto';
      document.body.style.height = 'auto';
      document.documentElement.style.overflowX = 'hidden';
      document.documentElement.style.overflowY = 'auto';
      document.documentElement.style.height = 'auto';
      if (root) {
        root.style.overflowX = 'hidden';
        root.style.overflowY = 'visible';
        root.style.height = 'auto';
      }
    } else {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      if (root) {
        root.style.overflow = 'hidden';
        root.style.height = '100%';
      }
    }
  }, [page, transitioning]);

  useEffect(() => {
    // Elegant magnetic dynamic water ripple effect on buttons
    const handleButtonClick = (e) => {
      const button = e.target.closest('.premium-btn, .cta-button, .back-to-top-btn, .skip-btn, .audio-toggle-btn');
      if (!button) return;
      
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'btn-click-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    };

    window.addEventListener('click', handleButtonClick);
    return () => window.removeEventListener('click', handleButtonClick);
  }, []);

  const handleTransitionStart = () => {
    setTransitioning(true);
    setPage('home');
    window.history.pushState(null, '', '/home');
    sessionStorage.setItem('innoxel_intro_viewed', 'true');

    // Remove the welcome screen overlay after the 1.6s transition is complete
    setTimeout(() => {
      setShowWelcome(false);
      setTransitioning(false);
      triggerBrandMessage();
    }, 1800);
  };

  const handleSkipIntro = () => {
    sessionStorage.setItem('innoxel_intro_viewed', 'true');
    setPage('home');
    setShowWelcome(false);
    setTransitioning(false);
    window.history.pushState(null, '', '/home');
    triggerBrandMessage();
  };

  const handleHeaderNavigate = (sectionId) => {
    setTargetSection(sectionId);
    handleTransitionStart();
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Main Homepage content mounted underneath welcome page during transition */}
      {page === 'home' && (
        <Homepage 
          targetSection={targetSection} 
          clearTargetSection={() => setTargetSection(null)} 
          isSoundMuted={isSoundMuted}
          setIsSoundMuted={setIsSoundMuted}
        />
      )}
      
      {/* Welcome Screen Overlay */}
      {showWelcome && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 9999,
          pointerEvents: transitioning ? 'none' : 'auto',
          transition: 'opacity 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: transitioning ? 0 : 1
        }}>
          <WelcomeScreen 
            onTransitionStart={handleTransitionStart} 
            onHeaderNavigate={handleHeaderNavigate} 
            onSkipIntro={handleSkipIntro}
            isSoundMuted={isSoundMuted}
            setIsSoundMuted={setIsSoundMuted}
          />
        </div>
      )}

      {/* Elegant final brand message: "RISE. REBUILD. REDEFINE." */}
      <AnimatePresence>
        {showBrandMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(5, 8, 16, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
              pointerEvents: 'none',
            }}
          >
            <h2 style={{
              color: '#ffffff',
              fontFamily: '"Outfit", "Inter", sans-serif',
              fontWeight: 300,
              fontSize: '2.5rem',
              letterSpacing: '0.6em',
              margin: 0,
              textShadow: '0 0 25px rgba(34, 211, 238, 0.6), 0 0 50px rgba(249, 115, 22, 0.3)',
              textAlign: 'center',
              paddingLeft: '0.6em', // offset tracking
            }}>
              RISE. REBUILD. REDEFINE.
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
