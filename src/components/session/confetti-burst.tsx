"use client";

import { useEffect, useState } from "react";

const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];
const PARTICLE_COUNT = 40;

interface Particle {
  id: number;
  left: number; // vw
  delay: number; // s
  duration: number; // s
  color: string;
  rotate: number;
}

/** Lightweight, dependency-free confetti burst. Renders itself out after ~2.5s. */
export function ConfettiBurst() {
  const [particles, setParticles] = useState<Particle[] | null>(null);

  useEffect(() => {
    setParticles(
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1.2,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
      }))
    );

    const timeout = setTimeout(() => setParticles(null), 3000);
    return () => clearTimeout(timeout);
  }, []);

  if (!particles) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-10px] h-2.5 w-2.5 rounded-sm"
          style={{
            left: `${p.left}vw`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}
