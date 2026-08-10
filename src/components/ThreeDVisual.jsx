import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function AbstractVisual({ hoveredIndex }) {
  const meshRef = useRef(null);
  const wireframeRef = useRef(null);
  const particlesRef = useRef(null);

  // Setup targets based on hover states
  const targetColor = new THREE.Color("#22D3EE");
  let targetDistort = 0.45;
  let targetSpeed = 1.8;
  let targetScale = 1.0;
  let targetWireframeOpacity = 0.2;
  let targetParticlesOpacity = 0.5;

  if (hoveredIndex === 3) {
    // AI Solutions: high distortion, orange-red synaptic fire theme
    targetColor.set("#F97316");
    targetDistort = 0.85;
    targetSpeed = 3.5;
    targetScale = 1.15;
    targetWireframeOpacity = 0.45;
    targetParticlesOpacity = 0.85;
  } else if (hoveredIndex === 4) {
    // Cloud Solutions: soft cyan bubble
    targetColor.set("#06B6D4");
    targetDistort = 0.2;
    targetSpeed = 0.9;
    targetScale = 1.05;
    targetWireframeOpacity = 0.1;
    targetParticlesOpacity = 0.3;
  } else if (hoveredIndex === 6) {
    // Cyber Security: rotating crystalline cage shield
    targetColor.set("#3B82F6");
    targetDistort = 0.08;
    targetSpeed = 0.5;
    targetScale = 0.92;
    targetWireframeOpacity = 0.85;
    targetParticlesOpacity = 0.2;
  } else if (hoveredIndex === 1 || hoveredIndex === 2) {
    // Web / Mobile Dev: hyper-kinetic digital green grid
    targetColor.set("#10B981");
    targetDistort = 0.55;
    targetSpeed = 2.4;
    targetScale = 1.1;
    targetWireframeOpacity = 0.3;
    targetParticlesOpacity = 0.9;
  } else if (hoveredIndex !== null) {
    // Other hover items: soft orange-white spark
    targetColor.set("#F59E0B");
    targetDistort = 0.5;
    targetSpeed = 1.8;
    targetScale = 1.0;
    targetWireframeOpacity = 0.2;
    targetParticlesOpacity = 0.6;
  }

  // Refs for current interpolation values
  const currentDistort = useRef(0.45);
  const currentSpeed = useRef(1.8);
  const currentScale = useRef(1.0);
  const currentWireframeOpacity = useRef(0.2);
  const currentParticlesOpacity = useRef(0.5);
  const currentColor = useRef(new THREE.Color("#22D3EE"));

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Mouse tracking coordinate drift
    const targetX = state.pointer.x * 1.2;
    const targetY = state.pointer.y * 1.2;
    
    // Frame-rate independent LERP logic
    const lerpFactor = 0.08;
    currentDistort.current += (targetDistort - currentDistort.current) * lerpFactor;
    currentSpeed.current += (targetSpeed - currentSpeed.current) * lerpFactor;
    currentScale.current += (targetScale - currentScale.current) * lerpFactor;
    currentWireframeOpacity.current += (targetWireframeOpacity - currentWireframeOpacity.current) * lerpFactor;
    currentParticlesOpacity.current += (targetParticlesOpacity - currentParticlesOpacity.current) * lerpFactor;
    currentColor.current.lerp(targetColor, lerpFactor);

    if (meshRef.current) {
      meshRef.current.rotation.y += (targetX * 0.2 - meshRef.current.rotation.y) * 0.05;
      meshRef.current.rotation.x += (-targetY * 0.2 - meshRef.current.rotation.x) * 0.05;
      meshRef.current.position.y = Math.sin(time * 1.2) * 0.15;
      meshRef.current.scale.setScalar(currentScale.current);
      
      meshRef.current.material.distort = currentDistort.current;
      meshRef.current.material.speed = currentSpeed.current;
      meshRef.current.material.color.copy(currentColor.current);
    }

    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = time * 0.15;
      wireframeRef.current.rotation.x = time * 0.08;
      wireframeRef.current.position.y = Math.sin(time * 1.2) * 0.15;
      wireframeRef.current.scale.setScalar(currentScale.current * 1.25);
      
      wireframeRef.current.material.opacity = currentWireframeOpacity.current;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = -time * 0.05;
      particlesRef.current.rotation.x = time * 0.03 + targetY * 0.1;
      
      particlesRef.current.material.opacity = currentParticlesOpacity.current;
    }
  });

  return (
    <group>
      {/* Morphing glassmorphic sphere core using MeshDistortMaterial */}
      <Sphere ref={meshRef} args={[1.2, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#22D3EE"
          distort={0.45}
          speed={1.8}
          roughness={0.05}
          metalness={0.05}
          transmission={0.8}
          thickness={1.5}
          clearcoat={1.0}
        />
      </Sphere>

      {/* Wireframe outer shell */}
      <mesh ref={wireframeRef}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshBasicMaterial
          color={hoveredIndex === 3 ? "#F97316" : "#22D3EE"}
          wireframe={true}
          transparent={true}
          opacity={0.2}
        />
      </mesh>

      {/* Abstract floating particle network */}
      <points ref={particlesRef}>
        <sphereGeometry args={[2.0, 24, 24]} />
        <pointsMaterial
          color={hoveredIndex === 3 ? "#F97316" : "#22D3EE"}
          size={0.03}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.5}
        />
      </points>

      {/* Outer ambient glow dots */}
      <points>
        <sphereGeometry args={[2.5, 12, 12]} />
        <pointsMaterial
          color="#ffffff"
          size={0.015}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.2}
        />
      </points>
    </group>
  );
}

export default function ThreeDVisual({ hoveredIndex }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fof: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.65} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#22D3EE" />
        <pointLight position={[-10, -10, -10]} intensity={1.0} color="#F97316" />
        <directionalLight position={[0, 5, 2]} intensity={1.2} color="#ffffff" />
        
        <AbstractVisual hoveredIndex={hoveredIndex} />
      </Canvas>
    </div>
  );
}
