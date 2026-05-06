"use client";
import dynamic from "next/dynamic";

export const LogoAnimation = dynamic(() => import("./LogoAnimation"), { ssr: false });
export const AnimatedOrbs = dynamic(() => import("./AnimatedOrbs"), { ssr: false });
