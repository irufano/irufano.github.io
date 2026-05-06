"use client";
import dynamic from "next/dynamic";

export const MeteorDefenseGame = dynamic(() => import("./MeteorDefenseGame"), { ssr: false });
export const CatchTheBugGame = dynamic(() => import("./CatchTheBugGame"), { ssr: false });
