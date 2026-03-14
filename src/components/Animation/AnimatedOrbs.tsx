"use client";

import { motion } from "framer-motion";

const orbs = [
  {
    size: "w-72 h-72",
    color: "bg-primary/20 dark:bg-primary/30",
    position: { top: "10%", left: "-5%" },
    animate: { x: [0, 80, -100, 0], y: [0, -60, 10, 0] },
    duration: 14,
    blur: "blur-3xl",
  },
  {
    size: "w-96 h-96",
    color: "bg-primary/20 dark:bg-primary/20",
    position: { top: "5%", left: "70%" },
    animate: { x: [0, -100, 30, 0], y: [0, 50, 30, 0] },
    duration: 12,
    blur: "blur-3xl",
  },
  // {
  //   size: "w-64 h-64",
  //   color: "bg-cyan-300/20 dark:bg-cyan-500/15",
  //   position: { top: "45%", left: "25%" },
  //   animate: { x: [0, 50, -30, 0], y: [0, -40, 30, 0] },
  //   duration: 20,
  //   blur: "blur-3xl",
  // },
  // {
  //   size: "w-56 h-56",
  //   color: "bg-green-300/25 dark:bg-green-600/15",
  //   position: { top: "35%", left: "70%" },
  //   animate: { x: [0, -30, 40, 0], y: [0, 50, -20, 0] },
  //   duration: 16,
  //   blur: "blur-3xl",
  // },
  // {
  //   size: "w-48 h-48",
  //   color: "bg-emerald-300/20 dark:bg-emerald-400/10",
  //   position: { top: "60%", left: "10%" },
  //   animate: { x: [0, 30, -20, 0], y: [0, -30, 40, 0] },
  //   duration: 24,
  //   blur: "blur-3xl",
  // },
  // {
  //   size: "w-80 h-80",
  //   color: "bg-teal-400/25 dark:bg-teal-500/15",
  //   position: { top: "40%", left: "80%" },
  //   animate: { x: [0, -40, 20, 0], y: [0, -30, 40, 0] },
  //   duration: 19,
  //   blur: "blur-3xl",
  // },
];

export default function AnimatedOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${orb.size} ${orb.color} ${orb.blur}`}
          style={orb.position}
          animate={orb.animate}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
