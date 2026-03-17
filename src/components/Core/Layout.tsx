"use client";

import { defaultFont } from "@/utils/font";
import Navbar from "./Navbar/Navbar";
import Footer from "./Footer/Footer";
import { ReactNode } from "react";

export const LayoutType = Object.freeze({
  DEV: "dev",
  TOOLS: "tools",
  INSIGHT: "insight",
});

interface LayoutProps {
  children: ReactNode;
  type?: string;
}

export default function Layout({ children, type = LayoutType.DEV }: LayoutProps) {
  return (
    <div className={`${defaultFont} font-google-sans-flex flex flex-col min-h-screen`}>
      <Navbar type={type} />
      <main className="font-google-sans-flex flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
