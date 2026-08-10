import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// 3D Simplex Noise implementation in GLSL
const simplexNoiseGLSL = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0) )
           + i.y + vec4(0.0, i1.y, i2.y, 1.0) )
           + i.x + vec4(0.0, i1.x, i2.x, 1.0) );

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

const vertexShader = `
uniform float uTime;
uniform vec3 uMouse;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uMouseDriftSpeed;
uniform float uNoiseSpeed;
uniform float uPixelRatio;
uniform float uSize;
uniform float uViewportWidth;
uniform float uViewportHeight;
uniform float uViewportDepth;
uniform float uTransitionProgress;

attribute vec3 aRandom;
attribute vec3 aColor;

varying vec3 vColor;
varying float vInteraction;

${simplexNoiseGLSL}

void main() {
  vColor = aColor;

  // Responsive boundary scaling
  vec3 scaledPos = position * vec3(uViewportWidth, uViewportHeight, uViewportDepth);
  vec3 currentPos = scaledPos;

  // 1. Spring-physics Mouse Repulsion (Water/Silk ripple equations)
  vec3 mouseToParticle = currentPos - uMouse;
  float dist = length(mouseToParticle);
  float wave = 0.0;
  
  if (dist < uMouseRadius && dist > 0.001) {
    float x = dist / uMouseRadius;
    
    // Wave profile: push near cursor, soft spring pull-back in outer regions
    wave = sin(x * 3.14159 * 2.0) * (1.0 - x);
    if (wave < 0.0) {
      wave *= 0.45; // make repulsion dominant, pull-back gentle
    }
    
    vec3 pushDir = normalize(mouseToParticle);
    pushDir.z *= 0.15; // constrain displacement to 2.5D plane
    currentPos += pushDir * wave * uMouseStrength;
  }
  
  vInteraction = max(wave, 0.0);

  // 2. Slow Noise Floating
  float floatTime = uTime * uNoiseSpeed * (0.55 + aRandom.y * 0.9);
  float nX = snoise(vec3(scaledPos.x * uNoiseFreq + aRandom.x * 50.0, scaledPos.y * uNoiseFreq, floatTime));
  float nY = snoise(vec3(scaledPos.y * uNoiseFreq + aRandom.y * 50.0, scaledPos.z * uNoiseFreq, floatTime + 40.0));
  float nZ = snoise(vec3(scaledPos.z * uNoiseFreq + aRandom.z * 50.0, scaledPos.x * uNoiseFreq, floatTime + 80.0));
  
  currentPos += vec3(nX, nY, nZ) * uNoiseAmp * (0.35 + aRandom.z * 0.65);

  // 3. Exit Transition: expand outward from screen center
  vec3 outwardDir = vec3(0.0);
  float len = length(position);
  if (len > 0.001) {
    outwardDir = position / len;
  }
  outwardDir.z *= 0.4;
  currentPos += outwardDir * uTransitionProgress * 15.0;

  // Project point
  vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation
  float sizeMultiplier = uSize * (0.3 + aRandom.x * 0.7);
  gl_PointSize = sizeMultiplier * uPixelRatio * (280.0 / max(-mvPosition.z, 0.1));
}
`;

const fragmentShader = `
varying vec3 vColor;
varying float vInteraction;
uniform float uTransitionProgress;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  
  // Custom double layer radial glow (soft star texture)
  float halo = smoothstep(0.5, 0.0, dist);
  float glow = pow(halo, 4.0);
  float core = smoothstep(0.1, 0.0, dist);
  
  float alpha = core * 0.7 + glow * 0.3;
  
  // Highlighting: fade color to white at peak cursor ripple interaction
  vec3 finalColor = mix(vColor, vec3(1.0, 1.0, 1.0), vInteraction * 0.6);
  
  // Transparency decay during page transitions
  float opacityBoost = 1.0 + vInteraction * 0.6;
  float finalAlpha = alpha * 0.8 * opacityBoost * (1.0 - uTransitionProgress);
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

// Shaders for background tiny light particles (Star Field)
const bgVertexShader = `
uniform float uTime;
uniform float uTransitionProgress;
uniform float uSize;
uniform float uPixelRatio;

attribute vec3 aRandom;

varying float vAlpha;

void main() {
  vec3 pos = position;

  // Ambient floating
  pos.x += sin(uTime * 0.04 + aRandom.x * 100.0) * 1.5;
  pos.y += cos(uTime * 0.03 + aRandom.y * 100.0) * 1.5;
  pos.z += sin(uTime * 0.02 + aRandom.z * 100.0) * 0.8;

  // Transition explosion
  vec3 outwardDir = vec3(0.0);
  float len = length(position);
  if (len > 0.001) {
    outwardDir = position / len;
  }
  pos += outwardDir * uTransitionProgress * 20.0;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  gl_PointSize = uSize * uPixelRatio * (200.0 / max(-mvPosition.z, 0.1));
  
  vAlpha = (1.0 - uTransitionProgress) * (0.05 + aRandom.x * 0.15);
}
`;

const bgFragmentShader = `
varying float vAlpha;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;
  
  float glow = pow(1.0 - dist / 0.5, 2.5);
  
  gl_FragColor = vec4(0.85, 0.95, 1.0, glow * vAlpha);
}
`;

export default function ParticleSystem({ transitioning }) {
  const count = 10000;
  const pointsRef = useRef();
  const bgPointsRef = useRef();
  const { raycaster, pointer, viewport } = useThree();

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const mouseActive = useRef(false);
  const firstMove = useRef(true);

  // Spring physics variables
  const springMouse = useMemo(() => new THREE.Vector3(9999, 9999, 9999), []);
  const springVelocity = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const springStiffness = 0.035;
  const springDamping = 0.88;

  useEffect(() => {
    const handleMouseMove = () => {
      if (!mouseActive.current) {
        firstMove.current = true;
        springVelocity.set(0, 0, 0);
      }
      mouseActive.current = true;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
    };
  }, []);

  // Sync GSAP transition timeline
  useEffect(() => {
    if (transitioning) {
      if (pointsRef.current) {
        gsap.to(pointsRef.current.material.uniforms.uTransitionProgress, {
          value: 1.0,
          duration: 3.0,
          ease: 'power3.inOut',
        });
      }
      if (bgPointsRef.current) {
        gsap.to(bgPointsRef.current.material.uniforms.uTransitionProgress, {
          value: 1.0,
          duration: 3.5,
          ease: 'power3.inOut',
        });
      }
    }
  }, [transitioning]);

  // Dual-Spiral position color buffers
  const [positions, colors, randoms] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 3);

    const halfCount = count / 2;
    const numArms = 35;
    const pointsPerArm = Math.floor(halfCount / numArms);

    // Left Spiral Palette (Dark Blue & Neon Blue)
    const paletteL = [
      new THREE.Color('#0F172A'), // Dark Blue
      new THREE.Color('#22D3EE'), // Neon Blue
      new THREE.Color('#ffffff'), // White
      new THREE.Color('#22D3EE')  // Neon Blue
    ];

    // Right Spiral Palette (Orange & Neon Blue)
    const paletteR = [
      new THREE.Color('#F97316'), // Orange
      new THREE.Color('#22D3EE'), // Neon Blue
      new THREE.Color('#ffffff'), // White
      new THREE.Color('#F97316')  // Orange
    ];

    // 1. Generate Left Spiral (Blue/Cyan colors)
    for (let a = 0; a < numArms; a++) {
      const armAngle = (a / numArms) * Math.PI * 2;
      for (let p = 0; p < pointsPerArm; p++) {
        const i = a * pointsPerArm + p;
        const t = p / (pointsPerArm - 1); // 0 to 1

        const radius = 0.05 + t * 0.72;      // Outward distance along spiral
        const angle = armAngle + t * 3.8;    // Spiral twist angle

        const jitterR = (Math.random() - 0.5) * 0.016;
        const jitterA = (Math.random() - 0.5) * 0.045;

        // Position coordinates centered on the left
        const x = -0.32 + Math.cos(angle + jitterA) * (radius + jitterR);
        const y = Math.sin(angle + jitterA) * (radius + jitterR);
        const z = Math.sin(t * Math.PI * 4.0) * 0.06; // Wave height offset

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;

        // Blend Left colors
        let c;
        const randVal = Math.random();
        if (randVal < 0.4) {
          c = paletteL[0].clone().lerp(paletteL[1], Math.random());
        } else if (randVal < 0.75) {
          c = paletteL[1].clone().lerp(paletteL[2], Math.random());
        } else {
          c = paletteL[2].clone().lerp(paletteL[3], Math.random());
        }

        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;

        rnd[i * 3] = Math.random();
        rnd[i * 3 + 1] = Math.random();
        rnd[i * 3 + 2] = Math.random();
      }
    }

    // 2. Generate Right Spiral (Purple/Violet colors)
    for (let a = 0; a < numArms; a++) {
      const armAngle = (a / numArms) * Math.PI * 2;
      for (let p = 0; p < pointsPerArm; p++) {
        const i = halfCount + (a * pointsPerArm + p);
        const t = p / (pointsPerArm - 1); // 0 to 1

        const radius = 0.05 + t * 0.72;
        const angle = armAngle + t * 3.8;

        const jitterR = (Math.random() - 0.5) * 0.016;
        const jitterA = (Math.random() - 0.5) * 0.045;

        // Position coordinates centered on the right
        const x = 0.32 + Math.cos(angle + jitterA) * (radius + jitterR);
        const y = Math.sin(angle + jitterA) * (radius + jitterR);
        const z = Math.sin(t * Math.PI * 4.0) * 0.06;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;

        // Blend Right colors
        let c;
        const randVal = Math.random();
        if (randVal < 0.4) {
          c = paletteR[0].clone().lerp(paletteR[1], Math.random());
        } else if (randVal < 0.75) {
          c = paletteR[1].clone().lerp(paletteR[2], Math.random());
        } else {
          c = paletteR[2].clone().lerp(paletteR[3], Math.random());
        }

        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;

        rnd[i * 3] = Math.random();
        rnd[i * 3 + 1] = Math.random();
        rnd[i * 3 + 2] = Math.random();
      }
    }

    return [pos, col, rnd];
  }, []);

  // Background star field buffer
  const bgCount = 800;
  const [bgPositions, bgRandoms] = useMemo(() => {
    const pos = new Float32Array(bgCount * 3);
    const rnd = new Float32Array(bgCount * 3);

    for (let i = 0; i < bgCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40.0;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12.0 - 5.0;

      rnd[i * 3] = Math.random();
      rnd[i * 3 + 1] = Math.random();
      rnd[i * 3 + 2] = Math.random();
    }
    return [pos, rnd];
  }, []);

  // Render loop update
  useFrame((state) => {
    const { clock, raycaster: stateRaycaster } = state;
    const elapsedTime = clock.getElapsedTime();

    if (pointsRef.current) {
      const material = pointsRef.current.material;
      material.uniforms.uTime.value = elapsedTime;

      if (mouseActive.current) {
        stateRaycaster.setFromCamera(pointer, state.camera);
        const targetMouse = new THREE.Vector3();
        stateRaycaster.ray.intersectPlane(plane, targetMouse);

        if (firstMove.current) {
          springMouse.copy(targetMouse);
          firstMove.current = false;
        } else {
          // Spring update
          const displacement = new THREE.Vector3().subVectors(targetMouse, springMouse);
          const force = displacement.multiplyScalar(springStiffness);
          springVelocity.add(force);
          springVelocity.multiplyScalar(springDamping);
          springMouse.add(springVelocity);
        }
        material.uniforms.uMouse.value.copy(springMouse);
      } else {
        material.uniforms.uMouse.value.set(9999, 9999, 9999);
      }
    }

    if (bgPointsRef.current) {
      bgPointsRef.current.material.uniforms.uTime.value = elapsedTime;
    }
  });

  // Keep uniforms sized correctly
  useEffect(() => {
    if (pointsRef.current) {
      const material = pointsRef.current.material;
      material.uniforms.uViewportWidth.value = viewport.width;
      material.uniforms.uViewportHeight.value = viewport.height;
    }
  }, [viewport.width, viewport.height]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector3(9999, 9999, 9999) },
    uMouseRadius: { value: 3.4 },      // radius of repulsion
    uMouseStrength: { value: 1.65 },    // force amplitude
    uNoiseFreq: { value: 0.16 },       // noise frequency
    uNoiseAmp: { value: 0.6 },         // noise amplitude
    uNoiseSpeed: { value: 0.35 },      // noise speed
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2.0) },
    uSize: { value: 24.0 },            // base point size
    uViewportWidth: { value: viewport.width },
    uViewportHeight: { value: viewport.height },
    uViewportDepth: { value: 4.5 },
    uTransitionProgress: { value: 0.0 }
  }), []);

  const bgUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTransitionProgress: { value: 0.0 },
    uSize: { value: 6.0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2.0) },
  }), []);

  return (
    <group>
      {/* Background stars */}
      <points ref={bgPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[bgPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-aRandom"
            args={[bgRandoms, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={bgVertexShader}
          fragmentShader={bgFragmentShader}
          uniforms={bgUniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Primary wave dual-spiral grid */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aColor"
            args={[colors, 3]}
          />
          <bufferAttribute
            attach="attributes-aRandom"
            args={[randoms, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
