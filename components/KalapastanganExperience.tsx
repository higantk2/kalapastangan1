"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, Stars, OrbitControls, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";

// --- LYRICS CONFIGURATION ---
const LYRICS_MAP = [
  { time: 0, text: "" },
  { time: 14.5, text: "Oras nang sambahin" },
  { time: 18.0, text: "ang ngalan Mo" },
  { time: 22.5, text: "Para mabuhay" },
  { time: 24.5, text: "habang-buhay" },
  { time: 27.0, text: "sa puso't isipan Mo" },
  { time: 32.5, text: "Sino ba ako" },
  { time: 36.0, text: "para mapansin Mo?" },
  { time: 41.0, text: "KALAPASTANGAN" }, // DROP
  { time: 45.0, text: "ang 'di Ka ibigin" },
];

// --- TUNNEL RINGS COMPONENT ---
function TunnelRings({ intensity }: { intensity: number }) {
  const rings = useMemo(() => Array.from({ length: 15 }), []);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Rotate the whole tunnel based on music intensity
    groupRef.current.rotation.z += 0.002 + (intensity * 0.0001);
    
    // Move rings towards camera
    groupRef.current.children.forEach((mesh, i) => {
      mesh.position.z += 0.1 + (intensity * 0.01); 
      if (mesh.position.z > 10) {
        mesh.position.z = -30; // Reset to back
      }
    });
  });

  return (
    <group ref={groupRef}>
      {rings.map((_, i) => (
        <mesh key={i} position={[0, 0, -i * 3]} rotation={[0, 0, i]}>
          <torusGeometry args={[4, 0.05, 16, 100]} />
          <meshStandardMaterial 
            color={intensity > 30 ? "#ff0000" : "#333"} 
            emissive={intensity > 30 ? "#ff0000" : "#000"}
            emissiveIntensity={intensity > 30 ? 2 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

// --- LYRICS DISPLAY ---
function LyricsDisplay({ currentTime, intensity }: { currentTime: number, intensity: number }) {
  const activeLyric = useMemo(() => {
    const reversed = [...LYRICS_MAP].reverse();
    return reversed.find((l) => currentTime >= l.time);
  }, [currentTime]);

  const text = activeLyric ? activeLyric.text : "";
  
  // Random shake on high intensity
  const shake = intensity > 20 ? (Math.random() - 0.5) * 0.2 : 0;

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Text
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        fontSize={intensity > 40 ? 2.5 : 1.5}
        maxWidth={8}
        lineHeight={1}
        textAlign="center"
        position={[shake, shake, 0]}
        anchorX="center"
        anchorY="middle"
      >
        {text}
        <meshStandardMaterial
          color={intensity > 30 ? "#ff0000" : "#ffffff"}
          emissive={intensity > 30 ? "#ff0000" : "#ffffff"}
          emissiveIntensity={intensity > 30 ? 3 : 0.2}
          toneMapped={false}
        />
      </Text>
    </Float>
  );
}

// --- EFFECTS RIG ---
// Controls the Glow (Bloom) and Glitch (ChromaticAberration)
function EffectsRig({ intensity }: { intensity: number }) {
  const isHeavy = intensity > 30; // The threshold for "Heavy" music

  return (
    <EffectComposer disableNormalPass>
      {/* Bloom makes bright things glow */}
      <Bloom 
        luminanceThreshold={0.5} 
        mipmapBlur 
        intensity={isHeavy ? 2.5 : 0.5} 
        radius={isHeavy ? 0.8 : 0.4} 
      />
      {/* Chromatic Aberration splits the RGB channels (Glitch effect) */}
      <ChromaticAberration 
        offset={new THREE.Vector2(isHeavy ? 0.005 : 0, isHeavy ? 0.005 : 0)} 
        radialModulation={false}
        modulationOffset={0}
      />
    </EffectComposer>
  );
}

// --- MAIN COMPONENT ---
export default function KalapastanganExperience() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [intensity, setIntensity] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startExperience = () => {
    if(audioRef.current) return;

    const audio = new Audio("/song.mp3");
    audioRef.current = audio;
    audio.loop = false;

    // Audio Context Setup
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(audio);
    const analyser = audioCtx.createAnalyser();
    
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    analyserRef.current = analyser;

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(e => console.error("Audio play failed", e));

    const updateLoop = () => {
      if(!audio.paused && !audio.ended) {
        setCurrentTime(audio.currentTime);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setIntensity(avg); // 0 to ~150 typically
        
        requestAnimationFrame(updateLoop);
      }
    };
    updateLoop();
  };

  return (
    <div className="w-full h-full relative bg-black">
      {/* START BUTTON OVERLAY */}
      {!isPlaying && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
          <h1 className="text-5xl font-bold tracking-[0.5em] mb-4 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
            FITTERKARMA
          </h1>
          <p className="text-xl tracking-widest mb-12 opacity-70">KALAPASTANGAN</p>
          <button 
            onClick={startExperience}
            className="px-10 py-4 border border-white text-white hover:bg-white hover:text-black transition-all duration-500 tracking-[0.2em] uppercase"
          >
            Initiate Ritual
          </button>
        </div>
      )}

      {/* 3D SCENE */}
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <color attach="background" args={['#000000']} />
        
        {/* Moving Elements */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={2} />
        <TunnelRings intensity={intensity} />
        <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color={intensity > 30 ? "red" : "white"} />

        {/* Text & Post Processing */}
        <LyricsDisplay currentTime={currentTime} intensity={intensity} />
        <EffectsRig intensity={intensity} />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate={isPlaying} autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}