import { Inter } from "next/font/google";

const interInit = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const inter = interInit.variable;
export const interFont = interInit;
