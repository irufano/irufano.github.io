"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// --- Types ---
interface Meteor {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  points: number;
  hit: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
}

// --- Constants ---
const GAME_DURATION = 60;
const METEOR_COLORS = [
  "#ff6b35",
  "#ff4444",
  "#ff8c42",
  "#e85d04",
  "#dc2f02",
  "#d00000",
];
const EXPLOSION_COLORS = [
  "#ffbe0b",
  "#fb5607",
  "#ff006e",
  "#ffdd00",
  "#ff9500",
];
const STAR_COUNT = 60;

export default function MeteorDefenseGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>(0);
  const meteorsRef = useRef<Meteor[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const comboTimerRef = useRef(0);
  const shakeRef = useRef(0);
  const missedRef = useRef(0);
  const difficultyRef = useRef(1);
  const spawnTimerRef = useRef(0);
  const timeRef = useRef(GAME_DURATION);
  const lastTimeRef = useRef(0);
  const flashRef = useRef(0);
  const canvasSizeRef = useRef({ w: 300, h: 250 });
  const gameStateRef = useRef<"idle" | "playing" | "ended">("idle");

  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">(
    "idle"
  );
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  // Keep ref in sync with state
  const setGameStateSync = useCallback(
    (state: "idle" | "playing" | "ended") => {
      gameStateRef.current = state;
      setGameState(state);
    },
    []
  );

  useEffect(() => {
    const saved = localStorage.getItem("meteorDefenseHighScore");
    if (saved) setHighScore(parseInt(saved, 10));

  }, []);

  // Initialize stars using normalized 0-1 coordinates
  const initStars = useCallback(() => {
    starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005,
    }));
  }, []);

  const spawnMeteor = useCallback(() => {
    const w = canvasSizeRef.current.w;
    const size = Math.random() * 12 + 8;
    const x = Math.random() * (w - 40) + 20;
    const speed =
      (Math.random() * 40 + 30 + difficultyRef.current * 8) *
      (1 / (size * 0.08));
    const points = size < 14 ? 30 : size < 18 ? 20 : 10;

    meteorsRef.current.push({
      x,
      y: -size,
      radius: size,
      speed,
      angle: (Math.random() - 0.5) * 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 3,
      color: METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)],
      points,
      hit: false,
    });
  }, []);

  const createExplosion = useCallback(
    (x: number, y: number, color: string, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = Math.random() * 120 + 40;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1,
          color:
            EXPLOSION_COLORS[
            Math.floor(Math.random() * EXPLOSION_COLORS.length)
            ],
          life: 1,
          maxLife: 1,
        });
      }
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * 20,
          vy: Math.sin(angle) * 20,
          radius: Math.random() * 5 + 3,
          color,
          life: 0.6,
          maxLife: 0.6,
        });
      }
    },
    []
  );

  const drawMeteor = useCallback(
    (ctx: CanvasRenderingContext2D, meteor: Meteor) => {
      ctx.save();
      ctx.translate(meteor.x, meteor.y);
      ctx.rotate(meteor.rotation);

      // Glow
      const glow = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        meteor.radius * 1.8
      );
      glow.addColorStop(0, meteor.color + "80");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, meteor.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Meteor body
      ctx.fillStyle = meteor.color;
      ctx.beginPath();
      const pts = 7;
      for (let i = 0; i < pts; i++) {
        const angle = (Math.PI * 2 * i) / pts;
        const r =
          meteor.radius * (0.7 + Math.sin(i * 2.5 + meteor.rotation) * 0.3);
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();

      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.arc(
        -meteor.radius * 0.2,
        -meteor.radius * 0.2,
        meteor.radius * 0.35,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Fire trail
      ctx.restore();
      ctx.save();
      ctx.translate(meteor.x, meteor.y);
      for (let i = 0; i < 3; i++) {
        const trailGrad = ctx.createRadialGradient(
          (Math.random() - 0.5) * 4,
          -meteor.radius - i * 6,
          0,
          0,
          -meteor.radius - i * 8,
          meteor.radius * 0.6
        );
        trailGrad.addColorStop(0, "#ffbe0b88");
        trailGrad.addColorStop(0.5, "#fb560744");
        trailGrad.addColorStop(1, "transparent");
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.arc(
          (Math.random() - 0.5) * 4,
          -meteor.radius - i * 6,
          meteor.radius * 0.6,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();
    },
    []
  );

  // Draw background (shared between game loop and static screens)
  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#0a0a2e");
      bgGrad.addColorStop(0.5, "#0d1137");
      bgGrad.addColorStop(1, "#1a0a2e");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars (normalized coordinates)
      starsRef.current.forEach((star) => {
        star.alpha += star.twinkleSpeed;
        const a = (Math.sin(star.alpha) + 1) / 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.8})`;
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground
      const groundH = Math.max(15, h * 0.08);
      ctx.fillStyle = "#1a1a3e";
      ctx.fillRect(0, h - groundH, w, groundH);

      // Buildings - proportionally distributed across width
      const buildingCount = Math.max(6, Math.floor(w / 20));
      const spacing = w / buildingCount;
      for (let i = 0; i < buildingCount; i++) {
        const bx = i * spacing + 2;
        const bw = spacing * 0.6;
        const bh =
          groundH + Math.sin(i * 3.7) * groundH * 0.8 + groundH * 0.5;
        ctx.fillStyle = "#12122a";
        ctx.fillRect(bx, h - bh, bw, bh);
        // Windows
        ctx.fillStyle = "#ffbe0b33";
        for (let wy = h - bh + 4; wy < h - groundH - 2; wy += 6) {
          for (let wx = bx + 2; wx < bx + bw - 2; wx += 4) {
            if (Math.random() > 0.4) {
              ctx.fillRect(wx, wy, 2, 3);
            }
          }
        }
      }

      return groundH;
    },
    []
  );

  // --- Game Loop ---
  const gameLoop = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvasSizeRef.current.w;
      const h = canvasSizeRef.current.h;

      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      // Update time
      timeRef.current -= dt;
      const newTimeLeft = Math.max(0, Math.ceil(timeRef.current));
      if (newTimeLeft !== timeLeft) setTimeLeft(newTimeLeft);

      if (timeRef.current <= 0) {
        const finalScore = scoreRef.current;
        setScore(finalScore);
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem("meteorDefenseHighScore", finalScore.toString());
        }
        setGameStateSync("ended");
        return;
      }

      // Difficulty ramp
      difficultyRef.current = 1 + (GAME_DURATION - timeRef.current) / 8;

      // Spawn meteors
      spawnTimerRef.current -= dt;
      if (spawnTimerRef.current <= 0) {
        spawnMeteor();
        spawnTimerRef.current =
          Math.max(0.3, 1.2 - difficultyRef.current * 0.1) +
          Math.random() * 0.5;
      }

      // Combo decay
      comboTimerRef.current -= dt;
      if (comboTimerRef.current <= 0 && comboRef.current > 0) {
        comboRef.current = 0;
        setCombo(0);
      }

      // Screen shake decay
      if (shakeRef.current > 0) shakeRef.current *= 0.9;
      if (shakeRef.current < 0.5) shakeRef.current = 0;

      // Flash decay
      if (flashRef.current > 0) flashRef.current -= dt * 4;

      // Apply shake
      ctx.save();
      if (shakeRef.current > 0) {
        ctx.translate(
          (Math.random() - 0.5) * shakeRef.current,
          (Math.random() - 0.5) * shakeRef.current
        );
      }

      // Background
      const groundH = drawBackground(ctx, w, h);

      // Update & draw meteors
      meteorsRef.current = meteorsRef.current.filter((m) => {
        if (m.hit) return false;

        m.y += m.speed * dt;
        m.x += Math.sin(m.angle) * m.speed * 0.3 * dt;
        m.rotation += m.rotationSpeed * dt;

        // Clamp x to canvas bounds
        if (m.x < 0) m.x = 0;
        if (m.x > w) m.x = w;

        // Hit ground
        if (m.y >= h - groundH - m.radius) {
          missedRef.current++;
          shakeRef.current = 8;
          flashRef.current = 1;
          createExplosion(m.x, h - groundH, "#ff4444", 15);
          return false;
        }

        drawMeteor(ctx, m);
        return true;
      });

      // Update & draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= dt * 2;
        if (p.life <= 0) return false;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 80 * dt;
        p.vx *= 0.99;

        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * alpha * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        return true;
      });

      // Red flash overlay
      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${flashRef.current * 0.15})`;
        ctx.fillRect(0, 0, w, h);
      }

      // HUD - scale font to canvas size
      const fontSize = Math.max(10, Math.min(13, w * 0.04));
      const smallFontSize = Math.max(8, Math.min(11, w * 0.032));

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 8, fontSize + 3);

      if (comboRef.current > 1) {
        ctx.fillStyle = "#ffbe0b";
        ctx.font = `bold ${smallFontSize}px monospace`;
        ctx.fillText(
          `x${comboRef.current} COMBO`,
          8,
          fontSize + smallFontSize + 6
        );
      }

      const tLeft = Math.max(0, Math.ceil(timeRef.current));
      ctx.textAlign = "right";
      ctx.fillStyle = tLeft <= 5 ? "#ff4444" : "#ffffff";
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillText(`${tLeft}s`, w - 8, fontSize + 3);

      if (missedRef.current > 0) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#ff6b6b";
        ctx.font = `${smallFontSize}px monospace`;
        ctx.fillText(`Missed: ${missedRef.current}`, w / 2, fontSize + 3);
      }

      ctx.restore();

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    },
    [
      spawnMeteor,
      createExplosion,
      drawMeteor,
      drawBackground,
      highScore,
      timeLeft,
      setGameStateSync,
    ]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameStateRef.current !== "playing") return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      let hitAny = false;
      meteorsRef.current.forEach((m) => {
        const dx = clickX - m.x;
        const dy = clickY - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < m.radius * 1.5 && !m.hit) {
          m.hit = true;
          hitAny = true;

          comboRef.current++;
          comboTimerRef.current = 2;
          setCombo(comboRef.current);

          const multiplier = Math.min(comboRef.current, 5);
          const points = m.points * multiplier;
          scoreRef.current += points;
          setScore(scoreRef.current);

          createExplosion(m.x, m.y, m.color, 12 + comboRef.current * 3);
          shakeRef.current = 3 + comboRef.current;
        }
      });

      if (!hitAny) {
        particlesRef.current.push({
          x: clickX,
          y: clickY,
          vx: 0,
          vy: 0,
          radius: 3,
          color: "#ffffff44",
          life: 0.3,
          maxLife: 0.3,
        });
      }
    },
    [createExplosion]
  );

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    comboRef.current = 0;
    comboTimerRef.current = 0;
    missedRef.current = 0;
    difficultyRef.current = 1;
    spawnTimerRef.current = 0.5;
    timeRef.current = GAME_DURATION;
    lastTimeRef.current = 0;
    shakeRef.current = 0;
    flashRef.current = 0;
    meteorsRef.current = [];
    particlesRef.current = [];
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_DURATION);
    setGameStateSync("playing");
    initStars();
  }, [initStars, setGameStateSync]);

  // Draw idle/ended screen
  const drawStaticScreen = useCallback(
    (currentScore?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      if (w === 0 || h === 0) return;

      drawBackground(ctx, w, h);

      ctx.textAlign = "center";

      // Scale fonts based on canvas size
      const titleSize = Math.max(14, Math.min(18, w * 0.06));
      const subSize = Math.max(9, Math.min(11, w * 0.035));
      const btnSize = Math.max(10, Math.min(12, w * 0.04));
      const scoreSize = Math.max(18, Math.min(24, w * 0.08));

      const state = gameStateRef.current;

      if (state === "idle") {
        ctx.fillStyle = "#ff6b35";
        ctx.font = `bold ${titleSize}px monospace`;
        ctx.fillText("METEOR", w / 2, h / 2 - titleSize * 1.5);
        ctx.fillStyle = "#ffbe0b";
        ctx.fillText("DEFENSE", w / 2, h / 2 - titleSize * 0.3);

        ctx.fillStyle = "#ffffff88";
        ctx.font = `${subSize}px monospace`;
        ctx.fillText("Click meteors to destroy!", w / 2, h / 2 + subSize * 1.5);

        ctx.fillStyle = "#ffbe0b";
        ctx.font = `bold ${btnSize}px monospace`;
        ctx.fillText("[ CLICK TO START ]", w / 2, h / 2 + subSize * 1.5 + btnSize * 2);

        if (highScore > 0) {
          ctx.fillStyle = "#ffffff55";
          ctx.font = `${subSize}px monospace`;
          ctx.fillText(
            `Best: ${highScore}`,
            w / 2,
            h / 2 + subSize * 1.5 + btnSize * 2 + subSize * 1.8
          );
        }
      } else if (state === "ended") {
        const displayScore = currentScore ?? score;

        ctx.fillStyle = "#ff4444";
        ctx.font = `bold ${titleSize}px monospace`;
        ctx.fillText("GAME OVER", w / 2, h / 2 - titleSize * 1.8);

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${scoreSize}px monospace`;
        ctx.fillText(`${displayScore}`, w / 2, h / 2);

        ctx.fillStyle = "#ffffff88";
        ctx.font = `${subSize}px monospace`;
        if (displayScore >= highScore && displayScore > 0) {
          ctx.fillStyle = "#ffbe0b";
          ctx.fillText("NEW HIGH SCORE!", w / 2, h / 2 + subSize * 2);
        } else {
          ctx.fillText(`Best: ${highScore}`, w / 2, h / 2 + subSize * 2);
        }

        ctx.fillStyle = "#ffbe0b";
        ctx.font = `bold ${btnSize}px monospace`;
        ctx.fillText("[ CLICK TO RETRY ]", w / 2, h / 2 + subSize * 2 + btnSize * 2.5);
      }
    },
    [drawBackground, highScore, score]
  );

  // Resize canvas — properly handle DPR and redraw
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      if (w === 0 || h === 0) return;

      canvas.width = w;
      canvas.height = h;
      canvasSizeRef.current = { w, h };

      // Redraw static screen if not playing
      if (gameStateRef.current !== "playing") {
        drawStaticScreen();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);

    // Initial size
    updateSize();
    initStars();
    drawStaticScreen();

    return () => resizeObserver.disconnect();
  }, [initStars, drawStaticScreen]);

  // Start / stop game loop
  useEffect(() => {
    if (gameState === "playing") {
      lastTimeRef.current = 0;
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      // Redraw static screen when state changes
      drawStaticScreen();
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, gameLoop, drawStaticScreen]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (
        gameStateRef.current === "idle" ||
        gameStateRef.current === "ended"
      ) {
        startGame();
      } else {
        handleClick(e);
      }
    },
    [startGame, handleClick]
  );

  // Touch support for mobile
  const handleTouch = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (
        gameStateRef.current === "idle" ||
        gameStateRef.current === "ended"
      ) {
        startGame();
        return;
      }
      if (gameStateRef.current !== "playing") return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      // Handle all active touches
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const clickX = (touch.clientX - rect.left) * scaleX;
        const clickY = (touch.clientY - rect.top) * scaleY;

        let hitAny = false;
        meteorsRef.current.forEach((m) => {
          const dx = clickX - m.x;
          const dy = clickY - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Bigger hit area on touch
          if (dist < m.radius * 2 && !m.hit) {
            m.hit = true;
            hitAny = true;

            comboRef.current++;
            comboTimerRef.current = 2;
            setCombo(comboRef.current);

            const multiplier = Math.min(comboRef.current, 5);
            const points = m.points * multiplier;
            scoreRef.current += points;
            setScore(scoreRef.current);

            createExplosion(m.x, m.y, m.color, 12 + comboRef.current * 3);
            shakeRef.current = 3 + comboRef.current;
          }
        });

        if (!hitAny) {
          particlesRef.current.push({
            x: clickX,
            y: clickY,
            vx: 0,
            vy: 0,
            radius: 3,
            color: "#ffffff44",
            life: 0.3,
            maxLife: 0.3,
          });
        }
      }
    },
    [startGame, createExplosion]
  );

  return (
    <div
      ref={containerRef}
      className="rounded-lg shadow-lg overflow-hidden w-full cursor-crosshair h-[30rem]"
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onTouchStart={handleTouch}
        className="block w-full h-full"
      />
    </div>
  );
}
