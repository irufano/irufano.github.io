"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import EidMazeGame from "./EidMazeGame";

// 8-bit starfield background
function PixelStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    const stars: { x: number; y: number; size: number; speed: number; brightness: number }[] = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        size: Math.random() > 0.8 ? 2 : 1,
        speed: 0.2 + Math.random() * 0.5,
        brightness: Math.random(),
      });
    }

    let frame = 0;
    let animId: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        const twinkle = Math.sin(frame * star.speed * 0.05 + star.brightness * 10);
        const alpha = 0.3 + twinkle * 0.3;
        const colors = ["#ffdd44", "#ffffff", "#88ddff", "#ffaa44"];
        ctx.fillStyle = colors[Math.floor(star.brightness * colors.length)];
        ctx.globalAlpha = Math.max(0.1, alpha);
        ctx.fillRect(
          star.x % canvas.width,
          star.y % canvas.height,
          star.size,
          star.size
        );
      });
      ctx.globalAlpha = 1;
    }

    function animate() {
      frame++;
      if (frame % 4 === 0) draw();
      animId = requestAnimationFrame(animate);
    }

    resize();
    animate();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-60"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export default function IdulFitriContent() {
  return (
    <div className="relative w-full min-h-screen bg-[#0a0a1a] overflow-hidden font-[family-name:var(--font-pixel)]">
      {/* Pixel star background */}
      <PixelStars />

      {/* Scanline overlay for CRT effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-20">
        {/* Hero */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Pixel crescent moon */}
          <motion.div
            className="mb-4 flex justify-center"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 8 8"
              style={{ imageRendering: "pixelated" }}
            >
              <rect x="3" y="0" width="1" height="1" fill="#ffdd44" />
              <rect x="4" y="0" width="1" height="1" fill="#ffdd44" />
              <rect x="2" y="1" width="1" height="1" fill="#ffdd44" />
              <rect x="3" y="1" width="1" height="1" fill="#ffee88" />
              <rect x="5" y="1" width="1" height="1" fill="#ddbb22" />
              <rect x="1" y="2" width="1" height="1" fill="#ffdd44" />
              <rect x="2" y="2" width="1" height="1" fill="#ffee88" />
              <rect x="1" y="3" width="1" height="1" fill="#ffdd44" />
              <rect x="2" y="3" width="1" height="1" fill="#ffee88" />
              <rect x="1" y="4" width="1" height="1" fill="#ffdd44" />
              <rect x="2" y="4" width="1" height="1" fill="#ffdd44" />
              <rect x="2" y="5" width="1" height="1" fill="#ffdd44" />
              <rect x="3" y="5" width="1" height="1" fill="#ddbb22" />
              <rect x="3" y="6" width="1" height="1" fill="#ffdd44" />
              <rect x="4" y="6" width="1" height="1" fill="#ffdd44" />
            </svg>
          </motion.div>

          <h1 className="text-sm md:text-lg text-amber-400 mb-2 tracking-wider">
            IDUL FITRI 1447H
          </h1>
          <p className="text-[7px] md:text-[9px] text-emerald-400 tracking-wide">
            - MAZE QUEST -
          </p>
        </motion.div>

        {/* Game Card - RPG window style */}
        <motion.div
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="bg-[#0a0a2e] border-4 border-amber-600 p-1">
            <div className="border-2 border-amber-800 p-3 md:p-4">
              <EidMazeGame />
            </div>
          </div>
        </motion.div>

        {/* Bottom credits */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-[6px] md:text-[7px] text-gray-600 tracking-wider">
            IRUFANO - 2026
          </p>
        </motion.div>
      </div>
    </div>
  );
}
