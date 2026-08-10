import React from 'react';
import { motion } from 'framer-motion';
import logoImg from '../assets/innoxel-logo.png';

export default function Header({ transitioning, onNavigate }) {
  const handleLinkClick = (e, sectionId) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(sectionId);
    }
  };

  return (
    <motion.header
      className="header-container"
      initial={{ y: -50, opacity: 0 }}
      animate={transitioning ? { y: -80, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.25 }}
    >
      {/* Brand Logo */}
      <a href="/" className="logo-container" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img 
          src={logoImg} 
          alt="INNOXEL Private Limited" 
          style={{ height: '52px', width: 'auto', maxHeight: '56px', objectFit: 'contain', display: 'block' }} 
        />
      </a>

      {/* Navigation Options */}
      <ul className="nav-menu">
        <li><a href="#home" onClick={(e) => handleLinkClick(e, 'home')} className="nav-link">Home</a></li>
        <li><a href="#about" onClick={(e) => handleLinkClick(e, 'about')} className="nav-link">About Us</a></li>
        <li><a href="#services" onClick={(e) => handleLinkClick(e, 'services')} className="nav-link">Services</a></li>
        <li><a href="#highlights" onClick={(e) => handleLinkClick(e, 'highlights')} className="nav-link">Company Highlights</a></li>
        <li><a href="#projects" onClick={(e) => handleLinkClick(e, 'projects')} className="nav-link">Projects</a></li>
        <li><a href="#reviews" onClick={(e) => handleLinkClick(e, 'reviews')} className="nav-link">Reviews</a></li>
        <li><a href="#why-choose" onClick={(e) => handleLinkClick(e, 'why-choose')} className="nav-link">Why Choose INNOXEL</a></li>
        <li><a href="#contact" onClick={(e) => handleLinkClick(e, 'contact')} className="nav-link">Contact</a></li>
        <li>
          <a href="#contact" onClick={(e) => handleLinkClick(e, 'contact')} className="get-started-btn">Get Started</a>
        </li>
      </ul>
    </motion.header>
  );
}
