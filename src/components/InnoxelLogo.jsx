import React from 'react';
import logoImg from '../assets/innoxel-logo.png';

export default function InnoxelLogo({ className = '', style = {} }) {
  return (
    <img 
      src={logoImg} 
      alt="INNOXEL Private Limited" 
      className={`innoxel-logo-img ${className}`} 
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain', ...style }} 
    />
  );
}
