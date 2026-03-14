"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Bug {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const BUG_EMOJIS = ["🐛", "🪲", "🐞", "🦗"];
const GAME_DURATION = 15;

export default function CatchTheBugGame() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">(
    "idle"
  );
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const bugIdRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("miniGameHighScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const spawnBug = useCallback((): Bug => {
    bugIdRef.current += 1;
    return {
      id: bugIdRef.current,
      x: Math.random() * 80 + 5,
      y: Math.random() * 70 + 5,
      emoji: BUG_EMOJIS[Math.floor(Math.random() * BUG_EMOJIS.length)],
    };
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameState("playing");
    setBugs([spawnBug(), spawnBug(), spawnBug()]);
  }, [spawnBug]);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft <= 0) {
      setGameState("ended");
      setScore((s) => {
        if (s > highScore) {
          setHighScore(s);
          localStorage.setItem("miniGameHighScore", s.toString());
        }
        return s;
      });
      setBugs([]);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [gameState, timeLeft, highScore]);

  // Spawn new bugs periodically
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      setBugs((prev) => {
        if (prev.length < 5) return [...prev, spawnBug()];
        return prev;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [gameState, spawnBug]);

  const catchBug = (bugId: number) => {
    setBugs((prev) => prev.filter((b) => b.id !== bugId));
    setScore((s) => s + 1);
    // Immediately spawn a replacement
    setBugs((prev) => [...prev, spawnBug()]);
  };

  return (
    <div className="bg-emerald-200/40 dark:bg-emerald-700/30 backdrop-blur-md rounded-lg shadow-lg p-4 w-full h-[298px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          🎮 Catch the Bug!
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Best: {highScore}
        </span>
      </div>

      {gameState === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
            Click the bugs before time runs out!
          </p>
          <button
            onClick={startGame}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium text-sm transition-colors cursor-pointer"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <>
          <div className="flex items-center justify-between mb-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Score: {score}
            </span>
            <span
              className={`font-mono font-bold ${timeLeft <= 5 ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}
            >
              {timeLeft}s
            </span>
          </div>
          <div className="relative flex-1 bg-white/20 dark:bg-black/20 rounded-lg min-h-[160px] overflow-hidden select-none">
            {bugs.map((bug) => (
              <button
                key={bug.id}
                onClick={() => catchBug(bug.id)}
                className="absolute text-2xl transition-all duration-200 hover:scale-125 animate-bounce cursor-pointer"
                style={{
                  left: `${bug.x}%`,
                  top: `${bug.y}%`,
                  animationDelay: `${bug.id * 0.2}s`,
                  animationDuration: "1.5s",
                }}
              >
                {bug.emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {gameState === "ended" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {score}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {score > highScore
              ? "🎉 New high score!"
              : score >= 10
                ? "Nice catch! 🐛"
                : "Keep practicing!"}
          </p>
          <button
            onClick={startGame}
            className="mt-1 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium text-sm transition-colors cursor-pointer"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
