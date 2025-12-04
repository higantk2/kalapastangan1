"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, Stars, OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";

// --- 1. LYRICS CONFIGURATION ---
// Adjust the 'time' (seconds) to match exactly when the singer sings the line.
const LYRICS_MAP = [
  { time: 0, text: "" },
  { time: 14.5, text: "Oras nang sambahin" },
  { time: 18.0, text: "ang ngalan Mo" },
  { time: 22.5, text: "Para mabuhay" },
  { time: 24.5, text: "habang-buhay" },
  { time: 27.0, text: "sa puso't isipan Mo" },
  { time: 32.5, text: "Sino ba ako" },
  { time: 36.0, text: "para mapansin Mo?" },
  { time: 41.0, text: "KALAPASTANGAN" }, // The drop/intense part
  { time: 45.0, text: "ang 'di Ka ibigin" },
];

// --- 2. 3D TEXT COMPONENT ---
function LyricsDisplay({ currentTime, intensity }: { currentTime: number, intensity: number }) {
  const activeLyric = useMemo(() => {
    // Find the latest lyric that has passed
    const reversed = [...LYRICS_MAP].reverse();
    return reversed.find((l) => currentTime >= l.time);
  }, [currentTime]);

  const text = activeLyric ? activeLyric.text : "";
  
  // Glitch effect: Randomly shift position slightly if intensity is high
  const glitch = intensity > 20 ? (Math.random() - 0.5) * 0.2 : 0;

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Text
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        fontSize={intensity > 25 ? 2 : 1.5} // Text gets huge on drops
        maxWidth={8}
        lineHeight={1}
        letterSpacing={-0.05}
        textAlign="center"
        position={[glitch, glitch, 0]}
        anchorX="center"
        anchorY="middle"
      >
        {text}
        <meshStandardMaterial
          color={intensity > 30 ? "#ff0000" : "#ffffff"} // White normally, Red on intensity
          emissive={intensity > 30 ? "#ff0000" : "#000000"}
          emissiveIntensity={intensity > 30 ? 2 : 0}
          toneMapped={false}
        />
      </Text>
    </Float>
  );
}

// --- 3. REACTIVE LIGHTS & CAMERA SHAKE ---
function SceneEffects({ analyser }: { analyser: AnalyserNode | null }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const vec = new THREE.Vector3();

  useFrame((state) => {
    if (analyser && lightRef.current) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average loudness (bass/intensity)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length; // 0 to 255 typically

      // 1. Light Pulse
      lightRef.current.intensity = 2 + (average / 10);
      
      // 2. Color Shift (White -> Deep Red)
      const targetColor = average > 40 ? new THREE.Color("#ff0040") : new THREE.Color("#ffffff");
      lightRef.current.color.lerp(targetColor, 0.1);

      // 3. Camera Shake (Subtle heartbeat)
      if (average > 30) {
        state.camera.position.lerp(vec.set((Math.random() - 0.5) * 0.2, 0, 8 + (Math.random() * 0.5)), 0.1);
      } else {
        state.camera.position.lerp(vec.set(0, 0, 8), 0.05);
      }
    }
  });

  return (
    <>
      <pointLight ref={lightRef} position={[0, 0, 5]} distance={20} decay={2} />
      <ambientLight intensity={0.2} />
    </>
  );
}

// --- 4. MAIN COMPONENT ---
export default function KalapastanganExperience() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [intensity, setIntensity] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startExperience = () => {
    if(audioRef.current) return; // Prevent double click

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

    // Sync Loop
    const updateLoop = () => {
      if(!audio.paused && !audio.ended) {
        setCurrentTime(audio.currentTime);
        
        // Get intensity for React state (to drive text size/color in pure React components)
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setIntensity(avg);
        
        requestAnimationFrame(updateLoop);
      }
    };
    updateLoop();
  };

  return (
    <div className="w-full h-full relative bg-black">
      {/* UI Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 text-white">
          <h1 className="text-4xl font-bold tracking-[0.5em] mb-8 text-red-600 animate-pulse">KALAPASTANGAN</h1>
          <button 
            onClick={startExperience}
            className="px-8 py-3 border border-white/30 hover:bg-white hover:text-black transition-all tracking-widest text-sm uppercase"
          >
            Enter The Altar
          </button>
        </div>
      )}

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <color attach="background" args={['#050505']} />
        
        {/* Atmosphere */}
        <fog attach="fog" args={['#000000', 5, 20]} />
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={100} scale={10} size={2} speed={0.4} opacity={0.5} color="#fff" />

        {/* Core Elements */}
        <SceneEffects analyser={analyserRef.current} />
        <LyricsDisplay currentTime={currentTime} intensity={intensity} />

        {/* Reflective Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial 
            color="#111" 
            roughness={0.1} 
            metalness={0.8} 
          />
        </mesh>

        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2} // Prevent going below floor
          autoRotate={isPlaying}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}