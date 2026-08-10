import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import HeroOrbitVisual from './HeroOrbitVisual';
import InteractiveCanvas from './InteractiveCanvas';
import logoImg from '../assets/innoxel-logo.png';

// --- Ambient Homepage Synthesizer Class ---
class HomepageSynth {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = true;
    this.padOscs = [];
    this.padGain = null;
    this.active = false;
    this.chordTimeout = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.initialized = true;
    } catch {
      console.error("Web Audio API not supported");
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.initialized) {
      if (this.ctx.state === 'suspended' && !muted) {
        this.ctx.resume();
      }
      if (this.padGain) {
        const targetVolume = muted ? 0.0 : 0.05;
        this.padGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.5);
      }
      if (!muted && !this.active) {
        this.playPadLoop();
      }
    }
  }

  playPadLoop() {
    if (!this.initialized || this.active) return;
    this.active = true;
    const ctx = this.ctx;

    this.padGain = ctx.createGain();
    this.padGain.gain.setValueAtTime(this.muted ? 0.0 : 0.05, ctx.currentTime);
    this.padGain.connect(ctx.destination);

    // Chords: D maj7 -> G maj7 -> B min7 -> A sus4
    const chords = [
      [146.83, 220.00, 277.18, 329.63], // D3, A3, C#4, E4
      [196.00, 293.66, 392.00, 440.00], // G3, D4, G4, A4
      [123.47, 185.00, 293.66, 369.99], // B2, F#3, D4, A4
      [220.00, 329.63, 440.00, 587.33]  // A3, E4, A4, D5
    ];

    let chordIndex = 0;

    const playNextChord = () => {
      if (!this.active) return;
      
      const freqs = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      const oldOscs = [...this.padOscs];
      this.padOscs = [];

      const fadeTime = 2.0;
      oldOscs.forEach(o => {
        try {
          o.gainNode.gain.setTargetAtTime(0.0, ctx.currentTime, 0.6);
          setTimeout(() => {
            try { o.stop(); } catch {}
          }, fadeTime * 1000);
        } catch {}
      });

      freqs.forEach(f => {
        for (let detune of [-6, 6]) {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          osc.detune.setValueAtTime(detune, ctx.currentTime);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(500, ctx.currentTime);
          filter.frequency.setTargetAtTime(800 + Math.sin(ctx.currentTime) * 200, ctx.currentTime, 1.5);

          const oscGain = ctx.createGain();
          oscGain.gain.setValueAtTime(0, ctx.currentTime);
          oscGain.gain.setTargetAtTime(0.25, ctx.currentTime, 1.0);

          osc.connect(filter);
          filter.connect(oscGain);
          oscGain.connect(this.padGain);

          osc.gainNode = oscGain;
          osc.start();
          this.padOscs.push(osc);
        }
      });

      this.chordTimeout = setTimeout(playNextChord, 8000);
    };

    playNextChord();
  }

  playClick() {
    if (!this.initialized || this.muted) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        try { osc.stop(); } catch {}
      }, 100);
    } catch {}
  }

  playHoverSweep() {
    if (!this.initialized || this.muted) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        try { osc.stop(); } catch {}
      }, 200);
    } catch {}
  }

  stopAll() {
    this.active = false;
    clearTimeout(this.chordTimeout);
    this.padOscs.forEach(o => {
      try { o.stop(); } catch {}
    });
    this.padOscs = [];
  }
}

export default function Homepage({ targetSection, clearTargetSection, isSoundMuted, setIsSoundMuted }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [wipeActiveSections, setWipeActiveSections] = useState({});

  const triggerWipe = (sectionId) => {
    if (!wipeActiveSections[sectionId]) {
      setWipeActiveSections(prev => ({ ...prev, [sectionId]: true }));
    }
  };

  const synthRef = useRef(null);

  const playClick = () => {
    if (synthRef.current) {
      synthRef.current.playClick();
    }
  };

  const playHover = () => {
    if (synthRef.current) {
      synthRef.current.playHoverSweep();
    }
  };

  const handleMuteToggle = () => {
    const newMuted = !isSoundMuted;
    setIsSoundMuted(newMuted);
    if (synthRef.current) {
      synthRef.current.init();
      synthRef.current.setMuted(newMuted);
    }
  };

  useEffect(() => {
    synthRef.current = new HomepageSynth();
    return () => {
      if (synthRef.current) {
        synthRef.current.stopAll();
      }
    };
  }, []);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.init();
      synthRef.current.setMuted(isSoundMuted);
    }
  }, [isSoundMuted]);

  // Reviews carousel state (UNCHANGED)
  const [reviewsActiveIndex, setReviewsActiveIndex] = useState(0);
  const [reviewsIsHovered, setReviewsIsHovered] = useState(false);

  const reviewsData = [
    {
      quote: "INNOXEL delivered our core platform architecture with exceptional code quality and speed. Their engineering team understood our requirements instantly.",
      author: "Rajesh Sharma",
      title: "CTO, Healthcare Tech"
    },
    {
      quote: "The AI customer support integration streamlined our response workflows by over 40%. Highly professional and reliable technical partners.",
      author: "Anita Verma",
      title: "VP Operations, Enterprise Systems"
    },
    {
      quote: "Dependable cloud architecture and clean API design. INNOXEL helped us build for scale from day one.",
      author: "Vikram Malhotra",
      title: "Head of Product, Fintech Solutions"
    }
  ];

  useEffect(() => {
    if (reviewsIsHovered) return;
    const timer = setInterval(() => {
      setReviewsActiveIndex((prev) => (prev + 1) % reviewsData.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [reviewsIsHovered, reviewsData.length]);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    serviceRequired: 'Web Development',
    message: ''
  });

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Track scrolling to toggle glass background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll spy
  useEffect(() => {
    const sectionIds = [
      'home',
      'about',
      'services',
      'highlights',
      'projects',
      'reviews',
      'why-choose',
      'contact'
    ];
    const visMap = {};

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        visMap[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });

      let maxRatio = 0;
      let mostVisible = null;
      sectionIds.forEach((id) => {
        if (visMap[id] > maxRatio) {
          maxRatio = visMap[id];
          mostVisible = id;
        }
      });

      if (window.scrollY < 50) {
        mostVisible = 'home';
      }

      if (mostVisible) {
        setActiveSection(mostVisible);
      }
    };

    const observerOptions = {
      root: null,
      rootMargin: '-15% 0px -25% 0px',
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    const handleScrollTop = () => {
      if (window.scrollY < 50) {
        setActiveSection('home');
      }
    };
    window.addEventListener('scroll', handleScrollTop, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScrollTop);
    };
  }, []);

  useEffect(() => {
    if (targetSection) {
      const timer = setTimeout(() => {
        scrollToSection(targetSection);
        clearTargetSection();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [targetSection, clearTargetSection]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setFormData({
          name: '',
          company: '',
          email: '',
          phone: '',
          serviceRequired: 'Web Development',
          message: ''
        });
      }, 5000);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setTimeout(() => {
        setNewsletterSubscribed(false);
        setNewsletterEmail('');
      }, 4000);
    }
  };

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    
    if (id === 'home') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleGetStartedClick = () => {
    scrollToSection('contact');
    setTimeout(() => {
      document.getElementById('name')?.focus();
      const form = document.getElementById('contact-form');
      if (form) {
        form.classList.add('pulse-glow');
        setTimeout(() => form.classList.remove('pulse-glow'), 1000);
      }
    }, 850);
  };

  // Scroll Progress Bar hooks
  const { scrollYProgress } = useScroll();
  const scrollScaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Motion animation presets
  const fadeInUp = {
    initial: { opacity: 0, y: 35 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.7, ease: 'easeOut' }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    },
    viewport: { once: true, margin: '-80px' }
  };

  // Services Data (UNCHANGED SECTION 3)
  const servicesData = [
    {
      icon: '💻',
      title: 'Web Application Development',
      desc: 'High-fidelity, responsive web applications built with modern frontend frameworks and robust backend architecture.'
    },
    {
      icon: '📱',
      title: 'Mobile App Development',
      desc: 'Native and cross-platform mobile solutions engineered for seamless performance and modern user interfaces.'
    },
    {
      icon: '🎨',
      title: 'UI/UX & Product Design',
      desc: 'User-centered design systems, interactive prototypes, and intuitive interfaces focused on engagement.'
    },
    {
      icon: '🧠',
      title: 'AI & Automation Solutions',
      desc: 'Practical machine learning models, intelligent workflow automation, and custom AI assistant integrations.'
    },
    {
      icon: '☁️',
      title: 'Cloud & Infrastructure',
      desc: 'Secure cloud architecture, automated deployment pipelines, and scalable database environments.'
    },
    {
      icon: '🛠️',
      title: 'Technology Advisory',
      desc: 'Technical architecture planning, legacy code modernization strategies, and strategic technology consulting.'
    }
  ];

  // Company Highlights (UPDATED SECTION 4)
  const highlightCards = [
    {
      num: '01',
      title: 'Product Engineering',
      desc: 'Designing and developing reliable digital products from concept to deployment.'
    },
    {
      num: '02',
      title: 'AI & Intelligent Systems',
      desc: 'Applying artificial intelligence and automation to practical business workflows.'
    },
    {
      num: '03',
      title: 'Cloud Engineering',
      desc: 'Building scalable and secure cloud-based application environments.'
    },
    {
      num: '04',
      title: 'Modern Architecture',
      desc: 'Creating flexible systems that can evolve with changing business requirements.'
    },
    {
      num: '05',
      title: 'Quality Engineering',
      desc: 'Prioritizing testing, performance, security, and maintainability throughout development.'
    },
    {
      num: '06',
      title: 'Continuous Improvement',
      desc: 'Supporting products beyond launch through optimization, maintenance, and technical improvements.'
    }
  ];

  // Selected Work Projects (UPDATED SECTION 5)
  const projectsData = [
    {
      title: 'Business Operations Platform',
      industry: 'Enterprise',
      focus: 'Business Automation',
      desc: 'A centralized platform designed to streamline internal workflows, approvals, reporting, and team collaboration.',
      tech: ['React', 'Java', 'MySQL']
    },
    {
      title: 'AI Customer Support Assistant',
      industry: 'AI & Customer Experience',
      focus: 'Artificial Intelligence',
      desc: 'An intelligent support solution designed to assist with routine customer queries, improve response workflows, and help support teams handle growing demand.',
      tech: ['Python', 'AI', 'REST APIs']
    },
    {
      title: 'Digital Healthcare Platform',
      industry: 'Healthcare',
      focus: 'Digital Transformation',
      desc: 'A digital platform designed to simplify appointment management, patient workflows, records, and operational reporting.',
      tech: ['React', 'Node.js', 'PostgreSQL']
    },
    {
      title: 'Cloud-Based Business Dashboard',
      industry: 'Business Intelligence',
      focus: 'Data & Analytics',
      desc: 'A centralized dashboard that brings operational information together to help teams monitor performance and make informed decisions.',
      tech: ['React', 'APIs', 'Cloud Infrastructure']
    }
  ];

  // Why Choose INNOXEL Cards (UPDATED SECTION 7)
  const whyChooseCards = [
    {
      num: '01',
      title: 'Engineering First',
      desc: 'We focus on architecture, code quality, performance, security, and maintainability from the beginning.'
    },
    {
      num: '02',
      title: 'Business Before Technology',
      desc: 'We understand the business objective first and then identify the technology that best supports it.'
    },
    {
      num: '03',
      title: 'Practical AI',
      desc: 'We focus on meaningful AI applications that solve real problems rather than adding AI simply because it is trending.'
    },
    {
      num: '04',
      title: 'Scalable Solutions',
      desc: 'Our solutions are designed to accommodate new users, features, integrations, and changing business requirements.'
    },
    {
      num: '05',
      title: 'Transparent Collaboration',
      desc: 'Clear communication and regular progress updates keep clients involved throughout the development journey.'
    },
    {
      num: '06',
      title: 'Long-Term Partnership',
      desc: 'Our relationship does not have to end at deployment. We can continue supporting, improving, and evolving the product as requirements change.'
    }
  ];

  return (
    <motion.div 
      className="homepage-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
    >
      {/* Scroll Progress Bar */}
      <motion.div className="scroll-progress-bar" style={{ scaleX: scrollScaleX }} />

      {/* Subtle background particles */}
      <InteractiveCanvas minimal={true} />
      
      {/* --- Fixed Premium Glass Navbar --- */}
      <nav className={`navbar-container ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-logo" onClick={() => scrollToSection('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <img 
            src={logoImg} 
            alt="INNOXEL Private Limited" 
            className="navbar-logo-img"
          />
        </div>

        {/* Desktop Menu */}
        <ul className="navbar-menu">
          <li><button onClick={() => { playClick(); scrollToSection('home'); }} onMouseEnter={playHover} className={`nav-btn-link ${activeSection === 'home' ? 'active' : ''}`}>Home</button></li>
          <li><button onClick={() => { playClick(); scrollToSection('about'); }} onMouseEnter={playHover} className={`nav-btn-link ${activeSection === 'about' ? 'active' : ''}`}>About Us</button></li>
          <li><button onClick={() => { playClick(); scrollToSection('services'); }} onMouseEnter={playHover} className={`nav-btn-link ${activeSection === 'services' ? 'active' : ''}`}>Services</button></li>
          <li><button onClick={() => { playClick(); scrollToSection('highlights'); }} onMouseEnter={playHover} className={`nav-btn-link ${activeSection === 'highlights' ? 'active' : ''}`}>Company Highlights</button></li>
          <li><button onClick={() => { playClick(); scrollToSection('projects'); }} onMouseEnter={playHover} className={`nav-btn-link ${activeSection === 'projects' ? 'active' : ''}`}>Projects</button></li>
          <li><button onClick={() => { playClick(); scrollToSection('reviews'); }} onMouseEnter={playHover} className={`nav-btn-link ${activeSection === 'reviews' ? 'active' : ''}`}>Reviews</button></li>
          <li><button onClick={() => { playClick(); scrollToSection('why-choose'); }} onMouseEnter={playHover} className={`nav-btn-link ${activeSection === 'why-choose' ? 'active' : ''}`}>Why Choose INNOXEL</button></li>
          <li><button onClick={() => { playClick(); scrollToSection('contact'); }} onMouseEnter={playHover} className={`nav-btn-link ${activeSection === 'contact' ? 'active' : ''}`}>Contact</button></li>
          <li>
            <button onClick={() => { playClick(); handleGetStartedClick(); }} onMouseEnter={playHover} className="navbar-cta-btn">Get Started</button>
          </li>
        </ul>

        {/* Audio Wave Visualizer Widget & Mute Button (Rendered outside the hidden menu list so it is visible on mobile next to hamburger button) */}
        <div 
          className="navbar-audio-controls"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: 'auto',
            marginRight: '16px',
            padding: '6px 12px',
            borderLeft: '1px solid rgba(15, 23, 42, 0.1)',
            borderRight: '1px solid rgba(15, 23, 42, 0.1)',
            height: '32px',
            zIndex: 105
          }}
        >
          <div className={`navbar-audio-wave ${isSoundMuted ? 'muted' : 'playing'}`}>
            <span className="wave-bar bar-1"></span>
            <span className="wave-bar bar-2"></span>
            <span className="wave-bar bar-3"></span>
            <span className="wave-bar bar-4"></span>
          </div>
          <button 
            onClick={() => { playClick(); handleMuteToggle(); }} 
            onMouseEnter={playHover}
            className="navbar-audio-btn" 
            title={isSoundMuted ? "Unmute soundscape" : "Mute soundscape"}
            style={{
              background: 'none',
              border: 'none',
              color: isSoundMuted ? '#64748b' : '#22d3ee',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              transition: 'all 0.3s ease'
            }}
          >
            {isSoundMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="mobile-drawer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="mobile-drawer-links">
              <li><button onClick={() => scrollToSection('home')} className={`drawer-btn-link ${activeSection === 'home' ? 'active' : ''}`}>Home</button></li>
              <li><button onClick={() => scrollToSection('about')} className={`drawer-btn-link ${activeSection === 'about' ? 'active' : ''}`}>About Us</button></li>
              <li><button onClick={() => scrollToSection('services')} className={`drawer-btn-link ${activeSection === 'services' ? 'active' : ''}`}>Services</button></li>
              <li><button onClick={() => scrollToSection('highlights')} className={`drawer-btn-link ${activeSection === 'highlights' ? 'active' : ''}`}>Company Highlights</button></li>
              <li><button onClick={() => scrollToSection('projects')} className={`drawer-btn-link ${activeSection === 'projects' ? 'active' : ''}`}>Projects</button></li>
              <li><button onClick={() => scrollToSection('reviews')} className={`drawer-btn-link ${activeSection === 'reviews' ? 'active' : ''}`}>Reviews</button></li>
              <li><button onClick={() => scrollToSection('why-choose')} className={`drawer-btn-link ${activeSection === 'why-choose' ? 'active' : ''}`}>Why Choose INNOXEL</button></li>
              <li><button onClick={() => scrollToSection('contact')} className={`drawer-btn-link ${activeSection === 'contact' ? 'active' : ''}`}>Contact</button></li>
              <li>
                <button onClick={handleGetStartedClick} className="drawer-cta-btn">Get Started</button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Section 1: HOME (REPLACED CONTENT) --- */}
      <section id="home" className="hero-section scroll-offset-marker">
        <div className="hero-grid">
          <div className="hero-content">
            {/* Hero Badge */}
            <motion.div 
              className="hero-badge"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            >
              <span className="badge-icon">🚀</span>
              <span className="badge-text">SOFTWARE • AI • CLOUD • INNOVATION</span>
            </motion.div>
            
            {/* Hero Main Heading */}
            <motion.h1 
              className="hero-heading"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.35 }}
            >
              Engineering Digital Solutions for a Smarter Future
              <div style={{ marginTop: '8px' }}>
                <span className="gradient-highlight-text">Software. AI. Cloud. Built to Scale.</span>
              </div>
            </motion.h1>

            {/* Hero Description */}
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
            >
              INNOXEL Private Limited helps businesses transform ideas into dependable digital products. We combine software engineering, artificial intelligence, cloud technologies, and modern product development to build solutions that are practical, scalable, and ready for the future.
            </motion.p>
            
            {/* Hero Action Buttons */}
            <motion.div 
              className="hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.65 }}
            >
              <button onClick={() => { playClick(); scrollToSection('contact'); }} onMouseEnter={playHover} className="btn-primary">
                Start a Conversation →
              </button>
              <button onClick={() => { playClick(); scrollToSection('services'); }} onMouseEnter={playHover} className="btn-secondary">
                Explore Our Capabilities
              </button>
            </motion.div>
          </div>

          {/* Right Hero Orbit Visual */}
          <div className="hero-visual-wrapper">
            <HeroOrbitVisual />
          </div>
        </div>

        {/* Trust Points below Hero */}
        <motion.div 
          className="hero-stats-bar-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.8 }}
        >
          <div className="hero-stat-col">
            <div className="stat-icon-wrapper">💻</div>
            <div className="stat-text-group">
              <span className="stat-count" style={{ fontSize: '15px' }}>Engineering-Driven Solutions</span>
              <span className="stat-desc-label" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Clean architecture and dependable implementation.</span>
            </div>
          </div>
          <div className="stat-col-divider" />

          <div className="hero-stat-col">
            <div className="stat-icon-wrapper">⚡</div>
            <div className="stat-text-group">
              <span className="stat-count" style={{ fontSize: '15px' }}>Scalable Technology</span>
              <span className="stat-desc-label" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Built to accommodate expanding workloads.</span>
            </div>
          </div>
          <div className="stat-col-divider" />

          <div className="hero-stat-col">
            <div className="stat-icon-wrapper">🎯</div>
            <div className="stat-text-group">
              <span className="stat-count" style={{ fontSize: '15px' }}>Business-Focused Development</span>
              <span className="stat-desc-label" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Aligned directly with operational objectives.</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- Section 2: ABOUT US (REPLACED CONTENT) --- */}
      <motion.section 
        id="about" 
        className={`about-section scroll-offset-marker section-wipe-container ${wipeActiveSections.about ? 'wipe-active' : ''}`}
        onViewportEnter={() => triggerWipe('about')}
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="section-container">
          <motion.div className="section-header" {...fadeInUp}>
            <span className="section-tag">ABOUT INNOXEL</span>
            <h2 className="section-title glowing-title">Technology Built Around Real Business Needs</h2>
            <div className="section-underline"></div>
          </motion.div>

          <div className="about-intro-grid">
            <motion.div className="about-intro-text" {...fadeInUp}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', fontWeight: '700', color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'inline-block', width: '4px', height: '24px', backgroundColor: '#F97316', borderRadius: '2px' }}></span>
                Engineering Dependable Digital Solutions
              </h3>
              <p style={{ marginBottom: '16px' }}>
                INNOXEL Private Limited is a technology company focused on building reliable software products and digital solutions for modern businesses. We work across software engineering, artificial intelligence, cloud technologies, automation, and digital product development.
              </p>
              <p style={{ marginBottom: '22px' }}>
                Our approach begins with understanding the problem before choosing the technology. From product architecture and user experience to development, testing, deployment, and ongoing improvement, we focus on building systems that are reliable today and adaptable tomorrow.
              </p>

              {/* Core Engineering Stack & Tool Badges Card */}
              <div className="about-tech-stack-card" style={{ background: '#ffffff', border: '1px solid #EFEFEF', borderRadius: '16px', padding: '20px', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.04)' }}>
                <h4 style={{ fontSize: '12.5px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚙️</span> Core Technology Stack & Tools
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="tech-badge" style={{ background: '#0F172A', color: '#ffffff', borderColor: '#22D3EE', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>⚡ React</span>
                  <span className="tech-badge" style={{ background: '#0F172A', color: '#ffffff', borderColor: '#22D3EE', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>☕ Java</span>
                  <span className="tech-badge" style={{ background: '#0F172A', color: '#ffffff', borderColor: '#22D3EE', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>🐍 Python</span>
                  <span className="tech-badge" style={{ background: '#0F172A', color: '#ffffff', borderColor: '#22D3EE', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>☁️ AWS</span>
                  <span className="tech-badge" style={{ background: '#0F172A', color: '#ffffff', borderColor: '#22D3EE', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>🐳 Docker</span>
                  <span className="tech-badge" style={{ background: '#0F172A', color: '#ffffff', borderColor: '#22D3EE', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>🍃 MongoDB</span>
                  <span className="tech-badge" style={{ background: '#0F172A', color: '#ffffff', borderColor: '#22D3EE', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>🐘 PostgreSQL</span>
                  <span className="tech-badge" style={{ background: '#0F172A', color: '#ffffff', borderColor: '#22D3EE', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>🔄 CI/CD</span>
                </div>
              </div>
            </motion.div>

            {/* Mission & Vision Cards */}
            <motion.div className="about-mv-grid" {...staggerContainer}>
              <div className="about-mv-card">
                <div className="mv-icon-box">🎯</div>
                <h4>MISSION</h4>
                <h5 style={{ margin: '4px 0 10px 0', color: '#F97316', fontSize: '15px', fontWeight: '600' }}>Make Technology Practical and Impactful</h5>
                <p>Our mission is to help organizations use technology to solve meaningful business problems, improve operations, and create better digital experiences for their customers.</p>
              </div>

              <div className="about-mv-card">
                <div className="mv-icon-box">🚀</div>
                <h4>VISION</h4>
                <h5 style={{ margin: '4px 0 10px 0', color: '#22D3EE', fontSize: '15px', fontWeight: '600' }}>Build Technology That Moves Businesses Forward</h5>
                <p>We aim to become a trusted technology partner for organizations looking to build, modernize, and scale digital products through strong engineering and responsible innovation.</p>
              </div>
            </motion.div>
          </div>

          {/* Core Values Grid */}
          <div className="core-values-wrapper">
            <h3 className="about-sub-title text-center">OUR CORE VALUES</h3>
            <motion.div className="core-values-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }} {...staggerContainer}>
              <div className="value-card">
                <div className="value-icon">🛡️</div>
                <h4>Engineering Excellence</h4>
                <p>We value clean architecture, quality development, testing, and maintainable systems.</p>
              </div>

              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h4>Customer Understanding</h4>
                <p>We begin with business requirements and user needs rather than technology for its own sake.</p>
              </div>

              <div className="value-card">
                <div className="value-icon">💡</div>
                <h4>Continuous Innovation</h4>
                <p>We continuously explore better ways to apply software, AI, and cloud technologies.</p>
              </div>

              <div className="value-card">
                <div className="value-icon">📈</div>
                <h4>Long-Term Thinking</h4>
                <p>We build solutions with future growth, maintenance, and scalability in mind.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* --- Section 3: SERVICES --- */}
      <motion.section 
        id="services" 
        className={`services-section scroll-offset-marker section-wipe-container ${wipeActiveSections.services ? 'wipe-active' : ''}`}
        onViewportEnter={() => triggerWipe('services')}
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="section-container">
          <motion.div className="section-header" {...fadeInUp}>
            <span className="section-tag">What We Offer</span>
            <h2 className="section-title glowing-title">Our Core Engineering Services</h2>
            <p className="section-subtitle">Comprehensive software engineering, AI, and cloud solutions</p>
            <div className="section-underline"></div>
          </motion.div>

          <motion.div className="services-grid" {...staggerContainer}>
            {servicesData.map((service, index) => (
              <motion.div key={index} onMouseEnter={playHover} className="service-card" {...fadeInUp}>
                <div className="service-icon-box orange-theme">
                  <span style={{ fontSize: '24px' }}>{service.icon}</span>
                </div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <button onClick={() => { playClick(); handleGetStartedClick(); }} onMouseEnter={playHover} className="service-learn-btn">
                  Learn More <span className="btn-arrow">→</span>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* --- Section 4: COMPANY HIGHLIGHTS --- */}
      <motion.section 
        id="highlights" 
        className={`highlights-section scroll-offset-marker section-wipe-container ${wipeActiveSections.highlights ? 'wipe-active' : ''}`}
        onViewportEnter={() => triggerWipe('highlights')}
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="section-container">
          <motion.div className="section-header" {...fadeInUp}>
            <span className="section-tag">OUR CAPABILITIES</span>
            <h2 className="section-title glowing-title">Built for Reliability, Designed for Growth</h2>
            <p className="section-subtitle">From product development to cloud infrastructure and intelligent systems, our capabilities are designed to support businesses throughout their digital journey.</p>
            <div className="section-underline"></div>
          </motion.div>

          <motion.div className="why-grid-six" {...staggerContainer}>
            {highlightCards.map((item, index) => (
              <motion.div key={index} className="why-card-six" {...fadeInUp}>
                <div className="why-icon-six" style={{ fontSize: '14px', fontWeight: '700', color: '#F97316' }}>
                  {item.num}
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <div style={{ textAlign: 'center', marginTop: '35px' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', background: '#ffffff', display: 'inline-block', padding: '12px 28px', borderRadius: '30px', border: '1px solid #EFEFEF', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
              Technology should not only work today. It should be ready for what comes next.
            </p>
          </div>
        </div>
      </motion.section>

      {/* --- Section 5: PROJECTS --- */}
      <motion.section 
        id="projects" 
        className={`portfolio-section scroll-offset-marker section-wipe-container ${wipeActiveSections.projects ? 'wipe-active' : ''}`}
        onViewportEnter={() => triggerWipe('projects')}
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="section-container">
          <motion.div className="section-header" {...fadeInUp}>
            <span className="section-tag">SELECTED WORK</span>
            <h2 className="section-title glowing-title">Solutions Designed Around Real Problems</h2>
            <p className="section-subtitle">Explore representative solutions demonstrating how INNOXEL can apply software engineering, AI, cloud, and modern technologies to different business challenges.</p>
            <div className="section-underline"></div>
          </motion.div>

          <div className="portfolio-grid-six" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {projectsData.map((project, idx) => (
              <motion.div key={idx} onMouseEnter={playHover} className="portfolio-card-six" {...fadeInUp}>
                <div className="project-info-six">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="tech-badge" style={{ background: 'rgba(34, 211, 238, 0.08)', color: '#0F172A', borderColor: 'rgba(34, 211, 238, 0.3)' }}>{project.industry}</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#F97316' }}>{project.focus}</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.desc}</p>
                  <div className="project-tech-tags">
                    {project.tech.map((t, i) => (
                      <span key={i} className="tech-badge">{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <p style={{ textAlign: 'center', fontSize: '12.5px', color: '#64748B', marginTop: '24px' }}>
            *Representative Projects & Concept Solutions demonstrating technical capabilities.
          </p>
        </div>
      </motion.section>

      {/* --- Section 6: REVIEWS --- */}
      <motion.section 
        id="reviews" 
        className={`reviews-section scroll-offset-marker section-wipe-container ${wipeActiveSections.reviews ? 'wipe-active' : ''}`}
        onViewportEnter={() => triggerWipe('reviews')}
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="section-container">
          <motion.div className="section-header" {...fadeInUp}>
            <span className="section-tag">Testimonials</span>
            <h2 className="section-title glowing-title">What Our Clients Say</h2>
            <p className="section-subtitle">Feedback from leaders and technology partners who trust INNOXEL</p>
            <div className="section-underline"></div>
          </motion.div>

          <motion.div 
            className="reviews-grid" 
            {...staggerContainer}
            onMouseEnter={() => setReviewsIsHovered(true)}
            onMouseLeave={() => setReviewsIsHovered(false)}
          >
            {reviewsData.map((review, idx) => (
              <motion.div 
                key={idx} 
                className={`review-card ${idx === reviewsActiveIndex ? 'active-highlight' : ''}`}
                {...fadeInUp}
              >
                <div className="review-stars">★★★★★</div>
                <p className="review-quote">"{review.quote}"</p>
                <div className="review-meta">
                  <span className="review-author">{review.author}</span>
                  <span className="review-title">{review.title}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* --- Section 7: WHY CHOOSE INNOXEL --- */}
      <motion.section 
        id="why-choose" 
        className={`why-choose-section scroll-offset-marker section-wipe-container ${wipeActiveSections.whyChoose ? 'wipe-active' : ''}`}
        onViewportEnter={() => triggerWipe('whyChoose')}
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="section-container">
          <motion.div className="section-header" {...fadeInUp}>
            <span className="section-tag">WHY INNOXEL</span>
            <h2 className="section-title glowing-title">A Technology Partner Built Around Engineering</h2>
            <p className="section-subtitle">Choosing the right technology partner is about more than development. It is about communication, technical decisions, reliability, and the ability to build for the long term.</p>
            <div className="section-underline"></div>
          </motion.div>

          <motion.div className="why-grid-six" {...staggerContainer}>
            {whyChooseCards.map((item, index) => (
              <motion.div key={index} className="why-card-six" {...fadeInUp}>
                <div className="why-icon-six" style={{ fontSize: '14px', fontWeight: '700', color: '#F97316' }}>
                  {item.num}
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <div style={{ textAlign: 'center', marginTop: '35px' }}>
            <button onClick={() => { playClick(); scrollToSection('contact'); }} onMouseEnter={playHover} className="btn-primary">
              Let's Build Something That Lasts →
            </button>
          </div>
        </div>
      </motion.section>

      {/* --- Section 8: CONTACT --- */}
      <motion.section 
        id="contact" 
        className={`contact-section scroll-offset-marker section-wipe-container ${wipeActiveSections.contact ? 'wipe-active' : ''}`}
        onViewportEnter={() => triggerWipe('contact')}
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="section-container">
          <motion.div className="section-header" {...fadeInUp}>
            <span className="section-tag">Contact Us</span>
            <h2 className="section-title glowing-title">Let's Discuss Your Project</h2>
            <p className="section-subtitle">Reach out to our engineering team to start your digital transformation journey</p>
            <div className="section-underline"></div>
          </motion.div>

          <div className="contact-layout">
            <motion.div className="contact-info" {...fadeInUp}>
              <h3>Start a Technical Discussion</h3>
              <p>Connect directly with our engineering team to review system requirements, discuss architecture options, or plan custom product development.</p>
              
              <div className="contact-details">
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <div>
                    <h4>Email Address</h4>
                    <p><a href="mailto:info@innoxel.in" style={{ color: '#F97316', textDecoration: 'none', fontWeight: '600' }}>info@innoxel.in</a></p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <div>
                    <h4>Direct Phone Contacts</h4>
                    <p>
                      <a href="tel:+917981264265" style={{ color: '#0F172A', textDecoration: 'none', fontWeight: '600', marginRight: '14px' }}>+91 79812 64265</a>
                      <a href="tel:+919392806950" style={{ color: '#0F172A', textDecoration: 'none', fontWeight: '600' }}>+91 93928 06950</a>
                    </p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <div>
                    <h4>Corporate Office</h4>
                    <p>DR.NO-28-9-8, GANESH CHOWK, DEVI CHOWK, RAJAHMUNDRY-533101, ANDHRA PRADESH, INDIA</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">⏰</span>
                  <div>
                    <h4>Operational Hours</h4>
                    <p>Mon - Sat: 9:00 AM - 7:00 PM IST (24/7 Priority Support)</p>
                  </div>
                </div>
              </div>

              {/* Google Map Mockup */}
              <div className="map-placeholder-container">
                <div className="map-mockup-globe"></div>
                <div className="map-mockup-details">
                  <span className="marker-dot"></span>
                  <span className="marker-label">INNOXEL Head Office</span>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div className="contact-form-container" {...fadeInUp}>
              <form id="contact-form" onSubmit={handleFormSubmit} className="premium-contact-form">
                <div className="form-row-two">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g. John Doe" 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g. john@company.com" 
                    />
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="e.g. +91 98765 43210" 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="company">Company Name</label>
                    <input 
                      type="text" 
                      id="company" 
                      name="company" 
                      value={formData.company} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Acme Corp" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="serviceRequired">Subject / Inquiry Type</label>
                  <select 
                    id="serviceRequired" 
                    name="serviceRequired" 
                    value={formData.serviceRequired} 
                    onChange={handleInputChange}
                  >
                    <option value="software">Custom Software Development</option>
                    <option value="ai">Artificial Intelligence & Automation</option>
                    <option value="cloud">Cloud Migration & Infrastructure</option>
                    <option value="consulting">Technology Consulting</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Project Requirements</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows="4" 
                    value={formData.message} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Tell us about your project requirements, scope, or business goal..." 
                  />
                </div>
                
                <button type="submit" onClick={playClick} onMouseEnter={playHover} className="submit-btn" style={{ width: '100%' }}>
                  Submit Request
                </button>

                <AnimatePresence>
                  {formSubmitted && (
                    <motion.div 
                      className="form-success-alert"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      🚀 Thank you! Our solution architects will review your details and contact you within 24 hours.
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* --- Footer --- */}
      <footer className="homepage-footer">
        <div className="section-container footer-grid">
          <div className="footer-brand">
            <div className="footer-logo" onClick={() => scrollToSection('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <img 
                src={logoImg} 
                alt="INNOXEL Private Limited" 
                style={{ height: '48px', width: 'auto', maxHeight: '52px', objectFit: 'contain', display: 'block' }} 
              />
            </div>
            <p>Empowering digital evolution through bleeding-edge software design, high-fidelity development, and machine intelligence engineering.</p>
            
            {/* Newsletter Subscription */}
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <label htmlFor="newsletterEmail">Subscribe to our newsletter</label>
              <div className="newsletter-input-group">
                <input 
                  type="email" 
                  id="newsletterEmail" 
                  required 
                  placeholder="Enter your email" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <button type="submit" className="newsletter-btn">→</button>
              </div>
              <AnimatePresence>
                {newsletterSubscribed && (
                  <motion.span 
                    className="newsletter-success"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    Subscribed successfully!
                  </motion.span>
                )}
              </AnimatePresence>
            </form>
          </div>
          
          <div className="footer-links-group">
            <h4>Services</h4>
            <ul>
              <li><button onClick={() => scrollToSection('services')} className="footer-link-btn">Web Development</button></li>
              <li><button onClick={() => scrollToSection('services')} className="footer-link-btn">Mobile App Development</button></li>
              <li><button onClick={() => scrollToSection('services')} className="footer-link-btn">UI/UX Design</button></li>
              <li><button onClick={() => scrollToSection('services')} className="footer-link-btn">AI & Automation</button></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h4>Company</h4>
            <ul>
              <li><button onClick={() => scrollToSection('about')} className="footer-link-btn">About Us</button></li>
              <li><button onClick={() => scrollToSection('highlights')} className="footer-link-btn">Company Highlights</button></li>
              <li><button onClick={() => scrollToSection('why-choose')} className="footer-link-btn">Why Choose Us</button></li>
              <li><button onClick={() => scrollToSection('contact')} className="footer-link-btn">Contact</button></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h4>Projects</h4>
            <ul>
              <li><button onClick={() => scrollToSection('projects')} className="footer-link-btn">Business Operations</button></li>
              <li><button onClick={() => scrollToSection('projects')} className="footer-link-btn">AI Support Assistant</button></li>
              <li><button onClick={() => scrollToSection('projects')} className="footer-link-btn">Healthcare Platform</button></li>
              <li><button onClick={() => scrollToSection('projects')} className="footer-link-btn">Business Dashboard</button></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} INNOXEL Private Limited. All rights reserved.</p>
          
          <div className="footer-social-row">
            <a href="#" className="footer-social-link">LinkedIn</a>
            <span className="link-divider">|</span>
            <a href="#" className="footer-social-link">GitHub</a>
            <span className="link-divider">|</span>
            <a href="#" className="footer-social-link">Twitter</a>
          </div>

          <button onClick={() => scrollToSection('home')} className="back-to-top-btn" aria-label="Back to top">
            ↑
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
