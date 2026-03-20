"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FestiveGreeting from "./FestiveGreeting";

// --- Types ---
interface Cell {
  row: number;
  col: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

interface Collectible {
  row: number;
  col: number;
  type: CollectibleType;
  collected: boolean;
}

type CollectibleType = "moon" | "star" | "lantern" | "mosque" | "ketupat" | "clothes";
type Direction = "down" | "up" | "left" | "right";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Notification {
  text: string;
  color: string;
  timestamp: number;
}

// --- Collectible labels ---
const COLLECTIBLE_LABELS: Record<CollectibleType, string> = {
  moon: "Get Laylatul Qadar!",
  star: "Get Pahala Taraweh!",
  lantern: "Get THR!",
  mosque: "Get Pahala Puasa!",
  ketupat: "Get Ketupat!",
  clothes: "Get Baju Lebaran!",
};

const COLLECTIBLE_COLORS: Record<CollectibleType, string> = {
  moon: "#ffdd44",
  star: "#ffee55",
  lantern: "#ff6644",
  mosque: "#44cc66",
  ketupat: "#88cc44",
  clothes: "#ee66aa",
};

// --- Maze generation (recursive backtracking) ---
function generateMaze(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      row: r,
      col: c,
      walls: { top: true, right: true, bottom: true, left: true },
      visited: false,
    }))
  );

  const stack: Cell[] = [];
  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, grid, rows, cols);
    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(current, next);
      next.visited = true;
      stack.push(next);
    }
  }
  return grid;
}

function getUnvisitedNeighbors(
  cell: Cell,
  grid: Cell[][],
  rows: number,
  cols: number
): Cell[] {
  const { row, col } = cell;
  const n: Cell[] = [];
  if (row > 0 && !grid[row - 1][col].visited) n.push(grid[row - 1][col]);
  if (row < rows - 1 && !grid[row + 1][col].visited)
    n.push(grid[row + 1][col]);
  if (col > 0 && !grid[row][col - 1].visited) n.push(grid[row][col - 1]);
  if (col < cols - 1 && !grid[row][col + 1].visited)
    n.push(grid[row][col + 1]);
  return n;
}

function removeWall(a: Cell, b: Cell) {
  const dr = b.row - a.row;
  const dc = b.col - a.col;
  if (dr === -1) {
    a.walls.top = false;
    b.walls.bottom = false;
  } else if (dr === 1) {
    a.walls.bottom = false;
    b.walls.top = false;
  } else if (dc === -1) {
    a.walls.left = false;
    b.walls.right = false;
  } else if (dc === 1) {
    a.walls.right = false;
    b.walls.left = false;
  }
}

function placeCollectibles(rows: number, cols: number): Collectible[] {
  const types: CollectibleType[] = [
    "moon",
    "star",
    "lantern",
    "mosque",
    "ketupat",
    "clothes",
  ];
  const collectibles: Collectible[] = [];
  const used = new Set<string>();
  used.add("0,0");
  used.add(`${rows - 1},${cols - 1}`);

  let attempts = 0;
  while (collectibles.length < types.length && attempts < 200) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const key = `${r},${c}`;
    if (!used.has(key)) {
      used.add(key);
      collectibles.push({
        row: r,
        col: c,
        type: types[collectibles.length],
        collected: false,
      });
    }
    attempts++;
  }
  return collectibles;
}

// --- 8-bit Color palette ---
const COLORS = {
  wallDark: "#1a3a2a",
  wallMid: "#2d5a3f",
  wallLight: "#3d7a55",
  floor: "#c4a882",
  floorAlt: "#b89b73",
  floorDark: "#a88d65",
  playerSkin: "#ffcc88",
  playerHair: "#4a2800",
  playerShirt: "#22aa44",
  playerShirtDark: "#118833",
  playerPants: "#3355aa",
  playerPantsDark: "#224488",
  playerEye: "#000000",
  giftBox: "#ee3333",
  giftBoxDark: "#bb2222",
  giftRibbon: "#ffdd44",
  giftRibbonDark: "#ddbb22",
  moonYellow: "#ffdd44",
  moonDark: "#ddbb22",
  starYellow: "#ffee55",
  starOrange: "#ffaa22",
  lanternRed: "#ff4444",
  lanternOrange: "#ff8822",
  lanternYellow: "#ffdd44",
  mosqueGreen: "#22aa44",
  mosqueWhite: "#ffffff",
  mosqueDome: "#44cc66",
  ketupatGreen: "#66aa22",
  ketupatLight: "#88cc44",
  ketupatDark: "#448811",
  ketupatLeaf: "#336600",
  clothesPink: "#ee66aa",
  clothesLight: "#ff88cc",
  clothesDark: "#cc4488",
  clothesButton: "#ffdd44",
};

// --- Pixel sprite drawing ---
function drawPixelChar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  direction: Direction,
  walkFrame: number
) {
  const p = Math.floor(cellSize / 10);
  const ox = x + Math.floor((cellSize - p * 8) / 2);
  const oy = y + Math.floor((cellSize - p * 10) / 2);

  const px = (col: number, row: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + col * p, oy + row * p, p, p);
  };

  const C = COLORS;
  // Walk bob only changes on actual movement (walkFrame)
  const isStep = walkFrame % 2 === 1;

  // Hair (row 0-1)
  px(2, 0, C.playerHair);
  px(3, 0, C.playerHair);
  px(4, 0, C.playerHair);
  px(5, 0, C.playerHair);
  px(1, 1, C.playerHair);
  px(2, 1, C.playerHair);
  px(3, 1, C.playerHair);
  px(4, 1, C.playerHair);
  px(5, 1, C.playerHair);
  px(6, 1, C.playerHair);

  // Face (row 2-3)
  px(1, 2, C.playerSkin);
  px(2, 2, C.playerSkin);
  px(3, 2, C.playerSkin);
  px(4, 2, C.playerSkin);
  px(5, 2, C.playerSkin);
  px(6, 2, C.playerSkin);

  // Eyes based on direction
  if (direction === "down") {
    px(1, 3, C.playerSkin);
    px(2, 3, C.playerSkin);
    px(3, 3, C.playerEye);
    px(4, 3, C.playerSkin);
    px(5, 3, C.playerEye);
    px(6, 3, C.playerSkin);
  } else if (direction === "up") {
    // Facing away - no eyes visible, show back of hair
    px(1, 2, C.playerHair);
    px(2, 2, C.playerHair);
    px(3, 2, C.playerHair);
    px(4, 2, C.playerHair);
    px(5, 2, C.playerHair);
    px(6, 2, C.playerHair);
    px(1, 3, C.playerSkin);
    px(2, 3, C.playerSkin);
    px(3, 3, C.playerSkin);
    px(4, 3, C.playerSkin);
    px(5, 3, C.playerSkin);
    px(6, 3, C.playerSkin);
  } else if (direction === "left") {
    px(1, 3, C.playerSkin);
    px(2, 3, C.playerEye);
    px(3, 3, C.playerSkin);
    px(4, 3, C.playerEye);
    px(5, 3, C.playerSkin);
    px(6, 3, C.playerSkin);
  } else {
    px(1, 3, C.playerSkin);
    px(2, 3, C.playerSkin);
    px(3, 3, C.playerEye);
    px(4, 3, C.playerSkin);
    px(5, 3, C.playerEye);
    px(6, 3, C.playerSkin);
  }

  // Shirt (row 4-6)
  px(1, 4, C.playerShirtDark);
  px(2, 4, C.playerShirt);
  px(3, 4, C.playerShirt);
  px(4, 4, C.playerShirt);
  px(5, 4, C.playerShirt);
  px(6, 4, C.playerShirtDark);

  px(0, 5, C.playerSkin);
  px(1, 5, C.playerShirt);
  px(2, 5, C.playerShirt);
  px(3, 5, C.playerShirt);
  px(4, 5, C.playerShirt);
  px(5, 5, C.playerShirt);
  px(6, 5, C.playerShirt);
  px(7, 5, C.playerSkin);

  px(1, 6, C.playerShirt);
  px(2, 6, C.playerShirt);
  px(3, 6, C.playerShirt);
  px(4, 6, C.playerShirt);
  px(5, 6, C.playerShirt);
  px(6, 6, C.playerShirt);

  // Pants (row 7)
  px(2, 7, C.playerPants);
  px(3, 7, C.playerPants);
  px(4, 7, C.playerPants);
  px(5, 7, C.playerPants);

  // Legs + shoes with walk animation
  if (!isStep) {
    px(2, 8, C.playerPantsDark);
    px(3, 8, C.playerPantsDark);
    px(4, 8, C.playerPantsDark);
    px(5, 8, C.playerPantsDark);
    px(1, 9, "#553300");
    px(2, 9, "#553300");
    px(5, 9, "#553300");
    px(6, 9, "#553300");
  } else {
    px(1, 8, C.playerPantsDark);
    px(2, 8, C.playerPantsDark);
    px(5, 8, C.playerPantsDark);
    px(6, 8, C.playerPantsDark);
    px(0, 9, "#553300");
    px(1, 9, "#553300");
    px(6, 9, "#553300");
    px(7, 9, "#553300");
  }
}

function drawGift(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  animFrame: number
) {
  const p = Math.floor(cellSize / 10);
  const ox = x + Math.floor((cellSize - p * 8) / 2);
  const oy = y + Math.floor((cellSize - p * 8) / 2);
  const C = COLORS;
  const bounce = Math.sin(animFrame * 0.08) * p * 0.5;

  const px = (col: number, row: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + col * p, oy + row * p + bounce, p, p);
  };

  px(3, 0, C.giftRibbon);
  px(4, 0, C.giftRibbon);
  px(2, 1, C.giftRibbon);
  px(3, 1, C.giftRibbonDark);
  px(4, 1, C.giftRibbonDark);
  px(5, 1, C.giftRibbon);
  for (let r = 2; r <= 6; r++) {
    for (let c = 1; c <= 6; c++) {
      if (c === 3 || c === 4) {
        px(c, r, C.giftRibbon);
      } else {
        px(c, r, r === 2 ? C.giftBox : C.giftBoxDark);
      }
    }
  }
  for (let c = 1; c <= 6; c++) {
    px(c, 7, "#881111");
  }

  // Sparkle
  if (animFrame % 30 < 15) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ox + 7 * p, oy - p + bounce, p, p);
  }
}

function drawCollectible(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  type: CollectibleType,
  animFrame: number
) {
  const p = Math.floor(cellSize / 10);
  const ox = x + Math.floor((cellSize - p * 6) / 2);
  const oy = y + Math.floor((cellSize - p * 6) / 2);
  const bob = Math.sin(animFrame * 0.06) * p * 0.5;
  const C = COLORS;

  const px = (col: number, row: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + col * p, oy + row * p + bob, p, p);
  };

  switch (type) {
    case "moon":
      px(2, 0, C.moonYellow);
      px(3, 0, C.moonYellow);
      px(1, 1, C.moonYellow);
      px(1, 2, C.moonYellow);
      px(1, 3, C.moonYellow);
      px(2, 4, C.moonYellow);
      px(3, 4, C.moonYellow);
      px(3, 1, C.moonDark);
      px(3, 2, C.moonDark);
      px(3, 3, C.moonDark);
      break;
    case "star":
      px(2, 0, C.starYellow);
      px(3, 0, C.starYellow);
      px(1, 1, C.starOrange);
      px(2, 1, C.starYellow);
      px(3, 1, C.starYellow);
      px(4, 1, C.starOrange);
      px(0, 2, C.starYellow);
      px(1, 2, C.starYellow);
      px(2, 2, C.starYellow);
      px(3, 2, C.starYellow);
      px(4, 2, C.starYellow);
      px(5, 2, C.starYellow);
      px(1, 3, C.starOrange);
      px(2, 3, C.starYellow);
      px(3, 3, C.starYellow);
      px(4, 3, C.starOrange);
      px(1, 4, C.starYellow);
      px(4, 4, C.starYellow);
      break;
    case "lantern":
      px(2, 0, C.lanternYellow);
      px(3, 0, C.lanternYellow);
      px(1, 1, C.lanternRed);
      px(2, 1, C.lanternOrange);
      px(3, 1, C.lanternOrange);
      px(4, 1, C.lanternRed);
      px(1, 2, C.lanternRed);
      px(2, 2, C.lanternYellow);
      px(3, 2, C.lanternYellow);
      px(4, 2, C.lanternRed);
      px(1, 3, C.lanternRed);
      px(2, 3, C.lanternOrange);
      px(3, 3, C.lanternOrange);
      px(4, 3, C.lanternRed);
      px(2, 4, C.lanternRed);
      px(3, 4, C.lanternRed);
      break;
    case "mosque":
      px(2, 0, C.mosqueDome);
      px(3, 0, C.mosqueDome);
      px(1, 1, C.mosqueDome);
      px(2, 1, C.mosqueGreen);
      px(3, 1, C.mosqueGreen);
      px(4, 1, C.mosqueDome);
      px(0, 2, C.mosqueWhite);
      px(1, 2, C.mosqueWhite);
      px(2, 2, C.mosqueWhite);
      px(3, 2, C.mosqueWhite);
      px(4, 2, C.mosqueWhite);
      px(5, 2, C.mosqueWhite);
      px(0, 3, C.mosqueWhite);
      px(1, 3, C.mosqueWhite);
      px(2, 3, C.mosqueGreen);
      px(3, 3, C.mosqueGreen);
      px(4, 3, C.mosqueWhite);
      px(5, 3, C.mosqueWhite);
      px(0, 4, C.mosqueWhite);
      px(1, 4, C.mosqueWhite);
      px(2, 4, C.mosqueWhite);
      px(3, 4, C.mosqueWhite);
      px(4, 4, C.mosqueWhite);
      px(5, 4, C.mosqueWhite);
      break;
    case "ketupat":
      // Diamond-shaped ketupat woven pattern
      px(2, 0, C.ketupatLeaf);
      px(3, 0, C.ketupatLeaf);
      px(1, 1, C.ketupatGreen);
      px(2, 1, C.ketupatLight);
      px(3, 1, C.ketupatLight);
      px(4, 1, C.ketupatGreen);
      px(0, 2, C.ketupatGreen);
      px(1, 2, C.ketupatLight);
      px(2, 2, C.ketupatGreen);
      px(3, 2, C.ketupatGreen);
      px(4, 2, C.ketupatLight);
      px(5, 2, C.ketupatGreen);
      px(1, 3, C.ketupatGreen);
      px(2, 3, C.ketupatLight);
      px(3, 3, C.ketupatLight);
      px(4, 3, C.ketupatGreen);
      px(2, 4, C.ketupatDark);
      px(3, 4, C.ketupatDark);
      break;
    case "clothes":
      // Baju lebaran / shirt shape
      px(1, 0, C.clothesPink);
      px(2, 0, C.clothesLight);
      px(3, 0, C.clothesLight);
      px(4, 0, C.clothesPink);
      px(0, 1, C.clothesDark);
      px(1, 1, C.clothesPink);
      px(2, 1, C.clothesLight);
      px(3, 1, C.clothesLight);
      px(4, 1, C.clothesPink);
      px(5, 1, C.clothesDark);
      px(0, 2, C.clothesDark);
      px(1, 2, C.clothesPink);
      px(2, 2, C.clothesButton);
      px(3, 2, C.clothesPink);
      px(4, 2, C.clothesPink);
      px(5, 2, C.clothesDark);
      px(1, 3, C.clothesPink);
      px(2, 3, C.clothesButton);
      px(3, 3, C.clothesPink);
      px(4, 3, C.clothesPink);
      px(1, 4, C.clothesDark);
      px(2, 4, C.clothesDark);
      px(3, 4, C.clothesDark);
      px(4, 4, C.clothesDark);
      break;
  }
}

function drawWallTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isHorizontal: boolean
) {
  const C = COLORS;
  ctx.fillStyle = C.wallMid;
  ctx.fillRect(x, y, w, h);

  const brickW = isHorizontal ? Math.max(4, Math.floor(w / 3)) : w;
  const brickH = isHorizontal ? h : Math.max(4, Math.floor(h / 3));

  ctx.fillStyle = C.wallLight;
  if (isHorizontal) {
    for (let bx = x; bx < x + w; bx += brickW + 1) {
      ctx.fillRect(
        bx,
        y,
        Math.min(brickW - 1, x + w - bx),
        Math.max(1, h - 1)
      );
    }
    ctx.fillStyle = C.wallDark;
    ctx.fillRect(x, y + h - 1, w, 1);
  } else {
    for (let by = y; by < y + h; by += brickH + 1) {
      ctx.fillRect(
        x,
        by,
        Math.max(1, w - 1),
        Math.min(brickH - 1, y + h - by)
      );
    }
    ctx.fillStyle = C.wallDark;
    ctx.fillRect(x + w - 1, y, 1, h);
  }
}

// Draw sparkle particles
function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
) {
  particles.forEach((pt) => {
    ctx.globalAlpha = Math.max(0, pt.life);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  });
  ctx.globalAlpha = 1;
}

// --- Constants ---
const MAZE_ROWS = 9;
const MAZE_COLS = 9;
const WALL_THICKNESS_RATIO = 0.15;

export default function EidMazeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef(0);
  const animRef = useRef<number>(0);

  // Use refs for canvas-rendering state to avoid re-creating drawMaze
  const mazeRef = useRef<Cell[][] | null>(null);
  const playerPosRef = useRef({ row: 0, col: 0 });
  const directionRef = useRef<Direction>("down");
  const collectiblesRef = useRef<Collectible[]>([]);
  const walkFrameRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const gameStateRef = useRef<"idle" | "playing" | "won">("idle");

  const [gameState, setGameState] = useState<"idle" | "playing" | "won">(
    "idle"
  );
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [collectedCount, setCollectedCount] = useState(0);
  const [collectedTypes, setCollectedTypes] = useState<CollectibleType[]>([]);
  const [totalCollectibles, setTotalCollectibles] = useState(5);
  const [notification, setNotification] = useState<Notification | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const giftPos = useMemo(
    () => ({ row: MAZE_ROWS - 1, col: MAZE_COLS - 1 }),
    []
  );

  // Spawn sparkle particles at a cell position
  const spawnParticles = useCallback(
    (row: number, col: number, color: string) => {
      const container = containerRef.current;
      if (!container) return;
      const size = container.clientWidth;
      const wallThickness = Math.max(
        3,
        Math.floor((size / MAZE_COLS) * WALL_THICKNESS_RATIO)
      );
      const cellSize = (size - wallThickness) / MAZE_COLS;
      const cx = col * cellSize + wallThickness / 2 + cellSize / 2;
      const cy = row * cellSize + wallThickness / 2 + cellSize / 2;

      const newParticles: Particle[] = [];
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = 1 + Math.random() * 2;
        newParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color:
            i % 3 === 0
              ? "#ffffff"
              : i % 3 === 1
                ? color
                : "#ffee88",
          size: Math.random() > 0.5 ? 3 : 2,
        });
      }
      particlesRef.current = [...particlesRef.current, ...newParticles];
    },
    []
  );

  // --- Canvas rendering (no state deps - reads from refs) ---
  const drawMaze = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const maze = mazeRef.current;
    if (!canvas || !container || !maze) return;

    const size = container.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    const wallThickness = Math.max(
      3,
      Math.floor((size / MAZE_COLS) * WALL_THICKNESS_RATIO)
    );
    const cellSize = (size - wallThickness) / MAZE_COLS;
    const frame = animFrameRef.current;

    // Background
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, size, size);

    // Draw floor tiles
    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        const cx = c * cellSize + wallThickness / 2;
        const cy = r * cellSize + wallThickness / 2;

        ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
        ctx.fillRect(cx, cy, cellSize, cellSize);

        if ((r * 3 + c * 7) % 5 === 0) {
          ctx.fillStyle = COLORS.floorDark;
          const dotSize = Math.max(1, Math.floor(cellSize / 12));
          ctx.fillRect(
            cx + cellSize / 2 - dotSize / 2,
            cy + cellSize / 2 - dotSize / 2,
            dotSize,
            dotSize
          );
        }
      }
    }

    // Draw walls
    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        const cell = maze[r][c];
        const cx = c * cellSize + wallThickness / 2;
        const cy = r * cellSize + wallThickness / 2;

        if (cell.walls.top) {
          drawWallTile(
            ctx,
            cx - wallThickness / 2,
            cy - wallThickness / 2,
            cellSize + wallThickness,
            wallThickness,
            true
          );
        }
        if (cell.walls.bottom) {
          drawWallTile(
            ctx,
            cx - wallThickness / 2,
            cy + cellSize - wallThickness / 2,
            cellSize + wallThickness,
            wallThickness,
            true
          );
        }
        if (cell.walls.left) {
          drawWallTile(
            ctx,
            cx - wallThickness / 2,
            cy - wallThickness / 2,
            wallThickness,
            cellSize + wallThickness,
            false
          );
        }
        if (cell.walls.right) {
          drawWallTile(
            ctx,
            cx + cellSize - wallThickness / 2,
            cy - wallThickness / 2,
            wallThickness,
            cellSize + wallThickness,
            false
          );
        }
      }
    }

    // Outer border
    ctx.fillStyle = COLORS.wallDark;
    ctx.fillRect(0, 0, size, wallThickness / 2);
    ctx.fillRect(0, size - wallThickness / 2, size, wallThickness / 2);
    ctx.fillRect(0, 0, wallThickness / 2, size);
    ctx.fillRect(size - wallThickness / 2, 0, wallThickness / 2, size);

    // Draw collectibles
    const collectibles = collectiblesRef.current;
    collectibles.forEach((col) => {
      if (!col.collected) {
        const cx = col.col * cellSize + wallThickness / 2;
        const cy = col.row * cellSize + wallThickness / 2;
        drawCollectible(ctx, cx, cy, cellSize, col.type, frame);
      }
    });

    // Draw gift
    const gx = giftPos.col * cellSize + wallThickness / 2;
    const gy = giftPos.row * cellSize + wallThickness / 2;
    drawGift(ctx, gx, gy, cellSize, frame);

    // Draw player
    const pos = playerPosRef.current;
    const ppx = pos.col * cellSize + wallThickness / 2;
    const ppy = pos.row * cellSize + wallThickness / 2;
    drawPixelChar(
      ctx,
      ppx,
      ppy,
      cellSize,
      directionRef.current,
      walkFrameRef.current
    );

    // Update & draw particles
    particlesRef.current = particlesRef.current
      .map((pt) => ({
        ...pt,
        x: pt.x + pt.vx,
        y: pt.y + pt.vy,
        vy: pt.vy + 0.05, // gravity
        life: pt.life - 0.02,
      }))
      .filter((pt) => pt.life > 0);
    drawParticles(ctx, particlesRef.current);
  }, [giftPos]);

  // Animation loop - stable, doesn't depend on game state changes
  useEffect(() => {
    if (gameState !== "playing") return;
    let running = true;
    const animate = () => {
      if (!running) return;
      animFrameRef.current++;
      drawMaze();
      animRef.current = requestAnimationFrame(animate);
    };
    drawMaze();
    animRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [gameState, drawMaze]);

  // Redraw on resize
  useEffect(() => {
    if (gameState !== "playing") return;
    const handleResize = () => drawMaze();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gameState, drawMaze]);

  const startGame = useCallback(() => {
    const newMaze = generateMaze(MAZE_ROWS, MAZE_COLS);
    const newCollectibles = placeCollectibles(MAZE_ROWS, MAZE_COLS);
    mazeRef.current = newMaze;
    collectiblesRef.current = newCollectibles;
    playerPosRef.current = { row: 0, col: 0 };
    directionRef.current = "down";
    walkFrameRef.current = 0;
    particlesRef.current = [];
    animFrameRef.current = 0;
    gameStateRef.current = "playing";
    setMoves(0);
    setSeconds(0);
    setCollectedCount(0);
    setCollectedTypes([]);
    setTotalCollectibles(newCollectibles.length);
    setNotification(null);
    setGameState("playing");
  }, []);

  // Timer
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Auto-dismiss notification after 1.5s
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 1500);
    return () => clearTimeout(timer);
  }, [notification]);

  const movePlayer = useCallback(
    (dr: number, dc: number) => {
      if (gameStateRef.current !== "playing" || !mazeRef.current) return;

      // Set direction
      if (dr === -1) directionRef.current = "up";
      else if (dr === 1) directionRef.current = "down";
      else if (dc === -1) directionRef.current = "left";
      else if (dc === 1) directionRef.current = "right";

      const pos = playerPosRef.current;
      const cell = mazeRef.current[pos.row][pos.col];

      if (dr === -1 && cell.walls.top) return;
      if (dr === 1 && cell.walls.bottom) return;
      if (dc === -1 && cell.walls.left) return;
      if (dc === 1 && cell.walls.right) return;

      const newRow = pos.row + dr;
      const newCol = pos.col + dc;
      if (
        newRow < 0 ||
        newRow >= MAZE_ROWS ||
        newCol < 0 ||
        newCol >= MAZE_COLS
      )
        return;

      // Update refs
      walkFrameRef.current++;
      playerPosRef.current = { row: newRow, col: newCol };
      setMoves((m) => m + 1);

      // Check collectibles
      const collectibles = collectiblesRef.current;
      const found = collectibles.find(
        (c) => c.row === newRow && c.col === newCol && !c.collected
      );
      if (found) {
        found.collected = true;
        collectiblesRef.current = [...collectibles];
        setCollectedCount((c) => c + 1);
        setCollectedTypes((prev) => [...prev, found.type]);

        // Spawn sparkle particles
        spawnParticles(newRow, newCol, COLLECTIBLE_COLORS[found.type]);

        // Show notification
        setNotification({
          text: COLLECTIBLE_LABELS[found.type],
          color: COLLECTIBLE_COLORS[found.type],
          timestamp: Date.now(),
        });
      }

      // Check win
      if (newRow === giftPos.row && newCol === giftPos.col) {
        gameStateRef.current = "won";
        setGameState("won");
        if (timerRef.current) clearInterval(timerRef.current);
      }
    },
    [giftPos, spawnParticles]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          movePlayer(1, 0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          movePlayer(0, 1);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer]);

  // Swipe controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 30;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipe) movePlayer(0, dx > 0 ? 1 : -1);
    } else {
      if (Math.abs(dy) > minSwipe) movePlayer(dy > 0 ? 1 : -1, 0);
    }
    touchStartRef.current = null;
  };

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${minutes}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="relative w-full font-[family-name:var(--font-pixel)]">
      {/* Idle state */}
      <AnimatePresence mode="wait">
        {gameState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8"
          >
            {/* Pixel art preview */}
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 relative">
                <canvas
                  ref={(el) => {
                    if (el) {
                      const ctx = el.getContext("2d");
                      if (ctx) {
                        el.width = 128;
                        el.height = 128;
                        ctx.imageSmoothingEnabled = false;
                        drawGift(ctx, 32, 24, 64, 0);
                      }
                    }
                  }}
                  width={128}
                  height={128}
                  className="w-full h-full"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            </div>

            <h3 className="text-sm md:text-base text-amber-400 mb-3 leading-relaxed">
              TEMUKAN HADIAH
              <br />
              LEBARAN!
            </h3>
            <p className="text-[8px] md:text-[10px] text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
              Navigasi labirin untuk menemukan hadiah. Kumpulkan bonus di
              sepanjang jalan!
            </p>
            <p className="text-[7px] md:text-[8px] text-gray-500 mb-5">
              ARROW KEYS / SWIPE
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-amber-300 text-[10px] md:text-xs border-2 border-emerald-500 transition-colors shadow-[0_4px_0_#064e3b] hover:shadow-[0_2px_0_#064e3b] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
            >
              &#9654; START
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playing / Won state */}
      {(gameState === "playing" || gameState === "won") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          {/* RPG HUD */}
          <div className="mb-3 bg-black/80 border-2 border-amber-600 p-2 md:p-3">
            <div className="flex justify-between items-center text-[8px] md:text-[10px]">
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-amber-400">TIME {timeStr}</span>
                <span className="text-emerald-400">STEP {moves}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-300">
                  ITEM {collectedCount}/{totalCollectibles}
                </span>
              </div>
            </div>
          </div>

          {/* Maze canvas */}
          <div
            ref={containerRef}
            className="relative mx-auto border-2 border-amber-700"
            style={{
              maxWidth: "min(100%, 420px)",
              aspectRatio: "1",
              imageRendering: "pixelated",
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
              style={{ imageRendering: "pixelated" }}
            />

            {/* Collection notification - overlaid on top of maze */}
            <AnimatePresence>
              {notification && (
                <motion.div
                  key={notification.timestamp}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  className="absolute top-3 left-0 right-0 z-10 text-center pointer-events-none"
                >
                  <div
                    className="inline-block bg-black/90 border-2 px-3 py-1.5 md:px-4 md:py-2"
                    style={{ borderColor: notification.color }}
                  >
                    <span
                      className="text-[8px] md:text-[10px] tracking-wide"
                      style={{ color: notification.color }}
                    >
                      &#10022; {notification.text} &#10022;
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Win overlay */}
            <AnimatePresence>
              {gameState === "won" && (
                <FestiveGreeting
                  moves={moves}
                  seconds={seconds}
                  collectedTypes={collectedTypes}
                  totalCollectibles={totalCollectibles}
                  onPlayAgain={startGame}
                />
              )}
            </AnimatePresence>
          </div>

          {/* D-pad controls */}
          {gameState === "playing" && (
            <div className="mt-4 flex flex-col items-center select-none">
              <div className="relative w-36 h-36 md:w-40 md:h-40">
                {/* Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 bg-gray-700 border border-gray-600 rounded-sm" />

                {/* Up */}
                <button
                  onClick={() => movePlayer(-1, 0)}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-11 h-14 md:w-12 md:h-16 bg-gray-800 hover:bg-gray-700 active:bg-gray-900 border-2 border-gray-600 active:border-gray-500 rounded-t-lg flex items-center justify-center transition-colors"
                  aria-label="Move up"
                >
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-gray-300" />
                </button>

                {/* Down */}
                <button
                  onClick={() => movePlayer(1, 0)}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-11 h-14 md:w-12 md:h-16 bg-gray-800 hover:bg-gray-700 active:bg-gray-900 border-2 border-gray-600 active:border-gray-500 rounded-b-lg flex items-center justify-center transition-colors"
                  aria-label="Move down"
                >
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-gray-300" />
                </button>

                {/* Left */}
                <button
                  onClick={() => movePlayer(0, -1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-11 md:w-16 md:h-12 bg-gray-800 hover:bg-gray-700 active:bg-gray-900 border-2 border-gray-600 active:border-gray-500 rounded-l-lg flex items-center justify-center transition-colors"
                  aria-label="Move left"
                >
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-gray-300" />
                </button>

                {/* Right */}
                <button
                  onClick={() => movePlayer(0, 1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-11 md:w-16 md:h-12 bg-gray-800 hover:bg-gray-700 active:bg-gray-900 border-2 border-gray-600 active:border-gray-500 rounded-r-lg flex items-center justify-center transition-colors"
                  aria-label="Move right"
                >
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-gray-300" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
