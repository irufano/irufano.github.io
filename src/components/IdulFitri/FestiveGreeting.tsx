"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

type CollectibleType = "moon" | "star" | "lantern" | "mosque" | "ketupat" | "clothes";

const ACHIEVEMENT_DATA: Record<
  CollectibleType,
  { label: string; icon: string; color: string }
> = {
  moon: { label: "Laylatul Qadar", icon: "C", color: "#ffdd44" },
  star: { label: "Pahala Taraweh", icon: "*", color: "#ffee55" },
  lantern: { label: "THR", icon: "!", color: "#ff6644" },
  mosque: { label: "Pahala Puasa", icon: "+", color: "#44cc66" },
  ketupat: { label: "Ketupat", icon: "#", color: "#88cc44" },
  clothes: { label: "Baju Lebaran", icon: "T", color: "#ee66aa" },
};

const ALL_TYPES: CollectibleType[] = [
  "moon",
  "star",
  "lantern",
  "mosque",
  "ketupat",
  "clothes",
];

interface FestiveGreetingProps {
  moves: number;
  seconds: number;
  collectedTypes: CollectibleType[];
  totalCollectibles: number;
  onPlayAgain: () => void;
}

// Typewriter effect for RPG dialog
function TypewriterText({
  text,
  delay = 0,
  speed = 40,
  className = "",
  onComplete,
}: {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [started, displayed, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {started && displayed.length < text.length && (
        <span className="animate-pulse">_</span>
      )}
    </span>
  );
}

export default function FestiveGreeting({
  moves,
  seconds,
  collectedTypes,
  totalCollectibles,
  onPlayAgain,
}: FestiveGreetingProps) {
  const [phase, setPhase] = useState(0);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;

  const collectedSet = new Set(collectedTypes);
  const allCollected = collectedTypes.length === totalCollectibles;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: 0.2,
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
        className="mx-3 w-full max-w-sm font-[family-name:var(--font-pixel)] my-2"
      >
        {/* RPG Dialog Box */}
        <div className="relative bg-[#0a0a2e] border-4 border-amber-500 p-1">
          <div className="border-2 border-amber-700 p-3 md:p-4">
            {/* Sparkle decorations */}
            <motion.div
              className="flex justify-center gap-3 mb-3 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {["*", ".", "*", ".", "*"].map((ch, i) => (
                <motion.span
                  key={i}
                  className="text-amber-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    delay: i * 0.2,
                  }}
                >
                  {ch}
                </motion.span>
              ))}
            </motion.div>

            {/* Quest Complete */}
            <motion.div
              className="text-center mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-[10px] md:text-xs text-emerald-400 tracking-wider">
                QUEST COMPLETE!
              </span>
            </motion.div>

            {/* Main greeting - typewriter */}
            <div className="text-center mb-2 min-h-[2.5em]">
              <TypewriterText
                text="Selamat Hari Raya Idul Fitri 1447H"
                delay={800}
                speed={35}
                className="text-[8px] md:text-[10px] text-amber-300 leading-relaxed"
                onComplete={() => setPhase(1)}
              />
            </div>

            {/* Sub greeting */}
            {phase >= 1 && (
              <div className="text-center mb-3 min-h-[1.5em]">
                <TypewriterText
                  text="Mohon Maaf Lahir dan Batin"
                  delay={200}
                  speed={35}
                  className="text-[7px] md:text-[9px] text-emerald-300 leading-relaxed"
                  onComplete={() => setPhase(2)}
                />
              </div>
            )}

            {/* Divider */}
            {phase >= 2 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
                className="h-[2px] bg-amber-700 mx-4 mb-2"
              />
            )}

            {/* Personal message */}
            {phase >= 2 && (
              <div className="text-center mb-3 min-h-[2.5em]">
                <TypewriterText
                  text="Irufano dan keluarga mengucapkan Selamat Hari Raya Idul Fitri 1447H, Mohon Maaf Lahir dan Batin"
                  delay={300}
                  speed={25}
                  className="text-[6px] md:text-[7px] text-gray-300 leading-loose"
                  onComplete={() => setPhase(3)}
                />
              </div>
            )}

            {/* Achievements & Stats */}
            {phase >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Achievements box */}
                <div className="bg-black/60 border border-amber-800 p-2 mb-2">
                  <div className="text-[7px] md:text-[8px] text-amber-400 mb-1.5 text-center tracking-wider">
                    {allCollected ? "ALL ACHIEVEMENTS!" : "ACHIEVEMENTS"}
                  </div>

                  <div className="space-y-1">
                    {ALL_TYPES.map((type, i) => {
                      const data = ACHIEVEMENT_DATA[type];
                      const collected = collectedSet.has(type);
                      return (
                        <motion.div
                          key={type}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.12 }}
                          className="flex items-center gap-2"
                        >
                          {/* Icon */}
                          <span
                            className="w-4 text-center text-[8px] md:text-[9px]"
                            style={{
                              color: collected ? data.color : "#444444",
                            }}
                          >
                            {data.icon}
                          </span>
                          {/* Label */}
                          <span
                            className="text-[6px] md:text-[7px] flex-1"
                            style={{
                              color: collected ? data.color : "#555555",
                            }}
                          >
                            {data.label}
                          </span>
                          {/* Status */}
                          <span
                            className="text-[6px] md:text-[7px]"
                            style={{
                              color: collected ? "#44ff88" : "#553333",
                            }}
                          >
                            {collected ? "GET!" : "---"}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {allCollected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.5, 1] }}
                      transition={{ delay: 0.8, duration: 1 }}
                      className="text-center mt-1.5 text-[6px] md:text-[7px] text-amber-300"
                    >
                      &#10022; PERFECT SCORE! &#10022;
                    </motion.div>
                  )}
                </div>

                {/* Stats box */}
                <div className="bg-black/50 border border-gray-700 p-2 mb-3">
                  <div className="flex justify-between text-[6px] md:text-[7px] text-gray-400">
                    <span>TIME: {timeStr}</span>
                    <span>STEP: {moves}</span>
                    <span>
                      ITEM: {collectedTypes.length}/{totalCollectibles}
                    </span>
                  </div>
                </div>

                {/* Play again */}
                <div className="text-center">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={onPlayAgain}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-amber-300 text-[8px] md:text-[10px] border-2 border-emerald-600 transition-colors shadow-[0_3px_0_#064e3b] hover:shadow-[0_1px_0_#064e3b] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px]"
                  >
                    &#9654; PLAY AGAIN
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Blinking cursor at bottom */}
            {phase < 3 && (
              <div className="text-right mt-1">
                <motion.span
                  className="text-amber-500 text-[10px]"
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  &#9660;
                </motion.span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
